import type { AreaConocimiento } from '../types/areas';

export interface Docente {
  id?: number;
  nombre: string;
  apellidos: string;
  plaza: string;
  categoria_id: number;
  hsm_personalizadas?: number;
  estatus: 'ACTIVO' | 'INACTIVO' | 'SABATICO' | 'PERMISO';
  turno: 'MATUTINO' | 'VESPERTINO' | 'MIXTO';
  // areas_conocimiento viene poblado desde FastAPI en los GET
  areas_conocimiento?: AreaConocimiento[]; 
  // areas_conocimiento_ids lo usamos nosotros para enviar en POST/PUT
  areas_conocimiento_ids?: number[]; 
}
