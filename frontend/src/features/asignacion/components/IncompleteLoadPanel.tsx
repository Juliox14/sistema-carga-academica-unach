import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, CheckCircle2, User, ChevronRight } from 'lucide-react';
import type { DocenteIncompletoResumen } from '../../../types/asignaciones';

interface IncompleteLoadPanelProps {
  incompletos: DocenteIncompletoResumen[];
  selectedSiglas: string;
  docenteSeleccionadoId: number | null;
  setDocente: (id: number) => void;
  setSelectedCategoriaId: (id: number | '') => void;
}

export default function IncompleteLoadPanel({
  incompletos,
  selectedSiglas,
  docenteSeleccionadoId,
  setDocente,
  setSelectedCategoriaId
}: IncompleteLoadPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filtered = selectedSiglas
    ? incompletos.filter(doc => doc.siglas === selectedSiglas)
    : incompletos;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/70 transition-colors flex justify-between items-center text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-500" />
          <span>Ver docentes con cargas incompletas</span>
          <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
            {filtered.length} docentes pendientes {selectedSiglas ? `(${selectedSiglas})` : ''}
          </span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>

      {isOpen && (
        <div className="border-t border-gray-150 p-4 bg-white overflow-x-auto max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
              <CheckCircle2 size={32} className="text-emerald-500" />
              <span className="font-semibold text-emerald-700">
                {selectedSiglas 
                  ? `¡Excelente! Todos los docentes de tipo ${selectedSiglas} tienen sus cargas completas.` 
                  : '¡Excelente! Todos los docentes tienen sus cargas completas.'
                }
              </span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50">
                  <th className="py-2.5 px-4">Docente</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4 text-center">Avance de Horas</th>
                  <th className="py-2.5 px-4 text-center">Horas Pendientes</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filtered.map((doc) => {
                  const isSelected = docenteSeleccionadoId === doc.id;
                  const pct = doc.horas_requeridas > 0 ? (doc.horas_asignadas / doc.horas_requeridas) * 100 : 0;
                  
                  return (
                    <tr 
                      key={doc.id} 
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSelected ? 'bg-blue-50/50 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-bold text-gray-800">{doc.nombre_completo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-semibold border border-gray-200 uppercase tracking-wider text-[10px]">
                          {doc.siglas}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-gray-700">
                            {doc.horas_asignadas} / {doc.horas_requeridas} hrs
                          </span>
                          <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full" 
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">
                          {doc.horas_pendientes} hrs
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setDocente(doc.id);
                            setSelectedCategoriaId(''); // Reset al buscar
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className={`px-3 py-1.5 rounded font-bold transition-all text-[11px] inline-flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                              : 'bg-[#002d55]/10 text-[#002d55] hover:bg-[#002d55]/20'
                          }`}
                        >
                          <span>{isSelected ? 'Seleccionado' : 'Asignar carga'}</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
