import api from './api';
import type { CicloEscolar } from '../types/ciclos';

export const ciclosService = {
  obtenerTodos: async () => {
    const response = await api.get<CicloEscolar[]>('/ciclos/');
    return response.data;
  },
  crear: async (ciclo: Omit<CicloEscolar, 'id'>) => {
    const response = await api.post<CicloEscolar>('/ciclos/', ciclo);
    return response.data;
  },
  actualizar: async (id: number, ciclo: Partial<CicloEscolar>) => {
    const response = await api.put<CicloEscolar>(`/ciclos/${id}`, ciclo);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/ciclos/${id}`);
    return response.data;
  },
  finalizarCarga: async () => {
    const response = await api.post<CicloEscolar>('/ciclos/finalizar-carga');
    return response.data;
  },
  desfinalizarCarga: async () => {
    const response = await api.post<CicloEscolar>('/ciclos/desfinalizar-carga');
    return response.data;
  }
};