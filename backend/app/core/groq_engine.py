import re
from groq import Groq
from app.config import settings
from app.utils.logger import logger
from app.exceptions.custom_exceptions import LLMCodeGenerationError

client = Groq(api_key=settings.GROQ_API_KEY)

SYSTEM_PROMPT = """You are an expert Python data-engineering assistant.
Your sole job is to write high-performance Pandas code to transform a DataFrame named `df`.

RULES:
1. The DataFrame is pre-loaded as `df`.
2. Do NOT import os, sys, subprocess, open, or execute file I/O operations.
3. You may use pandas (`pd`), numpy (`np`), or standard string/datetime operations.
4. Mutate `df` directly or re-assign `df = ...`.
5. Return ONLY executable Python code enclosed inside a single markdown block: ```python ... ```.
6. Provide NO conversational text, explanations, or extra markdown.
"""


def generate_transformation_code(schema: dict, user_prompt: str) -> str:
    """
    Constructs a context-rich prompt using minimal metadata schema
    and requests the Groq model to return executable Pandas cleaning code.
    """
    user_message = f"""Dataset Schema:
Columns: {schema['columns']}
Shape: {schema['shape']['rows']} rows, {schema['shape']['columns']} columns
Dtypes: {schema['dtypes']}
Null Counts: {schema['null_counts']}
Sample Rows: {schema['sample_data']}

Instruction: {user_prompt}

Write the pandas transformation script to update `df` according to the instruction."""

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1,
            max_tokens=1024
        )
        content = response.choices[0].message.content
        match = re.search(r"```(?:python)?\s*(.*?)\s*```", content, re.DOTALL)
        code = match.group(1).strip() if match else content.strip()
        return code
    except Exception as e:
        logger.error(f"Groq API code generation failed: {str(e)}")
        raise LLMCodeGenerationError(str(e))