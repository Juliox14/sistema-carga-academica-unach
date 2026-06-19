import api from './api';
import type { Docente } from '../types/docentes';

export const docentesService = {
  obtenerTodos: async () => {
    const response = await api.get<Docente[]>('/docentes/');
    return response.data;
  },
  crear: async (docente: Omit<Docente, 'id'>) => {
    const response = await api.post<Docente>('/docentes/', docente);
    return response.data;
  },
  actualizar: async (id: number, docente: Partial<Docente>) => {
    const response = await api.put<Docente>(`/docentes/${id}`, docente);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/docentes/${id}`);
    return response.data;
  }
};