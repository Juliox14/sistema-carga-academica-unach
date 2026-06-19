import api from './api';

export const aperturaService = {
  obtenerSugerencias: async (planId: number) => {
    const response = await api.get<{ sugerencias: Record<number, number> }>(`/aperturas/sugerencias/${planId}`);
    return response.data.sugerencias;
  },
  
  ejecutar: async (payload: { plan_estudios_id: number; configuracion_grupos: Record<number, number> }) => {
    const response = await api.post('/aperturas/ejecutar', payload);
    return response.data;
  }
};