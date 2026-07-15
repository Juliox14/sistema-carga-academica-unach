import { BookOpen, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import type { CicloEscolar } from '../../../types/ciclos';
import type { GrupoAsignacion } from '../../../services/horarios.service';

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

interface AsignacionesSidebarProps {
  asignaciones: GrupoAsignacion[];
  selectedAsignacionId: number | null;
  onSelectAsignacion: (id: number | null) => void;
  cicloActivo: CicloEscolar | null;
  loading: boolean;
  grupoSeleccionadoObj?: GrupoAbierto;
}

export default function AsignacionesSidebar({
  asignaciones,
  selectedAsignacionId,
  onSelectAsignacion,
  cicloActivo,
  loading,
  grupoSeleccionadoObj
}: AsignacionesSidebarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
      <div>
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
          <BookOpen size={16} className="text-[#002d55]" />
          Materias Asignadas
        </h2>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Planificación del grupo {grupoSeleccionadoObj?.grupo} ({grupoSeleccionadoObj?.turno})
        </p>
      </div>

      {/* Alerta de Carga No Cerrada */}
      {cicloActivo && !cicloActivo.carga_finalizada && (
        <div className="bg-amber-50 border border-amber-100 text-amber-900 text-xs rounded-2xl p-3.5 flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Carga Abierta:</span>
            <p className="text-amber-800 leading-normal text-[11px]">
              La secretaria académica aún no ha finalizado la carga docente de este ciclo. No se permite programar horarios de clases hasta que se cierre la planeación académica.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin text-[#002d55]" size={24} />
        </div>
      ) : asignaciones.length === 0 ? (
        <p className="text-xs text-gray-400 py-6 text-center">No hay asignaturas asociadas a este grupo.</p>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {asignaciones.map(asig => {
            const completado = asig.horas_programadas >= asig.materia_hsm;
            const esSeleccionado = selectedAsignacionId === asig.id;

            return (
              <div
                key={asig.id}
                onClick={() => {
                  if (cicloActivo?.carga_finalizada) {
                    onSelectAsignacion(esSeleccionado ? null : asig.id);
                  }
                }}
                className={`p-3 border transition-all duration-200 rounded-xl ${
                  !cicloActivo?.carga_finalizada
                    ? 'opacity-65 cursor-not-allowed bg-gray-50 border-gray-150'
                    : esSeleccionado
                    ? 'border-[#002d55] bg-blue-50/15 shadow-xs ring-1 ring-[#002d55]'
                    : completado
                    ? 'border-green-200 bg-green-50/10 cursor-pointer hover:bg-green-50/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer hover:shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">
                      {asig.docente_nombre || 'Sin Docente'}
                    </span>
                    <h3 className="text-[11.5px] font-bold text-gray-800 leading-tight">
                      {asig.materia_nombre}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {asig.horas_programadas} / {asig.materia_hsm} hrs
                  </span>

                  {completado && (
                    <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-150 flex items-center gap-0.5">
                      <Sparkles size={10} className="text-green-600 shrink-0" />
                      Completo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
