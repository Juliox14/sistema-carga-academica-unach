from abc import ABC, abstractmethod
from typing import Optional
from src.domain.value_objects.log_level import LogLevel

class LoggerPort(ABC):
    @abstractmethod
    def log(
        self,
        level: LogLevel,
        message: str,
        context: Optional[dict] = None,
        trace_id: Optional[str] = None,
    ) -> None: ...

    def debug(self, message:str, **kwargs) -> None:
        self.log(LogLevel.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs) -> None:
        self.log(LogLevel.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs) -> None:
        self.log(LogLevel.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs) -> None:
        self.log(LogLevel.ERROR, message, **kwargs)