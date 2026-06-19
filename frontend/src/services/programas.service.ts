import api from './api';
import type { ProgramaEducativo } from '../types/programas';

export const programasService = {

  // GET: /api/programas
  obtenerTodos: async () => {
    const response = await api.get<ProgramaEducativo[]>('/programas/');
    return response.data;
  },

  // POST: /api/programas
  crear: async (programa: Omit<ProgramaEducativo, 'id'>) => {
    const response = await api.post<ProgramaEducativo>('/programas/', programa);
    return response.data;
  },

  // PUT: /api/programas/:id
  actualizar: async (id: number, programa: Omit<ProgramaEducativo, 'id'>) => {
    const response = await api.put<ProgramaEducativo>(`/programas/${id}/`, programa);
    return response.data;
  },

  // DELETE: /api/programas/:id
  eliminar: async (id: number) => {
    const response = await api.delete(`/programas/${id}/`);
    return response.data;
  }

};