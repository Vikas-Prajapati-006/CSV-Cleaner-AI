import os
import time
from pathlib import Path
from app.utils.logger import logger


def clean_old_files(storage_dir: str, max_age_seconds: int = 900):
    """
    Scans the temporary storage directory and removes generated CSV files 
    that are older than the specified retention window (default: 15 minutes).
    """
    now = time.time()
    path = Path(storage_dir)
    if not path.exists():
        return
        
    for item in path.glob("*.csv"):
        if item.is_file():
            file_age = now - item.stat().st_mtime
            if file_age > max_age_seconds:
                try:
                    os.remove(item)
                    logger.info(f"Cleaned up expired file: {item.name}")
                except Exception as e:
                    logger.error(f"Error removing {item.name}: {e}")