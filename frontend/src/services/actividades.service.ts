import api from './api';
import type { OtraActividad } from '../types/actividades';

export const actividadesService = {
  obtenerTodos: async () => {
    const response = await api.get<OtraActividad[]>('/otras-actividades/');
    return response.data;
  },
  crear: async (actividad: Omit<OtraActividad, 'id'>) => {
    const response = await api.post<OtraActividad>('/otras-actividades/', actividad);
    return response.data;
  },
  actualizar: async (id: number, actividad: Partial<OtraActividad>) => {
    const response = await api.put<OtraActividad>(`/otras-actividades/${id}`, actividad);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/otras-actividades/${id}`);
    return response.data;
  }
};