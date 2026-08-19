import ast
from app.exceptions.custom_exceptions import SecurityViolationError

# Modules that must never be imported or used
FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "shutil", "socket", 
    "requests", "urllib", "builtins", "pathlib", "pickle"
}

# Dangerous functions that must never be called
FORBIDDEN_FUNCTIONS = {
    "eval", "exec", "open", "__import__", "compile", 
    "globals", "locals", "getattr", "setattr", "delattr"
}


def validate_ast_security(python_code: str) -> bool:
    """
    Parses the generated Python code into an Abstract Syntax Tree (AST)
    and checks for prohibited module imports or unsafe function invocations.
    """
    try:
        tree = ast.parse(python_code)
    except SyntaxError as e:
        raise SecurityViolationError(f"Syntax error in generated code: {str(e)}")

    for node in ast.walk(tree):
        # Detect: import os, import sys
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_pkg = alias.name.split(".")[0]
                if root_pkg in FORBIDDEN_MODULES:
                    raise SecurityViolationError(f"Forbidden module import: {alias.name}")

        # Detect: from os import path, from subprocess import Popen
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root_pkg = node.module.split(".")[0]
                if root_pkg in FORBIDDEN_MODULES:
                    raise SecurityViolationError(f"Forbidden module import: {node.module}")

        # Detect: open(), eval(), exec(), os.system()
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_FUNCTIONS:
                raise SecurityViolationError(f"Forbidden function call: {node.func.id}()")
            elif isinstance(node.func, ast.Attribute) and node.func.attr in FORBIDDEN_FUNCTIONS:
                raise SecurityViolationError(f"Forbidden function attribute call: {node.func.attr}()")

    return True