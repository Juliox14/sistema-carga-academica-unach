from datetime import datetime, timezone
from typing import Optional
from pymongo.collection import Collection

from src.application.ports.output.logger_port import LoggerPort
from src.domain.value_objects.log_level import LogLevel


class MongoLoggerAdapter(LoggerPort):
    def __init__(self, collection: Collection, service_name: str):
        self._collection = collection
        self._service_name = service_name

    def log(
        self,
        level: LogLevel,
        message: str,
        context: Optional[dict] = None,
        trace_id: Optional[str] = None,
    ) -> None:
        document = {
            "timestamp": datetime.now(timezone.utc),
            "level": level.value,
            "message": message,
            "service": self._service_name,
            "context": context or {},
            "trace_id": trace_id,
        }

        self._collection.insert_one(document)