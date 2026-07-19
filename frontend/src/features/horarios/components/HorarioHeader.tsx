import { Calendar } from 'lucide-react';
import type { PlanEstudios } from '../../../types/planesEstudio';
import type { CicloEscolar } from '../../../types/ciclos';

interface GrupoAbierto {
  id: number;
  ciclo_escolar_id: number;
  ciclo_escolar_nombre: string;
  plan_estudios_id: number;
  plan_estudios_nombre: string;
  numero_periodo: number;
  grupo: string;
  turno: string;
}

interface HorarioHeaderProps {
  planes: PlanEstudios[];
  cicloActivo: CicloEscolar | null;
  selectedPlanId: number | '';
  selectedGrupoId: number | '';
  gruposFiltrados: GrupoAbierto[];
  onSelectPlan: (id: number | '') => void;
  onSelectGrupo: (id: number | '') => void;
}

export default function HorarioHeader({
  planes,
  cicloActivo,
  selectedPlanId,
  selectedGrupoId,
  gruposFiltrados,
  onSelectPlan,
  onSelectGrupo
}: HorarioHeaderProps) {
  return (
    <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-2xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#002d55] flex items-center gap-2">
          <Calendar size={24} className="text-[#002d55]" />
          Creación de Horarios
        </h1>
        <p className="text-sm text-gray-500">
          Fase: Horarios de Clases | Ciclo Activo: <span className="font-semibold text-gray-700">{cicloActivo?.nombre || 'Ninguno Activo'}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-4 w-full md:w-auto">
        {/* Selector de Plan */}
        <div className="relative group">
          <select
            value={selectedPlanId}
            onChange={(e) => {
              onSelectPlan(e.target.value === '' ? '' : Number(e.target.value));
            }}
            className="border border-gray-300 bg-white rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:border-[#002d55] text-xs font-semibold text-gray-700 cursor-pointer min-w-45 shadow-xs"
          >
            <option value="">Seleccione Plan...</option>
            {planes.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        {/* Selector de Grupo */}
        <div className="relative group">
          <select
            value={selectedGrupoId}
            disabled={selectedPlanId === ''}
            onChange={(e) => {
              onSelectGrupo(e.target.value === '' ? '' : Number(e.target.value));
            }}
            className="border border-gray-300 bg-white rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:border-[#002d55] text-xs font-semibold text-gray-700 cursor-pointer min-w-45 shadow-xs disabled:opacity-50"
          >
            <option value="">Seleccione Grupo...</option>
            {gruposFiltrados.map(g => (
              <option key={g.id} value={g.id}>Semestre {g.numero_periodo}º - {g.grupo} ({g.turno})</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
