import unachLogo from '../../assets/logo-unach.png';
import oceloteLogo from '../../assets/ocelote.png';
import { Shield } from 'lucide-react';

const SidebarHeader = ({ collapsed }: { collapsed: boolean }) => (
  <div className="relative shrink-0">
    <div className="h-0.5 w-full bg-linear-to-r from-transparent via-[#D4E600] to-transparent opacity-60" />

    <div className={`flex items-center px-4 pt-5 pb-4 transition-all duration-300 ${collapsed ? 'justify-center gap-0' : 'gap-3'}`}>
      <div className={`flex items-center shrink-0 transition-all duration-300 ${collapsed ? 'gap-1' : 'gap-2'}`}>
        <img
          src={unachLogo}
          alt="UNACH"
          className={`object-contain transition-all duration-300 ${collapsed ? 'w-5 h-5' : 'w-6 h-6'}`}
        />
        <img
          src={oceloteLogo}
          alt="Ocelote"
          className={`object-contain transition-all duration-300 ${collapsed ? 'w-5 h-5' : 'w-6 h-6'}`}
        />
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'
        }`}
      >
        <div className="w-[180px] shrink-0">
          <p className="text-white font-bold text-[10px] leading-tight tracking-wide uppercase">
            Escuela de Tecnologías Digitales Aplicadas
          </p>
          <p className="text-[#A8BCFF] font-medium text-[9px] leading-tight mt-1 tracking-wider uppercase">
            Sistema de
          </p>
          <p className="text-[#D4E600] font-bold text-[11px] leading-tight tracking-wider uppercase">
            Planeación Académica
          </p>
        </div>
      </div>
    </div>

    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        collapsed ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-20 opacity-100 mb-4'
      } mx-4`}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(212,230,0,0.12)', border: '1px solid rgba(212,230,0,0.2)' }}>
        <Shield size={14} className="text-[#D4E600] shrink-0" />
        <div className="whitespace-nowrap">
          <p className="text-[#D4E600] font-bold text-[10px] tracking-widest uppercase">SIPAD</p>
          <p className="text-[#6B83D6] text-[9px]">Planeación Académica</p>
        </div>
      </div>
    </div>
    <div className="mx-4 mb-1 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
  </div>
);

export default SidebarHeader;