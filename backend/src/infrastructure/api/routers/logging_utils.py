from typing import Optional

from fastapi import Request

from src.application.ports.output.logger_port import LoggerPort


def get_logger(request: Request) -> LoggerPort:
    """Inyecta el logger desde el estado de la aplicación o usa un fallback de consola."""
    logger = getattr(request.app.state, "logger", None)
    if logger is None:
        from src.infrastructure.adapters.output.logging.console_logger_adapter import ConsoleLoggerAdapter

        return ConsoleLoggerAdapter()
    return logger


def get_trace_id(request: Request) -> Optional[str]:
    """Obtiene el trace_id del request cuando existe."""
    return getattr(request.state, "trace_id", None)
