import pytest
import pandas as pd
from app.utils.code_sanitizer import validate_ast_security
from app.core.sandbox_runner import execute_transformation
from app.exceptions.custom_exceptions import SecurityViolationError


def test_valid_pandas_code_passes():
    """Verify that safe Pandas operations pass AST verification."""
    safe_code = "df['clean_col'] = df['raw_col'].str.strip()"
    assert validate_ast_security(safe_code) is True


def test_forbidden_module_import_fails():
    """Verify that unauthorized module imports are intercepted."""
    malicious_code = "import os\nos.system('ls')"
    with pytest.raises(SecurityViolationError):
        validate_ast_security(malicious_code)


def test_dangerous_function_call_fails():
    """Verify that unsafe built-in functions are blocked."""
    malicious_code = "eval('1 + 1')"
    with pytest.raises(SecurityViolationError):
        validate_ast_security(malicious_code)


def test_safe_transformation_execution():
    """Verify end-to-end safe DataFrame execution within sandbox."""
    df = pd.DataFrame({"name": [" Alice ", "Bob "]})
    code = "df['name'] = df['name'].str.strip()"
    result_df = execute_transformation(df, code)
    assert result_df["name"].tolist() == ["Alice", "Bob"]