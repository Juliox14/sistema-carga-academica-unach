export interface EstatusDocente {
  id: number;
  nombre: string;
  permite_carga: boolean;
  max_horas: number | null;
  es_prioritario: boolean;
}
