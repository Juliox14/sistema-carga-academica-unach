from typing import Optional
from src.application.ports.output.logger_port import LoggerPort
from src.domain.value_objects.log_level import LogLevel


class ModuleLogger(LoggerPort):
    # Wrapper que añade contexto de módulo a logs.
    
    def __init__(self, base_logger: LoggerPort, service_name: str, module_name: str):
        self._base_logger = base_logger
        self._service_name = service_name
        self._module_name = module_name

    def log(
        self,
        level: LogLevel,
        message: str,
        context: Optional[dict] = None,
        trace_id: Optional[str] = None,
    ) -> None:
        merged_context = {
            **(context or {}),
            "service": self._service_name,
            "module": self._module_name,
        }
        self._base_logger.log(level, message, merged_context, trace_id)


def get_module_logger(
    base_logger: LoggerPort,
    service_name: str,
    module_name: str,
) -> LoggerPort:
    # Factory que retorna un logger con contexto de módulo pre-cargado.
    return ModuleLogger(base_logger, service_name, module_name)