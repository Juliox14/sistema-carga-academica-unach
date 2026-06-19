import { LogOut } from 'lucide-react';

const UserProfileCard = ({ collapsed }: { collapsed: boolean }) => (
    <div className={`mt-3 rounded-xl p-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-[#060F5C]" style={{ background: 'linear-gradient(135deg, #D4E600, #A8C200)' }}>
            SA
        </div>
        {!collapsed && (
            <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-xs truncate">Secretaría Académica</p>
                <p className="text-[#6B83D6] text-[10px] truncate">facultad@unach.mx</p>
            </div>
        )}
        {!collapsed && (
            <button className="shrink-0 p-1.5 rounded-lg text-[#6B83D6] hover:text-[#D4E600] hover:bg-white/10 transition-colors" title="Cerrar sesión">
                <LogOut size={14} />
            </button>
        )}
    </div>
);

export default UserProfileCard;