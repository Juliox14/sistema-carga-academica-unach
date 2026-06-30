import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import unachLogo from '../../assets/logo-unach-color.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, token, cargarPerfil, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) {
      cargarPerfil().then((success) => {
        if (success) {
          navigate('/asignacion', { replace: true });
        }
      });
    }
  }, [token, cargarPerfil, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Por favor, ingresa tu correo institucional.');
      return;
    }
    if (!password) {
      toast.error('Por favor, ingresa tu contraseña.');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso. ¡Bienvenido!');
      navigate('/asignacion', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al iniciar sesión. Revisa tus credenciales.';
      toast.error(msg);
    }
  };

  return (
    // unach-azul-oscuro (#002173) como fondo principal
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#002173] relative overflow-hidden">
      
      {/* Fondos decorativos usando el unach-azul (#0038C3) y unach-dorado (#EAB308) */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#EAB308]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#0038C3]/50 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Ondas sutiles CSS adaptadas al unach-azul (#0038C3) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path fill="#0038C3" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,165.3C960,149,1056,171,1152,192C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Tarjeta principal con borde unach-dorado (#EAB308) */}
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-t-[6px] border-t-[#EAB308] relative z-10">
        
        {/* Encabezado del Login */}
        <div className="text-center space-y-2 mb-8">
          
          {/* AQUÍ VA EL LOGO DE LA UNACH */}
          {/* Ajusta la ruta 'src' según donde tengas guardada la imagen en tu proyecto */}
          <img 
            src={unachLogo}
            alt="Logotipo UNACH" 
            className="h-20 w-auto mx-auto mb-4 object-contain transition-transform hover:scale-105 duration-300"
          />
          
          {/* Título en unach-azul-oscuro (#002173) */}
          <h1 className="text-2xl font-extrabold text-[#002173] tracking-tight">
            Sistema SIPAD
          </h1>
          {/* Subtítulo en unach-dorado (#EAB308) */}
          <p className="text-xs font-bold text-[#EAB308] uppercase tracking-widest">
            Carga Académica UNACH
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Input Correo */}
          <div className="space-y-1.5">
            {/* Labels en unach-gris-texto (#4B5563) */}
            <label className="text-xs font-bold text-[#4B5563] block uppercase tracking-wider">
              Correo Institucional
            </label>
            <div className="relative group">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0038C3] transition-colors" />
              <input
                type="email"
                required
                placeholder="ejemplo@unach.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // Fondo unach-fondo (#F3F4F6)
                className="w-full pl-11 pr-4 py-2.5 bg-[#F3F4F6] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038C3] focus:border-[#0038C3] focus:bg-white transition-all text-[#4B5563] font-medium placeholder:font-normal"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4B5563] block uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative group">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0038C3] transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-2.5 bg-[#F3F4F6] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038C3] focus:border-[#0038C3] focus:bg-white transition-all text-[#4B5563] font-medium placeholder:font-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0038C3] transition-colors focus:outline-none cursor-pointer p-1 rounded-full hover:bg-gray-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botón de Enviar (unach-azul #0038C3 por defecto, hover a unach-azul-oscuro #002173) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#0038C3] hover:bg-[#002173] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-[#335FCB]/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2 group"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-[#EAB308]" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Ingresar al Sistema</span>
            )}
          </button>

        </form>

        {/* Footer del card */}
        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <p className="text-[10px] text-[#4B5563] font-bold leading-relaxed uppercase tracking-widest">
            Universidad Autónoma de Chiapas <br />
            <span className="text-[#0038C3] font-semibold tracking-wider">Secretaría Administrativa</span>
          </p>
        </div>

      </div>
    </div>
  );
}