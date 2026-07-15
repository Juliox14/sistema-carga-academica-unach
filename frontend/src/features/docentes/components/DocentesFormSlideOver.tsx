import { useState, useEffect, useRef } from 'react';
import { X, UserCheck, Loader2 } from 'lucide-react';
import { FlatInput, FlatSelect } from '../../../components/ui/Form';
import type { SyntheticEvent } from 'react';
import { docentesService } from '../../../services/docentes.service';
import { estatusService } from '../../../services/estatus.service';
import type { Docente } from '../../../types/docentes';
import type { EstatusDocente } from '../../../types/estatus';
import type { AreaConocimiento } from '../../../types/areas';

interface DocenteFormProps {
  isOpen: boolean;
  docente: Docente | null;
  categoriasOptions: { value: string; label: string }[];
  areasDisponibles: AreaConocimiento[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocenteFormSlideOver({ isOpen, docente, categoriasOptions, areasDisponibles, onClose, onSuccess }: DocenteFormProps) {
  const [estatusList, setEstatusList] = useState<EstatusDocente[]>([]);
  const [selectedEstatusId, setSelectedEstatusId] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen) {
      const loadEstatus = async () => {
        try {
          const list = await estatusService.obtenerTodos();
          setEstatusList(list);
          if (docente) {
            setSelectedEstatusId(docente.estatus_id);
          } else {
            const activoStatus = list.find(l => l.nombre === 'ACTIVO');
            if (activoStatus) {
              setSelectedEstatusId(activoStatus.id);
            } else if (list.length > 0) {
              setSelectedEstatusId(list[0].id);
            }
          }
        } catch (err) {
          console.error("Error al cargar estatus:", err);
        }
      };
      loadEstatus();
    }
  }, [isOpen, docente]);

  useEffect(() => {
    if (!isOpen && formRef.current) {
      formRef.current.reset();
    }
  }, [isOpen]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Extraemos todos los checkboxes seleccionados
    const areasIds = formData.getAll('areas_conocimiento_ids').map(id => Number(id));

    const datos = {
      nombre: formData.get('nombre') as string,
      apellidos: formData.get('apellidos') as string,
      plaza: formData.get('plaza') as string,
      categoria_id: Number(formData.get('categoria_id')),
      hsm_personalizadas: formData.get('hsm_personalizadas') ? Number(formData.get('hsm_personalizadas')) : undefined,
      estatus_id: Number(formData.get('estatus_id')),
      correo_institucional: (formData.get('correo_institucional') as string) || undefined,
      telefono: (formData.get('telefono') as string) || undefined,
      turno: formData.get('turno') as any,
      areas_conocimiento_ids: areasIds,
    };

    try {
      setIsSaving(true);
      if (docente?.id) {
        await docentesService.actualizar(docente.id, datos as any);
      } else {
        await docentesService.crear(datos as any);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar el perfil del docente.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasArea = (areaId: number) => {
    if (!docente?.areas_conocimiento) return false;
    return docente.areas_conocimiento.some(a => a.id === areaId);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`fixed top-0 right-0 h-full w-112.5 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-[#002d55] flex items-center gap-2">
            <UserCheck size={20} />
            {docente ? 'Editar Docente' : 'Registrar Docente'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div key={docente?.id || 'nuevo'} className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <FlatInput name="nombre" label="Nombre(s)" defaultValue={docente?.nombre} placeholder="Ej. JUAN PABLO" className="uppercase" required />
              <FlatInput name="apellidos" label="Apellidos" defaultValue={docente?.apellidos} placeholder="Ej. PÉREZ LÓPEZ" className="uppercase" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FlatInput name="plaza" label="Clave de Plaza" defaultValue={docente?.plaza} placeholder="Ej. E3815" className="uppercase" required />
              <FlatSelect 
                name="estatus_id"
                label="Estatus" 
                value={selectedEstatusId} 
                onChange={(e) => setSelectedEstatusId(Number(e.target.value))}
                options={estatusList.map(est => ({
                  value: String(est.id),
                  label: est.nombre
                }))} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FlatInput name="correo_institucional" type="email" label="Correo Institucional" defaultValue={docente?.correo_institucional} placeholder="Ej. juan.perez@unach.mx" />
              <FlatInput name="telefono" label="Teléfono" defaultValue={docente?.telefono} placeholder="Ej. 961 123 4567" />
            </div>

            <FlatSelect name="categoria_id" label="Categoría de Contratación" defaultValue={docente ? String(docente.categoria_id) : ''} options={categoriasOptions} />
            
            <div className="grid grid-cols-2 gap-4">
              <FlatSelect 
                name="turno" 
                label="Turno (Horario)" 
                defaultValue={docente ? docente.turno : 'MIXTO'} 
                options={[
                  { value: 'MIXTO', label: 'Mixto (Cualquier horario)' },
                  { value: 'MATUTINO', label: 'Matutino' }, 
                  { value: 'VESPERTINO', label: 'Vespertino' }
                ]} 
              />
              <FlatInput name="hsm_personalizadas" label="HSM Personalizadas (Opcional)" type="number" min="0" step="0.5" defaultValue={docente?.hsm_personalizadas || ''} placeholder="Diferente a categoría" />
            </div>

            {/* Grid de Checkboxes para Áreas de Conocimiento */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                Áreas de Conocimiento
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border border-gray-100 bg-gray-50 rounded-sm">
                {areasDisponibles.map(area => (
                  <label key={area.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                    <input 
                      type="checkbox" 
                      name="areas_conocimiento_ids" 
                      value={area.id} 
                      defaultChecked={hasArea(area.id!)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-700 leading-tight">{area.nombre}</span>
                  </label>
                ))}
                {areasDisponibles.length === 0 && (
                  <span className="text-sm text-gray-400 col-span-2">No hay áreas registradas.</span>
                )}
              </div>
            </div>

          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Docente'}
          </button>
        </div>
      </form>
    </>
  );
}