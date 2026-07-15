import { useState, useEffect } from 'react';
import { Printer, User, Loader2, Calendar, CheckSquare, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { categoriasService } from '../../services/categorias.service';
import type { CategoriaDocente } from '../../types/categorias';

export default function HorariosReport() {
  const [categorias, setCategorias] = useState<CategoriaDocente[]>([]);
  const [selectedSiglas, setSelectedSiglas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Signature configurations
  const [formuloNombre, setFormuloNombre] = useState('Mtra. Paola López y López');
  const [formuloPuesto, setFormuloPuesto] = useState('Secretaria Académica');

  const [voboNombre, setVoboNombre] = useState('Dra. María de los Ángeles Polanco Enciso');
  const [voboPuesto, setVoboPuesto] = useState('Encargada de la Dirección');

  const [aprogNombre, setAprogNombre] = useState('Dr. Manuel Gustavo Ocampo Muñoa');
  const [aprogPuesto, setAprogPuesto] = useState('Director General');

  const [apresNombre, setApresNombre] = useState('Dra. María Concepción Ruiz Ruiz');
  const [apresPuesto, setApresPuesto] = useState('Dir. de Programación y Presupuesto');

  const [apagoNombre, setApagoNombre] = useState('Mtro. Romeo Alexander Salazar Maldonado');
  const [apagoPuesto, setApagoPuesto] = useState('Dir. de Personal y Prest. Sociales');

  useEffect(() => {
    const fetchCats = async () => {
      setLoading(true);
      try {
        const data = await categoriasService.obtenerTodos();
        setCategorias(data);
        // By default, select all categories
        setSelectedSiglas(data.map(c => c.siglas));
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar las categorías de docentes.');
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  const handleToggleCategory = (siglas: string) => {
    if (selectedSiglas.includes(siglas)) {
      setSelectedSiglas(selectedSiglas.filter(s => s !== siglas));
    } else {
      setSelectedSiglas([...selectedSiglas, siglas]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSiglas.length === categorias.length) {
      setSelectedSiglas([]);
    } else {
      setSelectedSiglas(categorias.map(c => c.siglas));
    }
  };

  const handleGenerarReporte = async () => {
    if (selectedSiglas.length === 0) {
      toast.error('Debe seleccionar al menos una categoría de docente.');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.get('/asignaciones/reporte-pad', {
        params: {
          categorias: selectedSiglas.join(','),
          formulo_nombre: formuloNombre,
          formulo_puesto: formuloPuesto,
          vobo_nombre: voboNombre,
          vobo_puesto: voboPuesto,
          aprog_nombre: aprogNombre,
          aprog_puesto: aprogPuesto,
          apres_nombre: apresNombre,
          apres_puesto: apresPuesto,
          apago_nombre: apagoNombre,
          apago_puesto: apagoPuesto
        },
        responseType: 'text'
      });

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(response.data);
        printWindow.document.close();
      } else {
        toast.error('No se pudo abrir la ventana de impresión. Habilite las ventanas emergentes en su navegador.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al generar el reporte de horarios.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Calendar size={13} className="text-[#002d55]" />
            Reportes Institucionales
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Planeación Académica Docente (PAD)
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Configure las firmas oficiales al calce y filtre los docentes por sus categorías correspondientes para emitir las grillas de horarios académicas en lote.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Filter Categories */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Categorías de Docentes
            </h2>
            {categorias.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-bold text-[#002d55] hover:text-[#0038C3] cursor-pointer"
              >
                {selectedSiglas.length === categorias.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 className="animate-spin text-[#002d55]" size={20} />
              <span className="text-[10px] font-semibold uppercase">Cargando categorías...</span>
            </div>
          ) : categorias.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-6">No hay categorías registradas.</p>
          ) : (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {categorias.map(cat => {
                const isSelected = selectedSiglas.includes(cat.siglas);
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleToggleCategory(cat.siglas)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#002d55]/5 border-[#002d55]/30 text-gray-800'
                        : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50 text-gray-500'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block">{cat.nombre}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-200/60 px-1.5 py-0.5 rounded-md text-gray-600">
                        {cat.siglas}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckSquare size={16} className="text-[#002d55] shrink-0" />
                    ) : (
                      <Square size={16} className="text-gray-300 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Trigger Card */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleGenerarReporte}
              disabled={generating || loading || selectedSiglas.length === 0}
              className="w-full py-3 bg-[#002d55] hover:bg-[#0038C3] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generando reporte...
                </>
              ) : (
                <>
                  <Printer size={14} />
                  Generar Horarios (PAD)
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2.5 leading-relaxed">
              * El reporte consolidará en un solo documento imprimible a todos los docentes de las categorías seleccionadas que cuenten con horarios.
            </p>
          </div>
        </div>

        {/* Right Side: Signatures Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-5 lg:col-span-2">
          <div className="pb-2 border-b border-gray-50">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Firmas Autorizadas al Calce (Plantilla)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Formulo */}
            <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-[#002d55]">
                <User size={14} />
                <h3 className="text-xs font-bold uppercase tracking-wider">1. Formuló</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nombre</label>
                  <input
                    type="text"
                    value={formuloNombre}
                    onChange={e => setFormuloNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Puesto / Cargo</label>
                  <input
                    type="text"
                    value={formuloPuesto}
                    onChange={e => setFormuloPuesto(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
              </div>
            </div>

            {/* Vo. Bo. */}
            <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-[#002d55]">
                <User size={14} />
                <h3 className="text-xs font-bold uppercase tracking-wider">2. Vo. Bo.</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nombre</label>
                  <input
                    type="text"
                    value={voboNombre}
                    onChange={e => setVoboNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Puesto / Cargo</label>
                  <input
                    type="text"
                    value={voboPuesto}
                    onChange={e => setVoboPuesto(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
              </div>
            </div>

            {/* Autorizacion Programatica */}
            <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-[#002d55]">
                <User size={14} />
                <h3 className="text-xs font-bold uppercase tracking-wider">3. Autorización Programática</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nombre</label>
                  <input
                    type="text"
                    value={aprogNombre}
                    onChange={e => setAprogNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Puesto / Cargo</label>
                  <input
                    type="text"
                    value={aprogPuesto}
                    onChange={e => setAprogPuesto(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
              </div>
            </div>

            {/* Autorizacion Presupuestal */}
            <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-[#002d55]">
                <User size={14} />
                <h3 className="text-xs font-bold uppercase tracking-wider">4. Autorización Presupuestal</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nombre</label>
                  <input
                    type="text"
                    value={apresNombre}
                    onChange={e => setApresNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Puesto / Cargo</label>
                  <input
                    type="text"
                    value={apresPuesto}
                    onChange={e => setApresPuesto(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
              </div>
            </div>

            {/* Autorizacion de Pago */}
            <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 md:col-span-2">
              <div className="flex items-center gap-2 text-[#002d55]">
                <User size={14} />
                <h3 className="text-xs font-bold uppercase tracking-wider">5. Autorización de Pago</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nombre</label>
                  <input
                    type="text"
                    value={apagoNombre}
                    onChange={e => setApagoNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Puesto / Cargo</label>
                  <input
                    type="text"
                    value={apagoPuesto}
                    onChange={e => setApagoPuesto(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#002d55]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
