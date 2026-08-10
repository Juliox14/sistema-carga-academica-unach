export interface Materia {
  id?: number;
  nombre_asignatura: string;
  numero_periodo: number;
  hsm: number;
  plan_estudios_id: number;
  plan_estudio?: any;
  area_conocimiento_id?: number;
  es_especial?: boolean;
}