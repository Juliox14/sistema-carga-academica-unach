import { useState, useEffect, useRef } from 'react';
import { X, Briefcase, Loader2 } from 'lucide-react';
import { FlatInput, FlatSelect } from '../../components/ui/Form';
import type { SyntheticEvent } from 'react';
import type { CategoriaDocente } from '../../types/categorias';
import { categoriasService } from '../../services/categorias.service';

interface CategoriaFormProps {
  isOpen: boolean;
  categoria: CategoriaDocente | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoriaFormSlideOver({ isOpen, categoria, onClose, onSuccess }: CategoriaFormProps) {
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
      siglas: formData.get('siglas') as string,
      hsm_base: Number(formData.get('hsm_base')),
      nivel_prioridad: Number(formData.get('nivel_prioridad')),
      es_comodin: formData.get('es_comodin') === 'true',
    };

    try {
      setIsSaving(true);
      if (categoria?.id) {
        await categoriasService.actualizar(categoria.id, datos);
      } else {
        await categoriasService.crear(datos);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar la categoría docente.");
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
            <Briefcase size={20} />
            {categoria ? 'Editar Categoría' : 'Registrar Categoría'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          <div key={categoria?.id || 'nuevo'} className="space-y-5">
            <div className="flex gap-4">
              <FlatInput 
                name="siglas" 
                label="Siglas" 
                defaultValue={categoria?.siglas} 
                placeholder="Ej. PTC" 
                className="uppercase w-1/3" 
                required 
              />
              <FlatInput 
                name="nombre" 
                label="Nombre de la Categoría" 
                defaultValue={categoria?.nombre} 
                placeholder="Ej. PROFESOR DE TIEMPO COMPLETO" 
                className="uppercase w-2/3" 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FlatInput 
                name="hsm_base" 
                label="HSM Base" 
                type="number"
                min="0"
                defaultValue={categoria ? String(categoria.hsm_base) : ''} 
                required 
              />
              <FlatInput 
                name="nivel_prioridad" 
                label="Nivel Prioridad (1 es +alto)" 
                type="number"
                min="1"
                defaultValue={categoria ? String(categoria.nivel_prioridad) : ''} 
                required 
              />
            </div>

            <FlatSelect 
              name="es_comodin" 
              label="Tipo de Asignación" 
              defaultValue={categoria ? (categoria.es_comodin ? 'true' : 'false') : 'false'} 
              options={[
                { value: 'false', label: 'Estructurada (Requiere Perfil)' }, 
                { value: 'true', label: 'Comodín (Cualquier área)' }
              ]} 
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#002d55] text-white text-sm font-medium rounded-sm hover:bg-[#001f3b] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Guardando...' : 'Guardar Categoría'}
          </button>
        </div>
      </form>
    </>
  );
}