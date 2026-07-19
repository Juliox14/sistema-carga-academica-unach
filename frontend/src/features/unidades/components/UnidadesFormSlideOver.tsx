import { useState, useEffect, useRef } from 'react';
import { X, Building2, Loader2, Check } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export interface UnidadAcademica {
  id: number;
  nombre: string;
  clave: string;
  campus: number;
  ciudad: string | null;
  direccion: string | null;
}

interface UnidadFormProps {
  isOpen: boolean;
  unidad: UnidadAcademica | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UnidadesFormSlideOver({ isOpen, unidad, onClose, onSuccess }: UnidadFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState({
    nombre: "",
    clave: "",
    campus: 1,
    ciudad: "",
    direccion: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (unidad) {
        setForm({
          nombre: unidad.nombre,
          clave: unidad.clave,
          campus: unidad.campus,
          ciudad: unidad.ciudad ?? "",
          direccion: unidad.direccion ?? ""
        });
      } else {
        setForm({ nombre: "", clave: "", campus: 1, ciudad: "", direccion: "" });
      }
    } else if (formRef.current) {
      formRef.current.reset();
    }
  }, [isOpen, unidad]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = { ...form, ciudad: form.ciudad || null, direccion: form.direccion || null };
      if (unidad?.id) {
        await api.patch(`/unidades-academicas/${unidad.id}`, payload);
        toast.success("Unidad actualizada correctamente.");
      } else {
        await api.post("/unidades-academicas/", payload);
        toast.success("Unidad académica creada correctamente.");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Error al guardar la unidad.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002d55]/10 flex items-center justify-center text-[#002d55]">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 leading-tight">
                {unidad ? 'Editar Unidad' : 'Nueva Unidad'}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {unidad ? 'Modifica los datos de la sede' : 'Registra una nueva sede en el sistema'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <form id="unidadForm" ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Escuela de Tecnologías Digitales Aplicadas"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Abreviatura <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  maxLength={20}
                  value={form.clave}
                  onChange={(e) => setForm({ ...form, clave: e.target.value.toUpperCase() })}
                  placeholder="Ej: ETDA"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700 uppercase font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Campus <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.campus}
                  onChange={(e) => setForm({ ...form, campus: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Ciudad / Municipio
              </label>
              <input
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                placeholder="Ej: Tuxtla Gutiérrez"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Dirección
              </label>
              <textarea
                rows={3}
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Dirección completa"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700 font-medium resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="unidadForm"
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            <span>{unidad ? 'Guardar Cambios' : 'Crear Unidad'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
