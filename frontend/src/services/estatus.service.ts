import api from './api';
import type { EstatusDocente } from '../types/estatus';

export const estatusService = {
  obtenerTodos: async () => {
    const response = await api.get<EstatusDocente[]>('/estatus-docentes/');
    return response.data;
  },
  crear: async (estatus: Omit<EstatusDocente, 'id'>) => {
    const response = await api.post<EstatusDocente>('/estatus-docentes/', estatus);
    return response.data;
  },
  actualizar: async (id: number, estatus: Partial<EstatusDocente>) => {
    const response = await api.put<EstatusDocente>(`/estatus-docentes/${id}`, estatus);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/estatus-docentes/${id}`);
    return response.data;
  }
};
