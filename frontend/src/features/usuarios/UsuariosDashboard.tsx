import { useEffect, useState } from 'react';
import { useUsuariosStore } from './store/useUsuariosStore';
import { useAuthStore } from '../auth/store/useAuthStore';
import { Shield, UserPlus, ToggleLeft, ToggleRight, Loader2, Check, X, AlertTriangle, Trash2, Key, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsuariosDashboard() {
  const { user: currentUser } = useAuthStore();
  const { 
    usuarios, roles, docentesSinUsuario, isLoading, 
    fetchUsuarios, fetchRoles, fetchDocentesSinUsuario, crearUsuario, 
    toggleActivo, cambiarRol, eliminarUsuario, restablecerPassword 
  } = useUsuariosStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('DOCENTE');
  const [selectedDocenteId, setSelectedDocenteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para mostrar las credenciales generadas al Super Admin
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password_temporal: string;
    pdf_cifrado: boolean;
  } | null>(null);

  // Estados para eliminar usuario y restablecer contraseña
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchUsuarios().catch((err) => {
      console.error(err);
      toast.error('Error al cargar la lista de usuarios.');
    });
    fetchRoles();
    fetchDocentesSinUsuario();
  }, [fetchUsuarios, fetchRoles, fetchDocentesSinUsuario]);

  const handleOpenModal = () => {
    setEmail('');
    setPassword('');
    setSelectedRole('DOCENTE');
    setSelectedDocenteId(null);
    setModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    
    // Si no es docente y no pone clave, requiere al menos 6 caracteres
    if (selectedRole !== 'DOCENTE' && password && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (selectedRole === 'DOCENTE' && !selectedDocenteId) {
      toast.error('Por favor, vincula esta cuenta a un docente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await crearUsuario(email, password || null, selectedRole, selectedDocenteId);
      toast.success('Usuario registrado exitosamente.');
      setModalOpen(false);

      // Mostrar popup con clave temporal autogenerada
      setCreatedCredentials({
        email: data.usuario.email_institucional,
        password_temporal: data.password_temporal,
        pdf_cifrado: data.pdf_adjunto_cifrado_simulado
      });
      
      // Actualizar select de docentes
      fetchDocentesSinUsuario();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al registrar el usuario.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivo = async (id: number, email: string) => {
    if (currentUser && currentUser.email === email) {
      toast.error('No puedes desactivar tu propia cuenta de administrador.');
      return;
    }

    try {
      await toggleActivo(id);
      toast.success('Estado del usuario actualizado.');
    } catch (err) {
      toast.error('Error al actualizar el estado del usuario.');
    }
  };

  const handleRoleChange = async (id: number, email: string, newRoleKey: string) => {
    if (currentUser && currentUser.email === email) {
      toast.error('No puedes modificar tu propio rol de administrador.');
      return;
    }

    try {
      await cambiarRol(id, newRoleKey);
      toast.success('Rol del usuario actualizado exitosamente.');
    } catch (err) {
      toast.error('Error al actualizar el rol del usuario.');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await eliminarUsuario(id);
      toast.success('Usuario eliminado exitosamente.');
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error('Error al eliminar el usuario.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUserId) return;
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsResetting(true);
    try {
      await restablecerPassword(resetPasswordUserId, newPassword);
      toast.success('Contraseña restablecida exitosamente.');
      setResetPasswordUserId(null);
      setNewPassword('');
    } catch (err) {
      toast.error('Error al restablecer la contraseña.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Correo: ${createdCredentials.email}\nContraseña Temporal: ${createdCredentials.password_temporal}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credenciales copiadas al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#002d55]/10 flex items-center justify-center text-[#002d55]">
              <Shield size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Gestión de Usuarios y Roles
            </h1>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Administración del Sistema Carga Académica (Super Admin)
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <UserPlus size={14} />
          <span>Crear Usuario</span>
        </button>
      </div>

      {/* Alerta de Seguridad */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-xs">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Advertencia de Seguridad:</p>
          <p>La creación, eliminación y modificación de usuarios otorga privilegios de acceso y manipulación de información académica en el sistema. Asegúrate de verificar las direcciones de correo institucional asignadas.</p>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="animate-spin text-[#002d55]" />
            <span className="text-sm font-semibold text-gray-500">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol en el Sistema</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((usuario) => {
                  const isSelf = currentUser?.email === usuario.email_institucional;
                  
                  return (
                    <tr 
                      key={usuario.id} 
                      className={`hover:bg-gray-50/50 transition-colors ${isSelf ? 'bg-blue-50/20' : ''}`}
                    >
                      {/* Correo y Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#002d55] text-white flex items-center justify-center font-bold text-xs">
                            {usuario.email_institucional.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-700">
                              {usuario.email_institucional}
                            </p>
                            {isSelf && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#D4E600]/20 text-[#002d55] border border-[#D4E600]/30 uppercase tracking-wide mt-0.5">
                                Mi Cuenta
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Dropdown de Rol */}
                      <td className="px-6 py-4">
                        <select
                          disabled={isSelf}
                          value={usuario.rol_clave}
                          onChange={(e) => handleRoleChange(usuario.id, usuario.email_institucional, e.target.value)}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#002d55] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {roles.map((rol) => (
                            <option key={rol.id} value={rol.clave}>
                              {rol.nombre} ({rol.clave})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Estado Activo Badge */}
                      <td className="px-6 py-4">
                        {usuario.activo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
                            <Check size={10} strokeWidth={3} />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200 uppercase tracking-wide">
                            <X size={10} strokeWidth={3} />
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Botones de Acción */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Toggle Activo */}
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleActivo(usuario.id, usuario.email_institucional)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              usuario.activo 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={isSelf ? 'No puedes desactivarte a ti mismo' : usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {usuario.activo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>

                          {/* Restablecer Password */}
                          <button
                            disabled={isSelf}
                            onClick={() => setResetPasswordUserId(usuario.id)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isSelf ? 'Usa la opción de cambiar contraseña en tu perfil' : 'Restablecer contraseña'}
                          >
                            <Key size={16} />
                          </button>

                          {/* Eliminar Usuario */}
                          <button
                            disabled={isSelf}
                            onClick={() => setDeleteConfirmId(usuario.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isSelf ? 'No puedes eliminar tu propio usuario' : 'Eliminar usuario'}
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear Usuario */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-gray-800">
                  Registrar Nuevo Usuario
                </h3>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Ingresa las credenciales institucionales
                </p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              
              {/* Rol del Usuario */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                  Rol del Usuario
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700 cursor-pointer"
                >
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.clave}>
                      {rol.nombre} ({rol.clave})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Docente Físico si el rol es DOCENTE */}
              {selectedRole === 'DOCENTE' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                    Vincular a Docente Físico
                  </label>
                  {docentesSinUsuario.length === 0 ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs space-y-1">
                      <p className="font-bold">Sin docentes disponibles:</p>
                      <p>Todos los docentes activos ya tienen un usuario creado o no hay docentes registrados.</p>
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedDocenteId || ''}
                      onChange={(e) => setSelectedDocenteId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700 cursor-pointer"
                    >
                      <option value="">-- Selecciona un docente --</option>
                      {docentesSinUsuario.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.apellidos} {d.nombre} (Plaza: {d.plaza})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Correo Electrónico */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                  Correo Electrónico Institucional
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@unach.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700"
                />
              </div>

              {/* Contraseña (Opcional - Se autogenera si se omite) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Contraseña
                  </label>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">(Opcional)</span>
                </div>
                <input
                  type="password"
                  placeholder="Deja vacío para autogenerar clave segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (selectedRole === 'DOCENTE' && docentesSinUsuario.length === 0)}
                  className="px-4 py-2 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                  <span>Registrar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Mostrar Credenciales Creadas */}
      {createdCredentials !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-5 text-left">
            <div className="flex items-center gap-2.5 text-green-600">
              <CheckCircle2 size={24} />
              <h3 className="text-lg font-bold">Usuario Creado Exitosamente</h3>
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              Las credenciales de acceso institucional han sido registradas y el oficio en PDF protegido con contraseña se simuló en los logs del servidor.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 font-sans">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Correo Institucional</span>
                <span className="text-sm font-bold text-gray-700">{createdCredentials.email}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Contraseña Temporal</span>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-mono text-sm font-bold text-gray-800">
                  <span>{createdCredentials.password_temporal}</span>
                  <button
                    onClick={handleCopyCredentials}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
                    title="Copiar credenciales"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {createdCredentials.pdf_cifrado && (
              <div className="bg-blue-50 border border-blue-100 text-blue-800 text-[11px] rounded-xl p-3.5 leading-relaxed">
                <p className="font-bold">Oficio de Credenciales Protegido:</p>
                <p>El PDF enviado por correo está cifrado. Para abrir el archivo, el docente deberá utilizar su **Número de Plaza** como contraseña.</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Confirmar Eliminación */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="text-md font-bold">¿Eliminar Usuario?</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Esta acción es permanente y eliminará definitivamente los privilegios de acceso de este usuario en el sistema.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmId)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Restablecer Contraseña (Admin) */}
      {resetPasswordUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="space-y-0.5">
              <h3 className="text-md font-bold text-gray-800">Restablecer Contraseña</h3>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Ingresa la nueva clave de acceso
              </p>
            </div>
            
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordUserId(null);
                    setNewPassword('');
                  }}
                  className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-3.5 py-1.5 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isResetting && <Loader2 size={12} className="animate-spin" />}
                  <span>Guardar Nueva Clave</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
