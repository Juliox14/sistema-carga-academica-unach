export interface CicloEstadoUnidad {
  unidad_academica_id: number;
  unidad_academica_nombre: string;
  activo: boolean;
  carga_finalizada: boolean;
}

export interface CicloEscolar {
  id?: number;
  nombre: string;
  mes_inicio: number; 
  mes_final: number;
  anio: number;
  activo: boolean;
  carga_finalizada?: boolean;
  estados_unidades?: CicloEstadoUnidad[];
}
