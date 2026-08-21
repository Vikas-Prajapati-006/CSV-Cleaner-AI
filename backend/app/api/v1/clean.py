import os
import uuid
import json
import urllib.request
import urllib.parse
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse

from app.schemas.response_models import CleanResponse
from app.core.schema_extractor import extract_dataframe_schema
from app.core.groq_engine import generate_transformation_code
from app.core.sandbox_runner import execute_transformation
from app.utils.file_cleaner import clean_old_files
from app.config import settings
from app.utils.logger import logger

router = APIRouter()

# Security Limits
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
MAX_FREE_USAGE_PER_IDENTIFIER = 3

# Upstash Redis REST Config (Permanent Cloud Memory)
UPSTASH_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")


def get_usage(identifier: str) -> int:
    """Fetches persistent usage count from Upstash Redis or local memory fallback."""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        return 0
    try:
        url = f"{UPSTASH_URL.rstrip('/')}/get/{urllib.parse.quote(identifier)}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            val = data.get("result")
            return int(val) if val is not None else 0
    except Exception as e:
        logger.error(f"Redis get_usage error: {str(e)}")
        return 0


def increment_usage(identifier: str):
    """Permanently increments usage count in Upstash Redis."""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        return
    try:
        url = f"{UPSTASH_URL.rstrip('/')}/incr/{urllib.parse.quote(identifier)}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            pass
    except Exception as e:
        logger.error(f"Redis increment_usage error: {str(e)}")


def get_client_ip(request: Request) -> str:
    """Extract real client IP across Cloudflare, Render, and Reverse Proxies."""
    # 1. Cloudflare True Client IP (Priority #1)
    cf_connecting_ip = request.headers.get("cf-connecting-ip")
    if cf_connecting_ip:
        return cf_connecting_ip.strip()

    # 2. Standard Proxy Forwarded Header
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # 3. Direct Connection
    return request.client.host if request.client else "unknown"


@router.post("/clean-csv", response_model=CleanResponse)
async def clean_csv(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    instruction: str = Form(...),
    fingerprint: str = Form(default="unknown")
):
    """
    Accepts an uploaded CSV and user instruction, generates transformation code via LLM,
    executes it within the AST-secured sandbox, and stores the resulting CSV for download.
    """
    client_ip = get_client_ip(request)
    is_localhost = client_ip in ["127.0.0.1", "localhost", "::1", "testclient"]

    # Composite identifier: combines IP + Hardware Fingerprint
    tracking_id = f"{client_ip}_{fingerprint}" if not is_localhost else "localhost_dev"

    if not is_localhost:
        current_usage = get_usage(tracking_id)
        ip_usage = get_usage(client_ip)
        
        if current_usage >= MAX_FREE_USAGE_PER_IDENTIFIER or ip_usage >= MAX_FREE_USAGE_PER_IDENTIFIER:
            raise HTTPException(
                status_code=429,
                detail=f"Free limit reached. You have already used all {MAX_FREE_USAGE_PER_IDENTIFIER} free clean credits."
            )

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    # 2. Enforce 25 MB File Size Limit (Prevents Server Crash & Memory Overflow)
    file_size = 0
    chunk_size = 1024 * 1024  # 1 MB chunk

    while chunk := await file.read(chunk_size):
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="File size exceeds the 25 MB limit. Please upload a smaller CSV."
            )

    # Reset file pointer to beginning for pandas processing
    await file.seek(0)

    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file format: {str(e)}")

    rows_before, cols_before = df.shape

    # 3. Zero-token-waste schema extraction
    schema = extract_dataframe_schema(df)

    # 4. LLM Python code generation
    code = generate_transformation_code(schema, instruction)
    logger.info(f"Generated Pandas transformation code for [{tracking_id}]:\n{code}")

    # 5. Secure isolated execution
    cleaned_df = execute_transformation(df, code)
    rows_after, cols_after = cleaned_df.shape

    # 6. Save ephemeral file to storage
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    file_id = f"{uuid.uuid4().hex}.csv"
    file_path = os.path.join(settings.STORAGE_DIR, file_id)
    cleaned_df.to_csv(file_path, index=False)

    # 7. Increment persistent cloud usage store
    if not is_localhost:
        increment_usage(tracking_id)
        increment_usage(client_ip)
        logger.info(f"Persistent Cloud Usage recorded for [{tracking_id}] and IP [{client_ip}]")

    # 8. Trigger background cleanup of old files
    background_tasks.add_task(clean_old_files, settings.STORAGE_DIR)

    return CleanResponse(
        file_id=file_id,
        rows_before=rows_before,
        rows_after=rows_after,
        columns_before=cols_before,
        columns_after=cols_after,
        preview=cleaned_df.head(10).fillna("").to_dict(orient="records"),
        generated_code=code,
        download_url=f"/api/v1/download/{file_id}"
    )


@router.get("/download/{file_id}")
def download_csv(file_id: str):
    """
    Streams the requested cleaned CSV file from ephemeral storage to the client.
    """
    file_path = os.path.join(settings.STORAGE_DIR, file_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested file has expired or does not exist.")
    return FileResponse(
        file_path,
        media_type="text/csv",
        filename=f"cleaned_{file_id}"
    )