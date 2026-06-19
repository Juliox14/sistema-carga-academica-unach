import { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Loader2 } from 'lucide-react';
import { FlatInput, FlatSelect } from '../../components/ui/Form';
import type { SyntheticEvent } from 'react';
import { planesEstudioService } from '../../services/planesEstudio.service';
import type { PlanEstudios } from '../../types/planesEstudio';

interface PlanFormProps {
  isOpen: boolean;
  plan: PlanEstudios | null;
  programasOptions: { value: string; label: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlanFormSlideOver({ isOpen, plan, programasOptions, onClose, onSuccess }: PlanFormProps) {
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
      programa_educativo_id: Number(formData.get('programa_educativo_id')),
      vigente: formData.get('vigente') === 'true',
    };

    try {
      setIsSaving(true);
      if (plan?.id) {
        await planesEstudioService.actualizar(plan.id, datos);
      } else {
        await planesEstudioService.crear(datos);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar el plan de estudios.");
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
            <BookOpen size={20} />
            {plan ? 'Editar Plan' : 'Registrar Plan'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          <div key={plan?.id || 'nuevo'} className="space-y-5">
            <FlatSelect 
              name="programa_educativo_id" 
              label="Programa Educativo (Padre)" 
              defaultValue={plan ? String(plan.programa_educativo_id) : ''} 
              options={programasOptions} 
            />
            <FlatInput 
              name="nombre" 
              label="Identificador / Nombre del Plan" 
              defaultValue={plan?.nombre} 
              placeholder="Ej. PLAN 2026" 
              className="uppercase" 
              required 
            />
            <FlatSelect 
              name="vigente" 
              label="Estatus Académico" 
              defaultValue={plan ? (plan.vigente ? 'true' : 'false') : 'true'} 
              options={[{ value: 'true', label: 'Vigente (Asigna Carga)' }, { value: 'false', label: 'En Liquidación' }]} 
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Plan'}
          </button>
        </div>
      </form>
    </>
  );
}