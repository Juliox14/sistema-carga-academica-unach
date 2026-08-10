import api from './api';

export interface UnidadAcademica {
  id: number;
  nombre: string;
  clave: string;
  campus: number;
  ciudad?: string;
  direccion?: string;
}

export const unidadesService = {
  obtenerTodas: async (): Promise<UnidadAcademica[]> => {
    const response = await api.get('/unidades-academicas/');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<UnidadAcademica> => {
    const response = await api.get(`/unidades-academicas/${id}`);
    return response.data;
  }
};
