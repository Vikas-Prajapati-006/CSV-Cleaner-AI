import pandas as pd
import numpy as np
from app.utils.code_sanitizer import validate_ast_security
from app.exceptions.custom_exceptions import CSVProcessingError
from app.utils.logger import logger


def execute_transformation(df: pd.DataFrame, code: str) -> pd.DataFrame:
    """
    Validates code security via AST and executes the transformation 
    within a strictly isolated namespace containing only the DataFrame, pandas, and numpy.
    """
    # 1. AST Static Security Check
    validate_ast_security(code)
    
    # 2. Prepare isolated execution scope
    df_copy = df.copy()
    exec_namespace = {
        "pd": pd,
        "np": np,
        "df": df_copy
    }
    
    # 3. Controlled Execution (Restricting default builtins)
    try:
        exec(code, {"__builtins__": {}}, exec_namespace)
    except Exception as e:
        logger.error(f"Sandbox execution failed: {str(e)}")
        raise CSVProcessingError(f"DataFrame transformation execution failed: {str(e)}")
        
    result_df = exec_namespace.get("df")
    if not isinstance(result_df, pd.DataFrame):
        raise CSVProcessingError("Code execution did not result in a valid Pandas DataFrame.")
        
    return result_df