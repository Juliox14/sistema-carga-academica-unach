import { useState, useEffect, useRef } from 'react';
import { X, Activity, Loader2 } from 'lucide-react';
import { FlatInput } from '../../../components/ui/Form';
import type { OtraActividad } from '../../../types/actividades';
import type { SyntheticEvent } from 'react';
import { actividadesService } from '../../../services/actividades.service';

interface ActividadFormProps {
  isOpen: boolean;
  actividad: OtraActividad | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ActividadFormSlideOver({ isOpen, actividad, onClose, onSuccess }: ActividadFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isOpen && formRef.current) {
      formRef.current.reset();
    }
  }, [isOpen]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const datos = {
      nombre: formData.get('nombre') as string,
      hsm: Number(formData.get('hsm')),
    };

    try {
      setIsSaving(true);
      if (actividad?.id) {
        await actividadesService.actualizar(actividad.id, datos);
      } else {
        await actividadesService.crear(datos);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar la actividad.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`fixed top-0 right-0 h-full w-100 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-[#002d55] flex items-center gap-2">
            <Activity size={20} />
            {actividad ? 'Editar Actividad' : 'Registrar Actividad'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          <div key={actividad?.id || 'nuevo'} className="space-y-5">
            <FlatInput 
              name="nombre" 
              label="Nombre de la Actividad" 
              defaultValue={actividad?.nombre} 
              placeholder="Ej. TUTORÍAS" 
              className="uppercase" 
              required 
            />
            <FlatInput 
              name="hsm" 
              label="HSM (Horas)" 
              type="number"
              min="1"
              defaultValue={actividad ? String(actividad.hsm) : ''} 
              required 
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Actividad'}
          </button>
        </div>
      </form>
    </>
  );
}