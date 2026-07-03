import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List } from 'lucide-react';

interface WYSIWYGEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function WYSIWYGEditor({ value, onChange }: WYSIWYGEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sincronizar el contenido interno con la prop value
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = (command: string, valueStr: string = '') => {
    document.execCommand(command, false, valueStr);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-[#002d55] focus-within:bg-white transition-all">
      {/* Editor Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-100 border-b border-gray-200 flex-wrap">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer"
          title="Negrita"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer"
          title="Cursiva"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer"
          title="Subrayado"
        >
          <Underline size={14} />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer"
          title="Alinear Izquierda"
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer"
          title="Centrar"
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer"
          title="Alinear Derecha"
        >
          <AlignRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyFull')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer"
          title="Justificar"
        >
          <AlignJustify size={14} />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer"
          title="Lista con Viñetas"
        >
          <List size={14} />
        </button>
      </div>

      {/* contentEditable Div */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full min-h-55 p-4 text-xs focus:outline-none text-gray-800 leading-relaxed overflow-y-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      />
    </div>
  );
}
