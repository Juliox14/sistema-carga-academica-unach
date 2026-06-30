export type TabType = 'carga' | 'descargas' | 'otras';

export interface MateriaAsignadaDTO {
  asignacion_id: number;
  materia_id: number;
  asignatura: string;
  periodo: number;
  grupo: string;
  hsm: number;
  motivo_descarga: string | null;
  es_temporal: boolean;
  // Nota: Si en el futuro quieres mostrar quién cubre la descarga, 
  // tendrás que agregarlo a tu backend y descomentar la siguiente línea:
  // profesor_cubre?: string | null; 
}

export interface OtraActividadAsignadaDTO {
  asignacion_actividad_id: number;
  actividad: string;
  horas: number;
  observaciones: string | null;
}

export interface ActividadBaseDTO {
  id: number;
  nombre: string;
  hsm: number;
}

export interface MateriaDisponibleDTO {
  materia_id: number;
  grupo_abierto_id: number;
  asignatura: string;
  periodo: number;
  grupo: string;
  hsm: number;
  // Nota: Si implementas la vista especial para Eventuales, 
  // agrega estos campos a tu Pydantic y descoméntalos aquí:
  es_cobertura?: boolean;
  titular_original?: string;
}

export interface TableroDocenteResponse {
  docente_id: number;
  nombre_completo: string;
  hsm_base: number;
  horas_frente_grupo: number;
  horas_descargadas: number;
  horas_otras_actividades: number;
  suma_total: number;
  carga_academica: MateriaAsignadaDTO[];
  descargas: MateriaAsignadaDTO[];
  otras_actividades: OtraActividadAsignadaDTO[];
}

export interface PlanEstudio {
  id: number;
  nombre: string;
}

export interface CategoriaDocente {
  id: number;
  nombre: string;
  siglas: string;
}

export interface DocenteFiltrado {
  id: number;
  nombre_completo: string;
  categoria: string;
  siglas_categoria: string;
}

export interface CatalogosBaseResponse {
  planes_estudio: PlanEstudio[];
  categorias_docentes: CategoriaDocente[];
  actividades: ActividadBaseDTO[];
}

export interface DesglosePuntaje {
  historial: number;
  area: number;
  turno: number;
  prioridad: number;
  carga: number;
}

export interface MateriaSugeridaDTO extends MateriaDisponibleDTO {
  score_total: number;
  veces_impartida: number;
  desglose: DesglosePuntaje;
}

export interface DocenteCargaDetalle {
  id: number;
  nombre_completo: string;
  horas_asignadas: number;
  alerta: boolean;
}

export interface CoberturaTipoResumen {
  tipo: string;
  siglas: string;
  horas_asignadas: number;
  horas_requeridas: number;
  porcentaje: number | null;
  docentes: DocenteCargaDetalle[];
}

export interface DocenteIncompletoResumen {
  id: number;
  nombre_completo: string;
  tipo: string;
  siglas: string;
  horas_asignadas: number;
  horas_requeridas: number;
  horas_pendientes: number;
}

export interface ResumenCargaResponse {
  cobertura: CoberturaTipoResumen[];
  docentes_incompletos: DocenteIncompletoResumen[];
}