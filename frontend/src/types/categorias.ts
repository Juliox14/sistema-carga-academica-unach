export interface CategoriaDocente {
  id?: number;
  nombre: string;
  siglas: string;
  hsm_base: number;
  nivel_prioridad: number;
  permite_titular: boolean;
  permite_suplente: boolean;
}