import { useEffect, useState } from 'react';
import { useOficiosStore } from '../store/useOficiosStore';
import { Send, FileText, CheckCircle2, Eye, Check, Copy, Clock, Search, Loader2, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditoriaOficios() {
  const { oficiosEmitidos, isLoading, fetchOficiosEmitidos, emitirOficios } = useOficiosStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Estados del Modal de Emisión
  const [isEmitModalOpen, setIsEmitModalOpen] = useState(false);
  const [selectedCategorias, setSelectedCategorias] = useState<string[] | undefined>(undefined);
  const [selectedLabel, setSelectedLabel] = useState('');
  
  // Parámetros de folio manual
  const [folioPrefijo, setFolioPrefijo] = useState('D/SA/');
  const [folioInicial, setFolioInicial] = useState<number | ''>(1);
  const [folioSufijo, setFolioSufijo] = useState('');

  // Strict signature locks for phases
  const fase1Oficios = oficiosEmitidos.filter(o => o.tipo_contrato === 'PTC' || o.tipo_contrato === 'PMT');
  const fase1Habilitada = fase1Oficios.length > 0 && fase1Oficios.every(o => o.estado === 'FIRMADO');

  const fase2Oficios = oficiosEmitidos.filter(o => o.tipo_contrato === 'PAS' || o.tipo_contrato === 'PAT');
  const fase2Habilitada = fase2Oficios.length > 0 && fase2Oficios.every(o => o.estado === 'FIRMADO');

  useEffect(() => {
    fetchOficiosEmitidos().catch(err => console.error(err));
    // Auto-detectar año actual para el sufijo (ej: /26)
    const shortYear = new Date().getFullYear().toString().slice(-2);
    setFolioSufijo(`/${shortYear}`);
  }, [fetchOficiosEmitidos]);

  const handleEmitirMasivoClick = (categorias?: string[], label?: string) => {
    setSelectedCategorias(categorias);
    setSelectedLabel(label || 'todos los docentes activos');
    
    // Sugerir dinámicamente el siguiente folio libre analizando los emitidos
    let maxSeq = 0;
    for (const o of oficiosEmitidos) {
      const parts = o.numero_oficio.split('/');
      if (parts.length >= 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    setFolioInicial(maxSeq === 0 ? 1 : maxSeq + 1);
    setIsEmitModalOpen(true);
  };

  const confirmEmitMasivo = async () => {
    if (folioInicial === '') {
      toast.error('Por favor, ingresa un número de folio inicial.');
      return;
    }
    
    setIsEmitModalOpen(false);
    try {
      const res = await emitirOficios(
        selectedCategorias,
        folioPrefijo,
        folioInicial,
        folioSufijo
      );
      toast.success(res.mensaje);
      fetchOficiosEmitidos();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al emitir los oficios.';
      toast.error(msg);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success('Sello digital copiado al portapapeles.');
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtrado de oficios
  const filteredOficios = oficiosEmitidos.filter(o => {
    const matchesSearch = o.docente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.numero_oficio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = selectedEstado === 'TODOS' || o.estado === selectedEstado;
    return matchesSearch && matchesEstado;
  });

  // Estadísticas del ciclo
  const total = oficiosEmitidos.length;
  const firmados = oficiosEmitidos.filter(o => o.estado === 'FIRMADO').length;
  const leidos = oficiosEmitidos.filter(o => o.estado === 'LEIDO').length;
  const pendientes = oficiosEmitidos.filter(o => o.estado === 'EMITIDO').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#002d55]/10 flex items-center justify-center text-[#002d55]">
              <Eye size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Consola de Auditoría y Emisión
            </h1>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Liberación de cargas y monitoreo de firmas del ciclo activo
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleEmitirMasivoClick(['PTC', 'PMT'], 'Tiempo Completo y Medio Tiempo (PTC y PMT)')}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#002d55] hover:bg-[#0038C3] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>Fase 1: Publicar PTC & PMT</span>
          </button>
          
          <button
            onClick={() => handleEmitirMasivoClick(['PAS', 'PAT'], 'Asignatura Base y Temporal (PAS y PAT)')}
            disabled={isLoading || !fase1Habilitada}
            title={fase1Oficios.length === 0 ? 'Debe publicar la Fase 1 primero' : fase1Oficios.some(o => o.estado !== 'FIRMADO') ? 'Esperando firmas de conformidad de la Fase 1' : 'Publicar Fase 2'}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>Fase 2: Publicar PAS & PAT</span>
          </button>

          <button
            onClick={() => handleEmitirMasivoClick(['PAE'], 'Asignatura Eventual (PAE)')}
            disabled={isLoading || !fase2Habilitada}
            title={fase2Oficios.length === 0 ? 'Debe publicar la Fase 2 primero' : fase2Oficios.some(o => o.estado !== 'FIRMADO') ? 'Esperando firmas de conformidad de la Fase 2' : 'Publicar Fase 3'}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>Fase 3: Publicar PAE</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-2">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Total Emitidos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800">{total}</span>
            <span className="text-xs font-semibold text-gray-400 uppercase">Documentos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-2">
          <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest block">Firmados Conformidad</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">{firmados}</span>
            <span className="text-xs font-semibold text-green-500 uppercase">({total > 0 ? Math.round((firmados/total)*100) : 0}%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-2">
          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest block">Leídos / Enterados</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{leidos}</span>
            <span className="text-xs font-semibold text-blue-500 uppercase">({total > 0 ? Math.round((leidos/total)*100) : 0}%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-2">
          <span className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest block">Pendientes Lectura</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-yellow-600">{pendientes}</span>
            <span className="text-xs font-semibold text-yellow-500 uppercase">({total > 0 ? Math.round((pendientes/total)*100) : 0}%)</span>
          </div>
        </div>

      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        
        {/* Controles de Búsqueda y Filtro */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Buscar docente o número de oficio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Filtrar Estado:</span>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700 cursor-pointer"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="EMITIDO">EMITIDO (Pendiente)</option>
              <option value="LEIDO">LEÍDO (Notificado)</option>
              <option value="FIRMADO">FIRMADO (Conformidad)</option>
            </select>
          </div>

        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-[#002d55]" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Docente / Categoría</th>
                  <th className="px-6 py-4">Oficio / Folio</th>
                  <th className="px-6 py-4">Estado Ciclo</th>
                  <th className="px-6 py-4">Sello Digital Criptográfico</th>
                  <th className="px-6 py-4">IP / Sello de Tiempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredOficios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-gray-400 font-semibold italic">
                      No se encontraron registros de oficios emitidos.
                    </td>
                  </tr>
                ) : (
                  filteredOficios.map(oficio => (
                    <tr key={oficio.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 block">{oficio.docente_nombre}</span>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[9px] text-[#002d55] font-bold uppercase tracking-wider block bg-blue-50 border border-blue-200/50 px-1.5 py-0.5 rounded-md w-max">
                              {oficio.plantilla_nombre}
                            </span>
                            {oficio.estado === 'RECHAZADO' && (
                              <span className="text-[8px] text-red-600 bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider block">
                                Carga Declinada
                              </span>
                            )}
                          </div>
                          {oficio.estado === 'RECHAZADO' && oficio.observaciones_rechazo && (
                            <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700 max-w-xs font-semibold leading-relaxed">
                              <span className="font-bold block uppercase text-[8px] text-red-500 mb-0.5">Motivo del Rechazo:</span>
                              "{oficio.observaciones_rechazo}"
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Folio */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 font-mono font-semibold">
                          <FileText size={13} className="text-gray-400" />
                          <span>{oficio.numero_oficio}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        {oficio.estado === 'FIRMADO' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold text-[10px]">
                            <CheckCircle2 size={11} />
                            FIRMADO
                          </span>
                        )}
                        {oficio.estado === 'LEIDO' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">
                            <Eye size={11} />
                            LEÍDO
                          </span>
                        )}
                        {oficio.estado === 'EMITIDO' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full font-bold text-[10px]">
                            <Clock size={11} />
                            PENDIENTE
                          </span>
                        )}
                        {oficio.estado === 'RECHAZADO' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[10px]">
                            <X size={11} />
                            RECHAZADO
                          </span>
                        )}
                      </td>

                      {/* Sello Digital */}
                      <td className="px-6 py-4">
                        {oficio.hash_firma ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md block max-w-44 truncate">
                              {oficio.hash_firma}
                            </span>
                            <button
                              onClick={() => handleCopyHash(oficio.hash_firma!)}
                              className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Copiar sello digital"
                            >
                              {copiedHash === oficio.hash_firma ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Sin firmar</span>
                        )}
                      </td>

                      {/* IP / Info */}
                      <td className="px-6 py-4">
                        {oficio.ip_firma ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-gray-500 font-bold block">IP: {oficio.ip_firma}</span>
                            <span className="text-[9px] text-gray-400 block">
                              {oficio.fecha_firma ? new Date(oficio.fecha_firma).toLocaleString('es-MX') : new Date(oficio.fecha_lectura!).toLocaleString('es-MX')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No registrado</span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal de Emisión con Folio Manual */}
      {isEmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl p-6 space-y-5">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Publicar Cargas y Emitir Oficios
              </h3>
              <button 
                onClick={() => setIsEmitModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Warning/Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2.5 items-start">
              <AlertCircle className="text-[#002d55] shrink-0 mt-0.5" size={16} />
              <div className="text-[11px] text-[#002d55] font-semibold leading-relaxed">
                Estás publicando la carga académica para <strong className="underline">{selectedLabel}</strong>. 
                Define la numeración manual de folios para este lote de oficios. El sistema autoincrementará la numeración consecutivamente para cada docente.
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Prefijo</label>
                  <input 
                    type="text"
                    value={folioPrefijo}
                    onChange={(e) => setFolioPrefijo(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002d55] text-gray-700 uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Inicio Folio</label>
                  <input 
                    type="number"
                    min="1"
                    value={folioInicial}
                    onChange={(e) => setFolioInicial(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002d55] text-gray-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sufijo / Año</label>
                  <input 
                    type="text"
                    value={folioSufijo}
                    onChange={(e) => setFolioSufijo(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002d55] text-gray-700 uppercase"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="font-bold text-gray-500 uppercase text-[10px]">Primer folio emitido:</span>
                <span className="font-mono font-bold text-[#002d55] text-sm tracking-wide bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100">
                  {folioPrefijo}{String(folioInicial || 0).padStart(3, '0')}{folioSufijo}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                onClick={() => setIsEmitModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmEmitMasivo}
                disabled={isLoading || folioInicial === ''}
                className="px-4 py-2 bg-[#002d55] hover:bg-[#0038C3] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Confirmar y Publicar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
