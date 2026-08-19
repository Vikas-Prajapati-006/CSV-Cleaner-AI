import pandas as pd
from typing import Dict, Any


def extract_dataframe_schema(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Extracts structural metadata, column types, null counts, 
    and a small sample of rows to minimize token consumption when querying the LLM.
    """
    sample_df = df.head(3).copy()
    
    schema_info = {
        "columns": list(df.columns),
        "shape": {
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1])
        },
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "sample_data": sample_df.to_dict(orient="records"),
        "null_counts": {col: int(df[col].isnull().sum()) for col in df.columns}
    }
    return schema_info