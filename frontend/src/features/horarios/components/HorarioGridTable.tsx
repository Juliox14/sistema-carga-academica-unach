import React from 'react';
import { Trash2, Info } from 'lucide-react';
import type { HorarioClase, SugerenciaSlot } from '../../../services/horarios.service';

interface HorarioGridTableProps {
  DIAS: string[];
  horasAMostrar: number[];
  horarios: HorarioClase[];
  sugerencias: SugerenciaSlot[];
  selectedAsignacionId: number | null;
  onCellClick: (dia: string, hora: number) => void;
  onDeleteClick: (horarioId: number, e: React.MouseEvent) => void;
}

export default function HorarioGridTable({
  DIAS,
  horasAMostrar,
  horarios,
  sugerencias,
  selectedAsignacionId,
  onCellClick,
  onDeleteClick
}: HorarioGridTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
            <th className="py-3 px-3 w-20 text-center">Hora</th>
            {DIAS.map(dia => (
              <th key={dia} className="py-3 px-2 text-center w-24 capitalize">
                {dia.toLowerCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {horasAMostrar.map(hora => {
            const labelHora = `${hora.toString().padStart(2, '0')}:00 - ${(hora + 1).toString().padStart(2, '0')}:00`;

            return (
              <tr key={hora} className="hover:bg-gray-50/20">
                <td className="py-3 px-2 text-center font-bold text-gray-500 bg-gray-50/30 border-r border-gray-150">
                  {labelHora}
                </td>
                {DIAS.map(dia => {
                  const clase = horarios.find(h => h.dia_semana === dia && h.hora_inicio === hora);
                  const sug = sugerencias.find(s => s.dia_semana === dia && s.hora_inicio === hora);

                  let cellStyle = 'bg-white hover:bg-blue-50/10';
                  let tooltip = `${dia} ${labelHora}`;

                  if (clase) {
                    cellStyle = 'bg-[#002d55] text-white border-blue-900 shadow-sm';
                  } else if (sug) {
                    if (sug.afinidad === 'CONFLICTO') {
                      cellStyle = 'bg-gray-150 text-gray-400 cursor-not-allowed border-dashed';
                      tooltip = `Conflicto: ${sug.razon}`;
                    } else if (sug.afinidad === 'ALTA') {
                      cellStyle = 'bg-green-50/60 border-green-200 text-green-950 font-medium hover:bg-green-100/80';
                      tooltip = `Afinidad Alta: ${sug.razon}`;
                    } else if (sug.afinidad === 'MEDIA') {
                      cellStyle = 'bg-blue-50/60 border-blue-200 text-blue-950 hover:bg-blue-100/80';
                      tooltip = `Afinidad Media: ${sug.razon}`;
                    } else if (sug.afinidad === 'BAJA') {
                      cellStyle = 'bg-rose-50/60 border-rose-200 text-rose-950 hover:bg-rose-100/80';
                      tooltip = `Afinidad Baja: ${sug.razon}`;
                    }
                  }

                  return (
                    <td
                      key={dia}
                      onClick={() => !clase && onCellClick(dia, hora)}
                      title={tooltip}
                      className={`p-2.5 text-center border border-gray-150 transition-all select-none relative group h-[58px] ${cellStyle} ${
                        !clase && selectedAsignacionId ? 'cursor-pointer' : ''
                      }`}
                    >
                      {clase ? (
                        <div className="flex flex-col justify-between h-full text-left">
                          <div className="min-w-0">
                            <p className="font-bold text-[10px] leading-tight truncate">{clase.materia_nombre}</p>
                            <p className="text-[8px] text-blue-200 leading-tight truncate mt-0.5">{clase.docente_nombre}</p>
                          </div>
                          <button
                            onClick={(e) => onDeleteClick(clase.id, e)}
                            className="self-end p-0.5 text-blue-300 hover:text-red-400 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ) : sug?.afinidad === 'CONFLICTO' ? (
                        <div className="flex justify-center items-center h-full text-gray-300" title={sug.razon}>
                          <Info size={14} />
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
