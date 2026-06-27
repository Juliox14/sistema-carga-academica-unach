// src/features/areas/AreaFormSlideOver.tsx
import { useState, useEffect, useRef } from 'react';
import { X, Tags, Loader2 } from 'lucide-react';
import { FlatInput } from '../../../components/ui/Form';
import type { SyntheticEvent } from 'react';
import { areasService } from '../../../services/areas.service';
import type { AreaConocimiento } from '../../../types/areas';

interface AreaFormProps {
  isOpen: boolean;
  area: AreaConocimiento | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AreaFormSlideOver({ isOpen, area, onClose, onSuccess }: AreaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpiar el formulario al cerrarse
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
      descripcion: formData.get('descripcion') as string,
    };

    try {
      setIsSaving(true);
      if (area?.id) {
        await areasService.actualizar(area.id, datos);
      } else {
        await areasService.crear(datos);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar el área de conocimiento.");
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
            <Tags size={20} />
            {area ? 'Editar Área' : 'Registrar Área'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          <div key={area?.id || 'nuevo'} className="space-y-5">
            <FlatInput 
              name="nombre" 
              label="Nombre del Área" 
              defaultValue={area?.nombre} 
              placeholder="Ej. CIENCIAS BÁSICAS" 
              className="uppercase" 
              required 
            />
            {/* Si no tienes un componente FlatTextArea, puedes usar un FlatInput o un textarea tradicional */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Descripción (Opcional)</label>
              <textarea 
                name="descripcion" 
                defaultValue={area?.descripcion} 
                placeholder="Breve descripción de los temas que abarca..." 
                className="w-full border-b-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:border-[#002d55] focus:bg-white transition-colors resize-none h-24"
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Área'}
          </button>
        </div>
      </form>
    </>
  );
}