import type { AreaConocimiento } from '../types/areas';
import type { EstatusDocente } from './estatus';

export interface Docente {
  id?: number;
  nombre: string;
  apellidos: string;
  plaza: string;
  categoria_id: number;
  hsm_personalizadas?: number;
  estatus_id: number;
  estatus?: EstatusDocente;
  correo_institucional?: string;
  telefono?: string;
  turno: 'MATUTINO' | 'VESPERTINO' | 'MIXTO';
  areas_conocimiento?: AreaConocimiento[]; 
  areas_conocimiento_ids?: number[]; 
}
