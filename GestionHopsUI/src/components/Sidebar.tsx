import React from 'react';
import {
  Activity,
  Building2,
  ClipboardList,
  Package,
  Shield,
  Warehouse,
  X,
} from 'lucide-react';
import type { DashboardView, JwtPayload } from '../types';
import { canManageCatalog, getRoleLabel } from '../utils/jwt';

interface SidebarProps {
  activeView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  user: JwtPayload;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: DashboardView;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'operacion',
    label: 'Operación y Escáner GS1',
    description: 'Movimientos y bitácora',
    icon: Activity,
  },
  {
    id: 'catalogo',
    label: 'Catálogo de Dispositivos',
    description: 'Insumos y stock mínimo',
    icon: Package,
  },
  {
    id: 'bodegas',
    label: 'Gestión de Bodegas',
    description: 'Unidades y recintos',
    icon: Warehouse,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  user,
  isOpenMobile,
  onCloseMobile,
}) => {
  const hasWriteAccess = canManageCatalog(user.rol);

  const handleNavigate = (view: DashboardView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      {/* Identidad institucional */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#0F4C81] text-white flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-slate-900 truncate">
              Gestionhops
            </p>
            <p className="text-[11px] font-medium text-slate-500 truncate">
              Hosp. Dr. Gustavo Fricke
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Cerrar menú lateral"
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navegación principal */}
      <nav aria-label="Navegación principal" className="flex-1 p-3 space-y-1">
        <p className="px-3 pt-2 pb-1.5 text-xs font-semibold text-slate-400">
          Módulos Clínicos
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] ${
                isActive
                  ? 'bg-[#0F4C81]/10 text-[#0F4C81]'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#0F4C81]' : 'text-slate-500'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm truncate ${
                    isActive ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Resumen de perfil y permisos RBAC */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Shield className="w-4 h-4 text-[#0F4C81] shrink-0" aria-hidden="true" />
          <span>Permisos de Sesión</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          Perfil <span className="font-semibold text-slate-800">{getRoleLabel(user.rol)}</span>.{' '}
          {hasWriteAccess
            ? 'Habilitado para administrar catálogo, bodegas y registrar movimientos.'
            : 'Acceso de consulta en catálogo y registro operativo de movimientos.'}
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <ClipboardList className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Auditoría JWT vinculada</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar fijo en escritorio */}
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {/* Drawer móvil */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
