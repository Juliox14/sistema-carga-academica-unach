import api from "./api";
import type { ConfiguracionUpdateRequest } from "../types/configuracion";

export const actualizarConfiguraciones = async (configuraciones: ConfiguracionUpdateRequest[]) => {
  const response = await api.put<ConfiguracionUpdateRequest[]>("/configuraciones/", configuraciones);
  return response.data;
};