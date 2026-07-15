import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function NavItem({ item, collapsed, depth = 0 }: any) {
  const [open, setOpen] = useState(item.label === 'Catálogos' || item.label === 'Reportes');
  const hasChildren = item.children?.length > 0;
  const Icon = item.icon;

  const baseClassName = [
    'group relative w-full flex items-center rounded-xl text-sm font-medium transition-all duration-300 ease-in-out text-left py-2.5',
    collapsed ? 'gap-0 px-3 justify-center' : 'gap-3 px-4',
    depth > 0 ? 'pl-10 py-2 text-xs rounded-lg' : '',
  ].join(' ');

  const renderContent = (isActive = false) => (
    <>
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#D4E600] rounded-r-full -ml-1" />
      )}

      <Icon
        size={depth > 0 ? 14 : 18}
        className={`shrink-0 transition-colors ${
          isActive ? 'text-[#060F5C]' : 'text-[#6B83D6] group-hover:text-[#D4E600]'
        }`}
      />

      {/* max-width es animable; flex-1 no lo es — aquí estaba el bug */}
      <span
        className={`flex items-center gap-2 overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out ${
          collapsed ? 'max-w-0 opacity-0' : 'max-w-45 opacity-100'
        }`}
      >
        <span className="flex-1 truncate whitespace-nowrap">
          {item.label}
        </span>

        {item.badge && (
          <span className="bg-[#D4E600] text-[#060F5C] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
            {item.badge}
          </span>
        )}

        {hasChildren && (
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''} ${
              isActive ? 'text-[#060F5C]' : 'text-[#6B83D6]'
            }`}
          />
        )}
      </span>

      {collapsed && (
        <span className="absolute left-full ml-3 px-3 py-1.5 bg-[#060F5C] text-white text-xs rounded-lg opacity-0 pointer-events-none whitespace-nowrap group-hover:opacity-100 transition-opacity z-50 border border-white/10 shadow-xl">
          {item.label}
        </span>
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => !collapsed && setOpen(!open)}
          title={collapsed ? item.label : undefined}
          className={`${baseClassName} text-[#A8BCFF] hover:bg-white/10 hover:text-white`}
        >
          {renderContent()}
        </button>

        <div
          className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
            open && !collapsed ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0">
            <div className="mt-1 ml-2 pl-3 border-l border-white/10 space-y-0.5">
              {item.children.map((child: any) => (
                <NavItem key={child.label} item={child} collapsed={false} depth={1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path || '#'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `${baseClassName} ${
          isActive
            ? 'bg-[#D4E600] text-[#060F5C] shadow-lg shadow-[#D4E600]/20'
            : 'text-[#A8BCFF] hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {({ isActive }) => renderContent(isActive)}
    </NavLink>
  );
}