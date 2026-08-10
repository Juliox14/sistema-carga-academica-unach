import api from './api';

export interface InvitacionDocente {
  id: number;
  docente_id: number;
  docente_nombre: string;
  unidad_origen_id: number;
  unidad_origen_nombre: string;
  unidad_destino_id: number;
  unidad_destino_nombre: string;
  ciclo_escolar_id: number;
  ciclo_escolar_nombre: string;
  horas_propuestas: number;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  mensaje?: string;
  respuesta?: string;
  created_at?: string;
}

export interface InvitacionCreatePayload {
  docente_id: number;
  unidad_destino_id: number;
  ciclo_escolar_id: number;
  horas_propuestas: number;
  mensaje?: string;
}

export const invitacionesService = {
  crearInvitacion: async (payload: InvitacionCreatePayload): Promise<InvitacionDocente> => {
    const response = await api.post('/invitaciones-docente/', payload);
    return response.data;
  },

  obtenerRecibidas: async (): Promise<InvitacionDocente[]> => {
    const response = await api.get('/invitaciones-docente/recibidas');
    return response.data;
  },

  obtenerEnviadas: async (): Promise<InvitacionDocente[]> => {
    const response = await api.get('/invitaciones-docente/enviadas');
    return response.data;
  },

  obtenerPendientesCount: async (): Promise<number> => {
    const response = await api.get('/invitaciones-docente/pendientes-count');
    return response.data.count;
  },

  aceptar: async (id: number): Promise<InvitacionDocente> => {
    const response = await api.put(`/invitaciones-docente/${id}/aceptar`);
    return response.data;
  },

  rechazar: async (id: number, respuesta?: string): Promise<InvitacionDocente> => {
    const response = await api.put(`/invitaciones-docente/${id}/rechazar`, { respuesta });
    return response.data;
  }
};
