import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { estatusService } from '../../../services/estatus.service';
import type { EstatusDocente } from '../../../types/estatus';

export default function EstatusDocentesDashboard() {
  const [estatusList, setEstatusList] = useState<EstatusDocente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [permiteCarga, setPermiteCarga] = useState(true);
  const [maxHoras, setMaxHoras] = useState<string>('');
  const [esPrioritario, setEsPrioritario] = useState(false);

  const cargarEstatus = async () => {
    try {
      setIsLoading(true);
      const data = await estatusService.obtenerTodos();
      setEstatusList(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar la lista de estatus.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarEstatus();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setNombre('');
    setPermiteCarga(true);
    setMaxHoras('');
    setEsPrioritario(false);
    setIsModalOpen(true);
  };

  const openEditModal = (est: EstatusDocente) => {
    setEditingId(est.id);
    setNombre(est.nombre);
    setPermiteCarga(est.permite_carga);
    setMaxHoras(est.max_horas !== null ? String(est.max_horas) : '');
    setEsPrioritario(est.es_prioritario);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre del estatus es obligatorio.');
      return;
    }

    const payload = {
      nombre: nombre.trim().toUpperCase(),
      permite_carga: permiteCarga,
      max_horas: maxHoras.trim() !== '' ? Number(maxHoras) : null,
      es_prioritario: esPrioritario
    };

    try {
      if (editingId) {
        await estatusService.actualizar(editingId, payload);
        toast.success('Estatus actualizado correctamente.');
      } else {
        await estatusService.crear(payload);
        toast.success('Estatus creado correctamente.');
      }
      setIsModalOpen(false);
      cargarEstatus();
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail || 'Error al guardar estatus.';
      toast.error(detail);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (['ACTIVO', 'INACTIVO', 'SABÁTICO', 'SABATICO'].includes(name.toUpperCase())) {
      toast.error('No se pueden eliminar los estatus esenciales del sistema.');
      return;
    }

    if (!window.confirm(`¿Está seguro de eliminar el estatus "${name}"?`)) {
      return;
    }

    try {
      await estatusService.eliminar(id);
      toast.success('Estatus eliminado correctamente.');
      cargarEstatus();
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail || 'No se pudo eliminar el estatus.';
      toast.error(detail);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando catálogo de estatus...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Estatus de Docentes</h3>
          <p className="text-sm text-gray-500 mt-1">
            Gestione las reglas de asignación y las limitaciones horarias por estatus académico.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[#002d55] hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer text-sm"
        >
          <Plus size={16} /> Nuevo Estatus
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Nombre de Estatus</th>
                <th className="py-4 px-6 text-center">Permite Carga</th>
                <th className="py-4 px-6 text-center">Carga Prioritaria</th>
                <th className="py-4 px-6 text-center">Límite de Horas</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {estatusList.map((est) => (
                <tr key={est.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-6 font-medium text-gray-900 uppercase">
                    {est.nombre}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                      est.permite_carga 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {est.permite_carga ? <Check size={16} /> : <X size={16} />}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {est.es_prioritario ? (
                      <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-200">
                        <ShieldCheck size={14} /> Prioritario
                      </span>
                    ) : (
                      <span className="text-gray-400 font-light">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {est.max_horas !== null ? (
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200 text-xs font-bold">
                        Max {est.max_horas} HSM
                      </span>
                    ) : (
                      <span className="text-gray-500 italic text-xs">Sin límite (Contrato)</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(est)}
                      className="text-gray-400 hover:text-[#002d55] p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer inline-flex"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(est.id, est.nombre)}
                      className={`p-1.5 rounded hover:bg-gray-100 transition-colors inline-flex cursor-pointer ${
                        ['ACTIVO', 'INACTIVO', 'SABÁTICO', 'SABATICO'].includes(est.nombre.toUpperCase())
                          ? 'text-gray-200 cursor-not-allowed opacity-50'
                          : 'text-gray-400 hover:text-red-600'
                      }`}
                      disabled={['ACTIVO', 'INACTIVO', 'SABÁTICO', 'SABATICO'].includes(est.nombre.toUpperCase())}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {estatusList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                    No se encontraron estatus registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200 transform transition-all">
            <div className="bg-[#002d55] text-white px-6 py-4 flex justify-between items-center">
              <h4 className="font-bold text-lg">
                {editingId ? 'Editar Estatus' : 'Nuevo Estatus'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Nombre de Estatus
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. COMISIONADO, LICENCIA SGS, etc."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <h5 className="text-sm font-semibold text-gray-800">¿Permite Carga Académica?</h5>
                  <p className="text-xs text-gray-500">Habilita la asignación de materias o actividades.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permiteCarga}
                    onChange={() => setPermiteCarga(!permiteCarga)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <h5 className="text-sm font-semibold text-gray-800">¿Asignación Prioritaria?</h5>
                  <p className="text-xs text-gray-500">Coloca a los docentes al inicio de las sugerencias (ej. Sabáticos).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esPrioritario}
                    onChange={() => setEsPrioritario(!esPrioritario)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Límite de Horas Máximo (Opcional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={maxHoras}
                    onChange={(e) => setMaxHoras(e.target.value)}
                    placeholder="Sin límite"
                    className="w-32 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                  />
                  <span className="text-xs text-gray-500">
                    HSM permitidas. Dejar en blanco para no restringir (se usará el contrato/categoría).
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002d55] text-white text-sm font-medium rounded-lg hover:bg-[#001f3b] cursor-pointer shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
