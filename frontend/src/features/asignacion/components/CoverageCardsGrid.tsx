import type { CoberturaTipoResumen } from '../../../types/asignaciones';
import { AlertTriangle } from 'lucide-react';

interface CoverageCardsGridProps {
  cobertura: CoberturaTipoResumen[];
  selectedSiglas: string;
  docenteSeleccionadoId: number | null;
  setDocente: (id: number) => void;
}

export default function CoverageCardsGrid({
  cobertura,
  selectedSiglas,
  docenteSeleccionadoId,
  setDocente
}: CoverageCardsGridProps) {
  const filtered = selectedSiglas
    ? cobertura.filter(cob => cob.siglas === selectedSiglas)
    : cobertura;

  return (
    <div className={`grid gap-4 ${
      filtered.length === 1 
        ? 'grid-cols-1 max-w-md mx-auto md:mx-0' 
        : 'grid-cols-1 md:grid-cols-5'
    }`}>
      {filtered.map((cob) => {
        const isTempOrEventual = cob.porcentaje === null;

        return (
          <div 
            key={cob.siglas} 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div 
              className={`absolute top-0 left-0 right-0 h-1 ${
                isTempOrEventual 
                  ? 'bg-amber-500' 
                  : cob.porcentaje! >= 100 
                    ? 'bg-emerald-500' 
                    : cob.porcentaje! >= 50 
                      ? 'bg-blue-500' 
                      : 'bg-indigo-400'
              }`}
            />

            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-gray-400 tracking-wider block uppercase">
                    {cob.siglas}
                  </span>
                  <h3 className="text-sm font-bold text-gray-800 leading-tight">
                    {cob.tipo}
                  </h3>
                </div>
                {!isTempOrEventual && (
                  <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded ${
                    cob.porcentaje! >= 100 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : cob.porcentaje! >= 50 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {cob.porcentaje}%
                  </span>
                )}
              </div>

              {!isTempOrEventual ? (
                <div className="space-y-2 pt-1">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        cob.porcentaje! >= 100 
                          ? 'bg-emerald-500' 
                          : cob.porcentaje! >= 50 
                            ? 'bg-blue-500' 
                            : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(cob.porcentaje!, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Asignadas: <strong className="text-gray-700 font-semibold">{cob.horas_asignadas}</strong></span>
                    <span>Meta: <strong className="text-gray-700 font-semibold">{cob.horas_requeridas}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="pt-1 flex-1 flex flex-col justify-between">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Total Horas: <span className="text-[#002d55] font-bold">{cob.horas_asignadas} hrs</span>
                  </div>
                  
                  <div className="space-y-1.5 max-h-27.5 overflow-y-auto pr-1">
                    {cob.docentes.length === 0 ? (
                      <span className="text-[11px] text-gray-400 italic block">Sin docentes activos</span>
                    ) : (
                      cob.docentes.map((doc) => (
                        <div 
                          key={doc.id} 
                          onClick={() => setDocente(doc.id)}
                          className={`flex flex-col p-1.5 rounded border transition-colors cursor-pointer text-left ${
                            docenteSeleccionadoId === doc.id
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-gray-50/50 hover:bg-gray-50 border-gray-150'
                          }`}
                        >
                          <span 
                            className="text-[11px] font-semibold text-gray-700 truncate block"
                            title={doc.nombre_completo}
                          >
                            {doc.nombre_completo}
                          </span>
                          
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-gray-500 font-medium">
                              {doc.horas_asignadas} hrs
                            </span>
                            {doc.alerta ? (
                              <span className="text-[9px] bg-red-50 text-red-600 px-1 py-0.2 rounded border border-red-200 font-bold flex items-center gap-0.5 animate-pulse">
                                <AlertTriangle size={8} /> Sin horas (Riesgo de baja)
                              </span>
                            ) : (
                              <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded border border-emerald-100 font-bold">
                                Activo
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
