import type { AreaConocimiento } from '../types/areas';
import type { EstatusDocente } from './estatus';

export interface Docente {
  id?: number;
  nombre: string;
  apellidos?: string;
  plaza?: string;
  categoria_id: number;
  hsm_personalizadas?: number;
  estatus_id: number;
  estatus?: EstatusDocente;
  correo_institucional?: string;
  telefono?: string;
  turno: 'MATUTINO' | 'VESPERTINO' | 'MIXTO';
  es_comodin?: boolean;
  unidad_academica_id?: number;
  unidades?: any[];
  areas_conocimiento?: AreaConocimiento[];
  areas_conocimiento_ids?: number[];
  // Campos PAD
  rfc?: string;
  curp?: string;
  fecha_ingreso?: string; // ISO date string YYYY-MM-DD
  perfil_academico?: string;
  ultimo_grado_estudio?: string;
}
