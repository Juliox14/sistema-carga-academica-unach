from typing import Optional
from src.application.ports.output.logger_port import LoggerPort
from src.domain.value_objects.log_level import LogLevel

class CompositeLoggerAdapter(LoggerPort):
    def __init__(self, loggers: list[LoggerPort]):
        self._loggers = loggers

    def log(self, level: LogLevel, message: str, context=None, trace_id=None) -> None:
        for logger in self._loggers:
            try:
                logger.log(level, message, context, trace_id)
            except Exception as err:
                print(f"Exception found, {err}")
                continue