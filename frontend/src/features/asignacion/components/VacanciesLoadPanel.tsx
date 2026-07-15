import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react';

interface VacanciesLoadPanelProps {
  vacantes: any[];
  isLoadingVacantes: boolean;
  onOpen: () => void;
}

export default function VacanciesLoadPanel({
  vacantes,
  isLoadingVacantes,
  onOpen
}: VacanciesLoadPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-4">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            onOpen();
          }
        }}
        className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/70 transition-colors flex justify-between items-center text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#002d55]" />
          <span>Ver vacantes disponibles en la carga</span>
          <span className="bg-blue-100 text-[#002d55] text-xs font-extrabold px-2.5 py-0.5 rounded-full">
            {vacantes.length} vacantes
          </span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>

      {isOpen && (
        <div className="border-t border-gray-150 p-4 bg-white overflow-x-auto max-h-96 overflow-y-auto">
          {isLoadingVacantes ? (
            <div className="text-center py-6 text-gray-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-[#002d55]" size={20} />
              <span>Cargando vacantes...</span>
            </div>
          ) : vacantes.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
              <CheckCircle2 size={32} className="text-emerald-500" />
              <span className="font-semibold text-emerald-750">
                No hay vacantes en este ciclo. Todas las materias del plan han sido asignadas.
              </span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50">
                  <th className="py-2.5 px-4">Asignatura</th>
                  <th className="py-2.5 px-4 text-center">Periodo</th>
                  <th className="py-2.5 px-4 text-center">Grupo</th>
                  <th className="py-2.5 px-4 text-center">Turno</th>
                  <th className="py-2.5 px-4 text-center">HSM</th>
                  <th className="py-2.5 px-4">Plan de Estudios</th>
                  <th className="py-2.5 px-4">Programa Educativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {vacantes.map((v, index) => (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-800">{v.asignatura}</td>
                    <td className="py-3 px-4 text-center text-gray-600 font-medium">{v.periodo}º</td>
                    <td className="py-3 px-4 text-center text-gray-700 font-semibold">{v.grupo}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.turno === 'MATUTINO' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                        v.turno === 'VESPERTINO' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-gray-50 text-gray-750 border border-gray-100'
                      }`}>
                        {v.turno}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">{v.hsm} hrs</td>
                    <td className="py-3 px-4 text-gray-600">{v.plan_estudios}</td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{v.programa_educativo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
