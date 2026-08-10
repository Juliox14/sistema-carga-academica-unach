export interface ProgramaEducativo {
    id: number;
    clave: string;
    nombre: string;
    activo: boolean;
    nivel: string;
    unidad_academica_id?: number;
    unidad_academica?: any;
}