// src/features/materias/MateriaFormSlideOver.tsx
import { useState, useEffect, useRef } from 'react';
import { X, Library, Loader2 } from 'lucide-react';
import { FlatInput, FlatSelect } from '../ui/Form';
import type { SyntheticEvent } from 'react';
import { materiasService } from '../../services/materias.service';
import type { Materia } from '../../types/materias';

interface MateriaFormProps {
  isOpen: boolean;
  materia: Materia | null;
  planesOptions: { value: string; label: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MateriaFormSlideOver({ isOpen, materia, planesOptions, onClose, onSuccess }: MateriaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpiar el formulario físicamente al cerrarse
  useEffect(() => {
    if (!isOpen && formRef.current) {
      formRef.current.reset();
    }
  }, [isOpen]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Convertimos los campos numéricos a Number() para evitar errores en FastAPI
    const datos = {
      clave: formData.get('clave') as string,
      nombre: formData.get('nombre') as string,
      semestre: Number(formData.get('semestre')),
      hsm: Number(formData.get('hsm')),
      plan_estudios_id: Number(formData.get('plan_estudios_id')),
    };

    try {
      setIsSaving(true);
      if (materia?.id) {
        await materiasService.actualizar(materia.id, datos);
      } else {
        await materiasService.crear(datos);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar la materia.");
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
            <Library size={20} />
            {materia ? 'Editar Materia' : 'Registrar Materia'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          <div key={materia?.id || 'nuevo'} className="space-y-5">
            <FlatSelect 
              name="plan_estudios_id" 
              label="Plan de Estudios" 
              defaultValue={materia ? String(materia.plan_estudios_id) : ''} 
              options={planesOptions} 
            />
            
            <div className="flex gap-4">
              <FlatInput 
                name="clave" 
                label="Clave" 
                defaultValue={materia?.clave} 
                placeholder="Ej. MAT-101" 
                className="uppercase w-1/3" 
                required 
              />
              <FlatInput 
                name="nombre" 
                label="Nombre de la Unidad de Aprendizaje" 
                defaultValue={materia?.nombre} 
                placeholder="Ej. INGENIERÍA DE SOFTWARE" 
                className="uppercase w-2/3" 
                required 
              />
            </div>

            <div className="flex gap-4">
              <FlatInput 
                name="semestre" 
                label="Semestre" 
                type="number"
                min="1"
                max="10"
                defaultValue={materia ? String(materia.semestre) : ''} 
                required 
              />
              <FlatInput 
                name="hsm" 
                label="HSM (Horas)" 
                type="number"
                min="1"
                defaultValue={materia ? String(materia.hsm) : ''} 
                required 
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Materia'}
          </button>
        </div>
      </form>
    </>
  );
}