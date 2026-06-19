import unachLogo from '../../assets/logo-unach.png';
import oceloteLogo from '../../assets/ocelote.png';
import { Shield } from 'lucide-react';

const SidebarHeader = ({ collapsed }: { collapsed: boolean }) => (
  <div className="relative shrink-0">
    <div className="h-0.5 w-full bg-linear-to-r from-transparent via-[#D4E600] to-transparent opacity-60" />

    <div className={`flex items-center gap-3 px-4 pt-5 pb-4 ${collapsed ? 'justify-center' : ''}`}>
      <div className="flex items-center gap-2 shrink-0">
        <img src={unachLogo} alt="UNACH" className="w-6 h-6 object-contain" />
        <img src={oceloteLogo} alt="Ocelote" className="w-6 h-6 object-contain" />
      </div>

      {!collapsed && (
        <div className="min-w-0">
          {/* Nota: Cambié wrap-break-word por break-words (estándar Tailwind) */}
          <p className="text-white font-bold text-[11px] leading-tight tracking-wide wrap-break-word whitespace-normal uppercase">
            Escuela de Tecnologías Digitales Aplicadas
          </p>
          <p className="text-[#A8BCFF] font-medium text-[9px] leading-tight mt-0.5 tracking-wider uppercase truncate">
            Sistema de
          </p>
          <p className="text-[#D4E600] font-bold text-[9px] leading-tight tracking-widest uppercase truncate">
            Planeación Académica
          </p>
        </div>
      )}
    </div>

    {!collapsed && (
      <div className="mx-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(212,230,0,0.12)', border: '1px solid rgba(212,230,0,0.2)' }}>
          <Shield size={14} className="text-[#D4E600] shrink-0" />
          <div>
            <p className="text-[#D4E600] font-bold text-[10px] tracking-widest uppercase">SIPAD</p>
            <p className="text-[#6B83D6] text-[9px]">Planeación Académica</p>
          </div>
        </div>
      </div>
    )}
    <div className="mx-4 mb-1 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
  </div>
);

export default SidebarHeader;