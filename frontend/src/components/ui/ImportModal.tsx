import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<any>;
  title: string;
  allowedExtensions?: string[];
}

export function ImportModal({ isOpen, onClose, onImport, title, allowedExtensions = ['.xlsx', '.xls', '.csv'] }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateFile = (selectedFile: File): boolean => {
    const name = selectedFile.name.toLowerCase();
    const isValid = allowedExtensions.some(ext => name.endsWith(ext));
    if (!isValid) {
      toast.error(`Formato de archivo no válido. Solo se permiten archivos: ${allowedExtensions.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onImport(file);
      toast.success("¡Datos importados exitosamente!");
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Error al procesar el archivo. Verifique el formato.";
      toast.error(detail);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-5 text-left">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-md font-bold text-gray-800">{title}</h3>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Importar desde Hoja de Cálculo
            </p>
          </div>
          <button 
            onClick={() => {
              if (!isUploading) {
                setFile(null);
                onClose();
              }
            }}
            disabled={isUploading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dropzone Area */}
        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none text-center ${
              isDragActive 
                ? 'border-[#002d55] bg-blue-50/30' 
                : 'border-gray-300 hover:border-[#002d55] hover:bg-gray-50/50'
            }`}
          >
            <Upload size={32} className={`transition-transform duration-300 ${isDragActive ? '-translate-y-1 scale-110 text-[#002d55]' : 'text-gray-400'}`} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-700">Arrastra tu archivo aquí o haz clic para buscar</p>
              <p className="text-[10px] text-gray-400 font-medium">Soporta: Excel (.xlsx, .xls) o CSV (.csv)</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={allowedExtensions.join(',')}
              className="hidden"
            />
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-blue-50 text-[#002d55] border border-blue-100 rounded-xl shrink-0">
                <FileSpreadsheet size={20} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              disabled={isUploading}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}

        <div className="bg-blue-50/50 border border-blue-100 text-blue-800 text-[11px] rounded-xl p-3.5 flex gap-2.5 items-start leading-relaxed">
          <AlertCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Aviso:</p>
            <p>Asegúrese de que las columnas de la hoja de cálculo coincidan exactamente con la estructura esperada por el sistema.</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              setFile(null);
              onClose();
            }}
            disabled={isUploading}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="px-4 py-2 bg-[#002d55] hover:bg-[#001c37] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {isUploading && <Loader2 size={12} className="animate-spin" />}
            <span>Subir e Importar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
