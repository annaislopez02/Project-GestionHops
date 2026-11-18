import React from 'react';
import {
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { DashboardView, JwtPayload, UserRole } from '../types';
import { getRoleLabel } from '../utils/jwt';

export type ApiConnectionStatus = 'connected' | 'disconnected' | 'checking';

interface HeaderBarProps {
  activeView: DashboardView;
  user: JwtPayload;
  apiStatus: ApiConnectionStatus;
  onRetryConnection: () => void;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

const VIEW_TITLES: Record<DashboardView, string> = {
  operacion: 'Operación de Bodega y Escáner GS1',
  catalogo: 'Catálogo de Dispositivos Médicos',
  bodegas: 'Gestión de Bodegas Hospitalarias',
};

function getRoleBadgeStyle(rol: UserRole): string {
  switch (rol) {
    case 'ADMIN':
      return 'bg-[#0F4C81]/10 text-[#0F4C81] border-[#0F4C81]/25';
    case 'JEFE_BODEGA':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    case 'CLINICO':
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeView,
  user,
  apiStatus,
  onRetryConnection,
  onOpenMobileMenu,
  onLogout,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Zona izquierda: menú móvil + título de contexto */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú lateral"
          className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81]"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">
            Hospital Dr. Gustavo Fricke
          </p>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
            {VIEW_TITLES[activeView]}
          </h1>
        </div>
      </div>

      {/* Zona derecha: conexión API, rol activo y cerrar sesión */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Indicador real de conexión con API */}
        <button
          type="button"
          onClick={onRetryConnection}
          title="Verificar conexión con el servidor NestJS"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] ${
            apiStatus === 'connected'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
              : apiStatus === 'checking'
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/70'
          }`}
        >
          {apiStatus === 'connected' ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          ) : apiStatus === 'checking' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" aria-hidden="true" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {apiStatus === 'connected'
              ? 'API Conectada'
              : apiStatus === 'checking'
                ? 'Verificando API'
                : 'Sin conexión API'}
          </span>
        </button>

        {/* Identidad y badge de rol activo */}
        <div
          className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 ${getRoleBadgeStyle(
            user.rol
          )}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{user.rol}</span>
          <span className="text-slate-400 font-normal" aria-hidden="true">
            ·
          </span>
          <span className="font-mono font-medium">{user.rut}</span>
          <span className="sr-only">{getRoleLabel(user.rol)}</span>
        </div>

        {/* Botón de cierre de sesión */}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81]"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
};
