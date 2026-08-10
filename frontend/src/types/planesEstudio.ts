export interface PlanEstudios {
    id: number;
    nombre: string;
    programa_educativo_id: number;
    programa_educativo?: any;
    vigente: boolean;
}