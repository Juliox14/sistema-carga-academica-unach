import React, { useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { Lock, KeyRound, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForceChangePassword() {
  const { cambiarPasswordPropia } = useAuthStore();
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      toast.error('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (passwordActual === nuevaPassword) {
      toast.error('La nueva contraseña debe ser diferente a la contraseña temporal actual.');
      return;
    }

    setIsSubmitting(true);
    try {
      await cambiarPasswordPropia(passwordActual, nuevaPassword);
      toast.success('Tu contraseña ha sido actualizada. Tu cuenta está activa.');
      window.location.reload(); // Recarga limpia para actualizar rutas
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al cambiar contraseña. Verifica tu clave actual.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060F5C] p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 space-y-6">
        
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <Lock size={22} />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Cambio de Contraseña Obligatorio</h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Primer Ingreso de Seguridad</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-[11px] leading-relaxed">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Acceso Temporal Detectado:</p>
            <p>Se te ha asignado una clave provisional de administrador. Por políticas de seguridad institucional, debes definir una contraseña nueva, personal y secreta para continuar.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* Contraseña Actual */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
              Contraseña Temporal Actual
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Ingresa la contraseña con la que entraste"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] transition-all text-gray-700 font-mono"
              />
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
              Nueva Contraseña
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] transition-all text-gray-700 font-mono"
              />
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block uppercase tracking-wider">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Repite la nueva contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] transition-all text-gray-700 font-mono"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#002d55] hover:bg-[#0038C3] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Lock size={14} />
            )}
            <span>Activar y Acceder al Sistema</span>
          </button>

        </form>

        {/* Back link */}
        <div className="text-center">
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.reload();
            }}
            className="text-xs text-gray-400 hover:text-red-500 font-semibold hover:underline cursor-pointer"
          >
            Cerrar Sesión / Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
