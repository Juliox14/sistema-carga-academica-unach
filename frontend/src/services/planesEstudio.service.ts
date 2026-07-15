import api from './api';
import type { PlanEstudios } from '../types/planesEstudio';

export const planesEstudioService = {

  // GET: /api/planes
  obtenerTodos: async () => {
    const response = await api.get<PlanEstudios[]>('/planes-estudios/');
    return response.data;
  },

  // POST: /api/planes
  crear: async (plan: Omit<PlanEstudios, 'id'>) => {
    const response = await api.post<PlanEstudios>('/planes-estudios/', plan);
    return response.data;
  },

  // PUT: /api/planes/:id
  actualizar: async (id: number, plan: Omit<PlanEstudios, 'id'>) => {
    const response = await api.put<PlanEstudios>(`/planes-estudios/${id}/`, plan);
    return response.data;
  },

  // DELETE: /api/planes/:id
  eliminar: async (id: number) => {
    const response = await api.delete(`/planes-estudios/${id}/`);
    return response.data;
  },

  importar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/planes-estudios/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

};