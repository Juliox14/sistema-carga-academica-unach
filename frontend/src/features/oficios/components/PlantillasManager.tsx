import React, { useEffect, useState } from 'react';
import { useOficiosStore } from '../store/useOficiosStore';
import type { Plantilla } from '../store/useOficiosStore';
import { Plus, Code, Layers, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import WYSIWYGEditor from './WYSIWYGEditor';
import PlantillasList from './PlantillasList';
import { ConfirmAlert } from '../../../components/ui/ConfirmAlert';
import { handlePreview } from '../utils/previewGenerator';

export default function PlantillasManager() {
  const { 
    plantillas, 
    isLoading, 
    fetchPlantillas, 
    crearPlantilla, 
    activarPlantilla,
    actualizarPlantilla,
    eliminarPlantilla 
  } = useOficiosStore();

  const [editingId, setEditingId] = useState<number | null>(null);

  // Estados para ConfirmAlert de eliminación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [nombre, setNombre] = useState('');
  const [tiposContrato, setTiposContrato] = useState<string[]>(['PTC']);
  const [requiereFirma, setRequiereFirma] = useState(true);

  // Campos estructurados de plantilla
  const [lugarEmision, setLugarEmision] = useState('Tuxtla Gutiérrez, Chiapas');
  const [asunto, setAsunto] = useState('ENVÍO DE CARGA PROGRAMADA');
  const [destinatarios, setDestinatarios] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [despedida, setDespedida] = useState('ATENTAMENTE\n"POR LA CONCIENCIA DE LA NECESIDAD DE SERVIR"');
  const [remitenteNombre, setRemitenteNombre] = useState('');
  const [remitenteCargo, setRemitenteCargo] = useState('ENCARGADA DE SECRETARÍA ACADÉMICA');
  const [conCopiaPara, setConCopiaPara] = useState('');

  useEffect(() => {
    fetchPlantillas().catch(err => console.error(err));
  }, [fetchPlantillas]);

  const handleEdit = (plantilla: Plantilla) => {
    setEditingId(plantilla.id);
    setNombre(plantilla.nombre);
    setTiposContrato(plantilla.tipos_contrato || []);
    setRequiereFirma(plantilla.requiere_firma);
    setLugarEmision(plantilla.lugar_emision || '');
    setAsunto(plantilla.asunto || '');
    setDestinatarios(plantilla.destinatarios || '');
    setCuerpoHtml(plantilla.cuerpo_html || '');
    setDespedida(plantilla.despedida || '');
    setRemitenteNombre(plantilla.remitente_nombre || '');
    setRemitenteCargo(plantilla.remitente_cargo || '');
    setConCopiaPara(plantilla.con_copia_para || '');

    // Desplazar la pantalla suavemente hacia el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(`Editando plantilla: ${plantilla.nombre}`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNombre('');
    setCuerpoHtml('');
    setDestinatarios('');
    setConCopiaPara('');
    setRemitenteNombre('');
    // Reestablecer a valores default
    setLugarEmision('Tuxtla Gutiérrez, Chiapas');
    setAsunto('ENVÍO DE CARGA PROGRAMADA');
    setTiposContrato(['PTC']);
    setDespedida('ATENTAMENTE\n"POR LA CONCIENCIA DE LA NECESIDAD DE SERVIR"');
    setRemitenteCargo('ENCARGADA DE SECRETARÍA ACADÉMICA');
  };

  const handleEliminarClick = (id: number) => {
    setDeleteTemplateId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTemplateId === null) return;
    setIsDeleting(true);

    try {
      await eliminarPlantilla(deleteTemplateId);
      toast.success('Plantilla eliminada exitosamente.');
      if (editingId === deleteTemplateId) {
        handleCancelEdit();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al eliminar la plantilla. Posiblemente esté asociada a oficios ya emitidos.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
      setDeleteTemplateId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      toast.error('Por favor, ingresa un nombre para la plantilla.');
      return;
    }
    if (tiposContrato.length === 0) {
      toast.error('Debes seleccionar al menos un tipo de contrato.');
      return;
    }
    if (!cuerpoHtml) {
      toast.error('El cuerpo del oficio no puede estar vacío.');
      return;
    }

    const payload = {
      nombre,
      tipos_contrato: tiposContrato,
      requiere_firma: requiereFirma,
      lugar_emision: lugarEmision,
      asunto: asunto,
      destinatarios: destinatarios,
      cuerpo_html: cuerpoHtml,
      despedida: despedida,
      remitente_nombre: remitenteNombre,
      remitente_cargo: remitenteCargo,
      con_copia_para: conCopiaPara
    };

    try {
      if (editingId !== null) {
        await actualizarPlantilla(editingId, payload);
        toast.success('Plantilla actualizada y guardada exitosamente.');
        setEditingId(null);
      } else {
        await crearPlantilla(payload);
        toast.success('Plantilla creada y guardada exitosamente.');
      }
      
      setNombre('');
      setTiposContrato(['PTC']);
      fetchPlantillas();
      setCuerpoHtml('');
      setDestinatarios('');
      setConCopiaPara('');
      setRemitenteNombre('');
    } catch (err) {
      toast.error('Error al guardar la plantilla.');
    }
  };

  const handleActivar = async (id: number) => {
    try {
      await activarPlantilla(id);
      toast.success('Plantilla activada para este tipo de contrato.');
    } catch (err) {
      toast.error('Error al activar la plantilla.');
    }
  };

  const loadDefaultTemplate = async () => {
    try {
      const response = await fetch('/presets/unach_oficio_preset.md');
      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo md de presets');
      }
      const text = await response.text();
      
      const sections = text.split('\n# ');
      const preset: Record<string, string> = {};
      
      const firstSec = sections[0].startsWith('# ') ? sections[0].substring(2) : sections[0];
      const firstLines = firstSec.split('\n');
      const firstKey = firstLines[0].trim();
      const firstVal = firstLines.slice(1).join('\n').trim();
      if (firstKey) preset[firstKey] = firstVal;

      for (let i = 1; i < sections.length; i++) {
        const lines = sections[i].split('\n');
        const key = lines[0].trim();
        const value = lines.slice(1).join('\n').trim();
        if (key) preset[key] = value;
      }

      if (preset.lugar_emision) setLugarEmision(preset.lugar_emision);
      if (preset.asunto) setAsunto(preset.asunto);
      
      if (tiposContrato.includes('PAE')) {
        setDestinatarios(preset.destinatarios_pae || '');
      } else {
        setDestinatarios(preset.destinatarios_default || '');
      }

      if (preset.cuerpo_html) setCuerpoHtml(preset.cuerpo_html);
      if (preset.despedida) setDespedida(preset.despedida);
      if (preset.remitente_nombre) setRemitenteNombre(preset.remitente_nombre);
      if (preset.remitente_cargo) setRemitenteCargo(preset.remitente_cargo);
      if (preset.con_copia_para) setConCopiaPara(preset.con_copia_para);

      toast.success('Preset oficial cargado desde archivo MD.');
    } catch (error) {
      console.error('Error al cargar preset desde MD:', error);
      toast.error('No se pudo cargar el preset preestablecido. Verifique que el archivo public/presets/unach_oficio_preset.md exista.');
    }
  };

  const triggerPreview = () => {
    handlePreview({
      nombre,
      tipoContrato: tiposContrato.length > 0 ? tiposContrato[0] : 'PTC',
      lugarEmision,
      asunto,
      destinatarios,
      cuerpoHtml,
      despedida,
      remitenteNombre,
      remitenteCargo,
      conCopiaPara
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#002d55]/10 flex items-center justify-center text-[#002d55]">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Gestor de Plantillas de Oficios
            </h1>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Configuración paramétrica de machotes institucionales con membrete fijo
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de plantillas en la izquierda (Componente Dividido con acciones) */}
        <div className="lg:col-span-1">
          <PlantillasList 
            plantillas={plantillas} 
            isLoading={isLoading} 
            onActivar={handleActivar} 
            onEdit={handleEdit}
            onEliminar={handleEliminarClick}
          />
        </div>

        {/* Formulario de plantilla en la derecha */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                {editingId !== null ? 'Editar Plantilla de Oficio' : 'Nueva Plantilla de Oficio'}
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">
                Completa los campos del oficio. Los logos y membrete serán fijos.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={triggerPreview}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Eye size={12} />
                Vista Previa (PDF)
              </button>
              <button
                type="button"
                onClick={loadDefaultTemplate}
                className="px-3 py-1.5 border border-dashed border-[#002d55] hover:bg-blue-50 text-[#002d55] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Code size={12} />
                Cargar Preset UNACH
              </button>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                  Nombre de Plantilla
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Oficio Asignatura Eventual 2026-2"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
                />
              </div>

              {/* Tipos Contrato */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                  Tipos de Contrato
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['PTC', 'PMT', 'PAS', 'PAT', 'PAE', 'HONORARIOS'].map((tc) => (
                    <label key={tc} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer p-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
                      <input 
                        type="checkbox"
                        className="accent-[#002d55] w-3.5 h-3.5 cursor-pointer"
                        checked={tiposContrato.includes(tc)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTiposContrato([...tiposContrato, tc]);
                          } else {
                            setTiposContrato(tiposContrato.filter(t => t !== tc));
                          }
                        }}
                      />
                      {tc}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lugar de Emisión */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                  Lugar de Emisión
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tuxtla Gutiérrez, Chiapas"
                  value={lugarEmision}
                  onChange={(e) => setLugarEmision(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
                />
              </div>

              {/* Asunto */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                  Asunto del Oficio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ENVÍO DE CARGA PROGRAMADA"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
                />
              </div>
            </div>

            {/* Dirección CC */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                Destinatarios / Dirección (CC)
              </label>
              <textarea
                required
                rows={3}
                placeholder="CC. DOCENTES DE ASIGNATURA...&#10;ESCUELA DE TECNOLOGÍAS DIGITALES...&#10;E D I F I C I O&#10;P R E S E N T E"
                value={destinatarios}
                onChange={(e) => setDestinatarios(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
              />
            </div>

            {/* Cuerpo del Oficio (WYSIWYG Editor Dividido) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                Cuerpo del Oficio (Texto Enriquecido)
              </label>
              <WYSIWYGEditor 
                value={cuerpoHtml} 
                onChange={setCuerpoHtml} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Leyenda / Despedida */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                  Despedida / Leyenda
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej: ATENTAMENTE&#10;'POR LA CONCIENCIA DE LA NECESIDAD DE SERVIR'"
                  value={despedida}
                  onChange={(e) => setDespedida(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
                />
              </div>

              {/* Con copia para (CCP) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                  Con Copia Para (C.c.p.)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: C.c.p. Dirección de la ETDA C-I..."
                  value={conCopiaPara}
                  onChange={(e) => setConCopiaPara(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Remitente Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                  Remitente (Quien Firma)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: DRA. PAOLA LÓPEZ Y LÓPEZ"
                  value={remitenteNombre}
                  onChange={(e) => setRemitenteNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
                />
              </div>

              {/* Remitente Cargo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
                  Cargo del Remitente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ENCARGADA DE SECRETARÍA ACADÉMICA"
                  value={remitenteCargo}
                  onChange={(e) => setRemitenteCargo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:bg-white transition-all text-gray-700"
                />
              </div>
            </div>

            {/* Checkbox requiere firma */}
            <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="requiere_firma"
                checked={requiereFirma}
                onChange={(e) => setRequiereFirma(e.target.checked)}
                className="w-4 h-4 text-[#002d55] focus:ring-[#002d55] border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="requiere_firma" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                Exigir Firma Electrónica con contraseña (doble factor de conformidad)
              </label>
            </div>

            {/* Submit & Cancel */}
            <div className="flex justify-end gap-2.5">
              {editingId !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar Edición
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 bg-[#002d55] hover:bg-[#0038C3] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                {editingId !== null ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
              </button>
            </div>

          </form>

        </div>

      </div>

      {/* Alerta de Confirmación de Eliminación tipo SIPAD */}
      <ConfirmAlert 
        isOpen={isConfirmOpen}
        title="Eliminar Plantilla de Oficio"
        message="¿Estás seguro de que deseas eliminar esta plantilla de forma permanente? Esta acción no se puede deshacer y el sistema validará que no esté en uso por ningún oficio emitido."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeleteTemplateId(null);
        }}
        isLoading={isDeleting}
      />

    </div>
  );
}
