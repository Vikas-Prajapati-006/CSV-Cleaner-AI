class CSVProcessingError(Exception):
    """Raised when DataFrame transformation, data parsing, or Pandas execution fails."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class SecurityViolationError(Exception):
    """Raised when restricted modules, dangerous AST patterns, or injection attempts are detected."""
    def __init__(self, message: str = "Malicious or restricted code pattern detected."):
        self.message = message
        super().__init__(self.message)


class LLMCodeGenerationError(Exception):
    """Raised when the LLM service fails to generate valid, executable transformation logic."""
    def __init__(self, message: str = "Failed to generate valid executable transformation logic."):
        self.message = message
        super().__init__(self.message)