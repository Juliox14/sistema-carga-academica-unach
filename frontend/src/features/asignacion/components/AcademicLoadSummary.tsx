import { useEffect, useState } from 'react';
import { useAsignacionStore } from '../store/useAsignacionStore';
import { AlertTriangle, ChevronDown, ChevronUp, User, Clock, CheckCircle2, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function AcademicLoadSummary() {
  const { 
    resumenCarga, 
    fetchResumenCarga, 
    setDocente, 
    docenteSeleccionadoId,
    selectedCategoriaId,
    categoriasDocentes,
    setSelectedCategoriaId
  } = useAsignacionStore();

  const [isIncompleteListOpen, setIsIncompleteListOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(() => {
    const saved = localStorage.getItem('sipad_load_summary_visible');
    return saved !== 'false';
  });

  useEffect(() => {
    fetchResumenCarga();
  }, [fetchResumenCarga]);

  const toggleVisibility = () => {
    const nextState = !isPanelVisible;
    setIsPanelVisible(nextState);
    localStorage.setItem('sipad_load_summary_visible', String(nextState));
  };

  if (!resumenCarga) {
    return (
      <div className="bg-white p-6 border border-gray-200 shadow-sm animate-pulse flex flex-col gap-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const { cobertura, docentes_incompletos } = resumenCarga;

  // Encontrar siglas de la categoría seleccionada
  const selectedCatObj = categoriasDocentes.find(c => c.id === selectedCategoriaId);
  const selectedSiglas = selectedCatObj ? selectedCatObj.siglas : '';

  // Filtrar cobertura y docentes incompletos
  const filteredCobertura = selectedSiglas
    ? cobertura.filter(cob => cob.siglas === selectedSiglas)
    : cobertura;

  const filteredIncompletos = selectedSiglas
    ? docentes_incompletos.filter(doc => doc.siglas === selectedSiglas)
    : docentes_incompletos;

  return (
    <section className="space-y-4">
      {/* Barra de cabecera con botón de Ocultar/Mostrar */}
      <div className="flex justify-between items-center bg-white border border-gray-200 px-5 py-3 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#002d55]" />
          <h2 className="text-sm font-bold text-gray-800">
            Resumen de Cobertura y Carga Docente
            {selectedSiglas && (
              <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                Filtrado por: {selectedSiglas}
              </span>
            )}
          </h2>
        </div>
        <button
          onClick={toggleVisibility}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#002d55] transition-colors focus:outline-none px-2.5 py-1.5 rounded hover:bg-gray-100 cursor-pointer"
        >
          {isPanelVisible ? (
            <>
              <EyeOff size={14} />
              <span>Ocultar Panel</span>
            </>
          ) : (
            <>
              <Eye size={14} />
              <span>Mostrar Resumen ({filteredIncompletos.length} incompletos)</span>
            </>
          )}
        </button>
      </div>

      {isPanelVisible && (
        <div className="space-y-4 transition-all duration-300">
          {/* 1. Grid de tarjetas de cobertura filtradas */}
          <div className={`grid gap-4 ${
            filteredCobertura.length === 1 
              ? 'grid-cols-1 max-w-md mx-auto md:mx-0' 
              : 'grid-cols-1 md:grid-cols-5'
          }`}>
            {filteredCobertura.map((cob) => {
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
                        
                        <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
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

          {/* 2. Botón Desplegable para Cargas Incompletas Filtradas */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setIsIncompleteListOpen(!isIncompleteListOpen)}
              className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/70 transition-colors flex justify-between items-center text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <span>Ver docentes con cargas incompletas</span>
                <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  {filteredIncompletos.length} docentes pendientes {selectedSiglas ? `(${selectedSiglas})` : ''}
                </span>
              </div>
              {isIncompleteListOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
            </button>

            {/* 3. Panel Desplegable (Tabla de Docentes Filtrados) */}
            {isIncompleteListOpen && (
              <div className="border-t border-gray-150 p-4 bg-white overflow-x-auto max-h-96 overflow-y-auto">
                {filteredIncompletos.length === 0 ? (
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
                      {filteredIncompletos.map((doc) => {
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
        </div>
      )}
    </section>
  );
}
