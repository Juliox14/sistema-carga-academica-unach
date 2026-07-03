import React, { useEffect, useState } from 'react';
import { useOficiosStore } from '../store/useOficiosStore';
import { FileText, Lock, ShieldAlert, Award, Printer, Loader2, KeyRound, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocenteOficioPortal() {
  const { miOficio, isLoading, fetchMiOficio, leerMiOficio, firmarMiOficio, rechazarMiOficio } = useOficiosStore();

  const [password, setPassword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  
  // Rejection states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    fetchMiOficio()
      .then(() => {
        // Al obtener el oficio con éxito, registrar lectura si está pendiente
        leerMiOficio();
      })
      .catch(() => {
        console.log('No active oficio found for this user/cycle.');
      });
  }, [fetchMiOficio, leerMiOficio]);

  const handleRejectOficio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observaciones.trim()) {
      toast.error('Por favor, ingresa los motivos de rechazo.');
      return;
    }

    setSigning(true);
    try {
      await rechazarMiOficio(observaciones);
      toast.success('Carga académica rechazada. Se han enviado las observaciones.');
      setIsRejectModalOpen(false);
      setObservaciones('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al rechazar el oficio.';
      toast.error(msg);
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('sipad-oficio-print-area');
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Por favor permite las ventanas emergentes en tu navegador para imprimir.');
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Oficio de Carga Académica - UNACH</title>
          <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; background-color: #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #1e293b; padding: 6px; font-size: 11px; }
            th { background-color: #dbeafe; font-weight: bold; }
            @media print {
              body { padding: 0; }
              .page-break { page-break-before: always; margin-top: 0; border: none; padding-top: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleSignOficio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Por favor, ingresa tu contraseña de firma.');
      return;
    }

    setSigning(true);
    try {
      await firmarMiOficio(password);
      toast.success('Documento firmado digitalmente de conformidad.');
      setModalOpen(false);
      setPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al validar la contraseña.';
      toast.error(msg);
    } finally {
      setSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-[#002d55]" />
        <span className="text-sm font-semibold text-gray-500">Cargando documento oficial...</span>
      </div>
    );
  }

  if (!miOficio) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white border border-gray-100 rounded-2xl shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 mx-auto">
          <ShieldAlert size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-md font-bold text-gray-800">Carga Académica No Publicada</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
            La Secretaría Académica aún no ha publicado ni emitido los oficios de asignaciones correspondientes al ciclo escolar activo. Vuelve a consultar más tarde.
          </p>
        </div>
      </div>
    );
  }

  const isSigned = miOficio.estado === 'FIRMADO';
  const isRejected = miOficio.estado === 'RECHAZADO';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Alert / CTA Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-md font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-[#002d55]" size={18} />
            <span>Oficio de Asignación de Carga Académica</span>
          </h2>
          <p className="text-xs text-gray-500">
            Folio: <strong className="font-mono text-gray-800">{miOficio.numero_oficio}</strong> | Ciclo: {miOficio.ciclo_nombre}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Printer size={14} />
            <span>Imprimir / PDF</span>
          </button>

          {/* Conditional Sign/Reject status */}
          {miOficio.requiere_firma && (
            isSigned ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold">
                <Award size={14} />
                <span>Firmado de Conformidad</span>
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold animate-pulse">
                <ShieldAlert size={14} />
                <span>Carga Rechazada</span>
              </span>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-650 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <X size={14} />
                  <span>Rechazar Carga</span>
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Lock size={14} />
                  <span>Firmar de Conformidad</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Visor de Oficio Renderizado en Hoja Membretada */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100 space-y-6 overflow-hidden">
        
        {/* Banner de Rechazo de Carga */}
        {isRejected && miOficio.observaciones_rechazo && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3 text-red-800 text-xs items-start">
            <ShieldAlert size={20} className="shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-red-700">Carga Académica Rechazada</p>
              <p className="leading-relaxed">Has declinado la conformidad con tu asignación de carga académica para el semestre en curso.</p>
              <div className="bg-white border border-red-150 rounded-xl p-3 mt-2 text-red-700">
                <span className="font-bold uppercase text-[9px] tracking-wider block text-red-500 mb-1">Tus observaciones:</span>
                "{miOficio.observaciones_rechazo}"
              </div>
            </div>
          </div>
        )}

        {/* Banner de Sello Digital en tope */}
        {isSigned && miOficio.hash_firma && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3 text-green-800 text-xs items-center">
            <Award size={20} className="shrink-0 text-green-600" />
            <div className="space-y-0.5">
              <p className="font-bold">Sello Digital de Aceptación/Conformidad Registrado:</p>
              <p className="font-mono text-[10px] break-all text-green-700">{miOficio.hash_firma}</p>
              <p className="text-[10px] text-green-600/80">Fecha de firma: {new Date(miOficio.fecha_firma!).toLocaleString('es-MX')} desde IP: {miOficio.ip_firma}</p>
            </div>
          </div>
        )}

        {/* Contenido HTML del Oficio */}
        <div 
          id="sipad-oficio-print-area" 
          className="prose max-w-none sipad-unach-oficio-content"
          dangerouslySetInnerHTML={{ __html: miOficio.contenido_html || '' }}
        />

        {/* Sello digital al pie de la página si está firmado */}
        {isSigned && miOficio.hash_firma && (
          <div className="mt-8 border-t border-dashed border-gray-200 pt-6 text-center space-y-1.5 max-w-md mx-auto">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Sello de Seguridad UNACH</span>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono text-[9px] text-gray-600 break-all leading-tight">
              SHA256:{miOficio.hash_firma}
            </div>
          </div>
        )}
      </div>

      {/* Modal para Firmar de Conformidad */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-5 text-left">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-md font-bold text-gray-800">Firmar de Conformidad</h3>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Doble factor de autenticación y aceptación
                </p>
              </div>
              <button 
                onClick={() => {
                  setModalOpen(false);
                  setPassword('');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <Lock size={16} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[11px] rounded-xl p-3.5 space-y-1 leading-relaxed">
              <p className="font-bold">Declaración de Conformidad:</p>
              <p>Al firmar este documento, declaras tu visto bueno con la carga académica programada para el semestre en curso. Esto generará un sello criptográfico inalterable que asocia tu cuenta, el contenido detallado del oficio y tu IP.</p>
            </div>

            <form onSubmit={handleSignOficio} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                  Contraseña de Confirmación
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Introduce tu clave de acceso actual"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setPassword('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={signing}
                  className="px-4 py-2 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {signing && <Loader2 size={12} className="animate-spin" />}
                  <span>Confirmar Firma Electrónica</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Rechazar Carga */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-5 text-left">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-md font-bold text-gray-800">Rechazar Carga Académica</h3>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Reportar observaciones o inconsistencias
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setObservaciones('');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] rounded-xl p-3.5 space-y-1 leading-relaxed">
              <p className="font-bold">Importante:</p>
              <p>Por favor describe detalladamente las observaciones, errores en tus asignaciones, cruces de horarios o cualquier discrepancia con tu carga programada. Esto será enviado a la Secretaría Académica para su revisión.</p>
            </div>

            <form onSubmit={handleRejectOficio} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                  Observaciones / Motivos del Rechazo
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribe aquí los motivos detallados..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-gray-700 leading-relaxed"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setObservaciones('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={signing || observaciones.trim().length < 5}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {signing && <Loader2 size={12} className="animate-spin" />}
                  <span>Confirmar Rechazo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
