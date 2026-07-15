import api from './api';
import type { Docente } from '../types/docentes';

export const docentesService = {
  obtenerTodos: async () => {
    const response = await api.get<Docente[]>('/docentes/');
    return response.data;
  },
  obtenerPorId: async (id: number) => {
    const response = await api.get<Docente>(`/docentes/${id}`);
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
  },
  importar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<Docente[]>('/docentes/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};