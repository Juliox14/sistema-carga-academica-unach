from datetime import datetime, timezone
from typing import Optional

from src.application.ports.output.logger_port import LoggerPort
from src.domain.value_objects.log_level import LogLevel


class ConsoleLoggerAdapter(LoggerPort):
    def log(
        self,
        level: LogLevel,
        message: str,
        context: Optional[dict] = None,
        trace_id: Optional[str] = None,
    ) -> None:
        timestamp = datetime.now(timezone.utc).isoformat()
        log_record = {
            "timestamp": timestamp,
            "level": level.value,
            "message": message,
            "context": context or {},
            "trace_id": trace_id,
        }

        print(log_record)
