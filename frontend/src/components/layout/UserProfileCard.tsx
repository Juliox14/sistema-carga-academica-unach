import { useState, useRef, useEffect } from 'react';
import { LogOut, Lock, X, Loader2, Settings, User as UserIcon, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import toast from 'react-hot-toast';

interface UserProfileCardProps {
  collapsed: boolean;
}

export default function UserProfileCard({ collapsed }: UserProfileCardProps) {
  const navigate = useNavigate();
  const { user, logout, cambiarPasswordPropia } = useAuthStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (email: string) => {
    if (!email) return 'US';
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      SECRETARIA_ACADEMICA: 'Sec. Académica',
      CAPTURISTA: 'Capturista',
      DOCENTE: 'Docente'
    };
    return roleMap[role] || role;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await cambiarPasswordPropia(passwordActual, nuevaPassword);
      toast.success('Contraseña actualizada exitosamente.');
      setModalOpen(false);
      setPasswordActual('');
      setNuevaPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al actualizar contraseña. Verifica tu clave actual.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const isPadIncomplete = user.rol === 'DOCENTE' && user.docente && (
    !user.docente.rfc || !user.docente.curp || !user.docente.fecha_ingreso || 
    !user.docente.perfil_academico || !user.docente.ultimo_grado_estudio
  );

  return (
    <>
      <div 
        className={`mt-3 rounded-xl p-3 flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`} 
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="relative">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-[#060F5C] select-none relative" 
            style={{ background: 'linear-gradient(135deg, #D4E600, #A8C200)' }}
          >
            {getInitials(user.email)}
          </div>
          {isPadIncomplete && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-[#002d55] shadow-sm animate-pulse" title="Información personal incompleta"></div>
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-xs truncate">
              {getRoleLabel(user.rol)}
            </p>
            <p className="text-[#6B83D6] text-[10px] truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center shrink-0 relative" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-[#6B83D6] hover:text-[#D4E600] hover:bg-white/10 transition-colors cursor-pointer relative" 
              title="Opciones de usuario"
            >
              <Settings size={14} />
              {isPadIncomplete && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden animate-fade-in-up">
                {user.rol === 'DOCENTE' && (
                  <Link 
                    to="/mi-perfil"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer relative"
                  >
                    <UserIcon size={14} className="text-gray-400" />
                    <span>Mi Perfil</span>
                    {isPadIncomplete && (
                      <AlertCircle size={12} className="text-orange-500 absolute right-3" />
                    )}
                  </Link>
                )}
                <button 
                  onClick={() => { setModalOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Lock size={14} className="text-gray-400" />
                  <span>Cambiar Contraseña</span>
                </button>
                <div className="h-px bg-gray-100 my-1 mx-2"></div>
                <button 
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={14} className="text-red-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Cambiar Contraseña Propia */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-md font-bold text-gray-800">Actualizar Contraseña</h3>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Cambia tus credenciales de acceso privadas
                </p>
              </div>
              <button 
                onClick={() => {
                  setModalOpen(false);
                  setPasswordActual('');
                  setNuevaPassword('');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              {/* Contraseña Actual */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  placeholder="Tu clave de acceso actual"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700"
                />
              </div>

              {/* Nueva Contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setPasswordActual('');
                    setNuevaPassword('');
                  }}
                  className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                  <span>Cambiar Contraseña</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}