import api from './api';
import type { AreaConocimiento } from '../types/areas';

export const areasService = {
  obtenerTodos: async () => {
    const response = await api.get<AreaConocimiento[]>('/areas-conocimiento/');
    return response.data;
  },
  crear: async (area: Omit<AreaConocimiento, 'id'>) => {
    const response = await api.post<AreaConocimiento>('/areas-conocimiento/', area);
    return response.data;
  },
  actualizar: async (id: number, area: Partial<AreaConocimiento>) => {
    const response = await api.put<AreaConocimiento>(`/areas-conocimiento/${id}`, area);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/areas-conocimiento/${id}`);
    return response.data;
  }
};