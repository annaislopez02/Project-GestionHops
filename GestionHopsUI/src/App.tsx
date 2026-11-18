import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  alertasApi,
  API_BASE_URL,
  bodegasApi,
  dispositivosApi,
  extractApiErrorMessage,
  movimientosApi,
  registerUnauthorizedHandler,
} from './api/client';
import { AlertsModal, type AlertModalType } from './components/AlertsModal';
import { BodegasView } from './components/BodegasView';
import { CatalogoView } from './components/CatalogoView';
import {
  HeaderBar,
  type ApiConnectionStatus,
} from './components/HeaderBar';
import { KpiCards } from './components/KpiCards';
import { LoginView } from './components/LoginView';
import { OperacionView } from './components/OperacionView';
import { Sidebar } from './components/Sidebar';
import type {
  AlertaStockCritico,
  AlertaVencimiento,
  Bodega,
  DashboardView,
  Dispositivo,
  JwtPayload,
  Movimiento,
} from './types';
import {
  clearStoredToken,
  decodeJwt,
  getStoredToken,
  isTokenExpired,
  setStoredToken,
} from './utils/jwt';

function initializeSession(): { token: string; user: JwtPayload } | null {
  const token = getStoredToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded || isTokenExpired(decoded)) {
    clearStoredToken();
    return null;
  }
  return { token, user: decoded };
}

export default function App() {
  const [session, setSession] = useState<{
    token: string;
    user: JwtPayload;
  } | null>(() => initializeSession());
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<
    string | null
  >(null);

  const [activeView, setActiveView] = useState<DashboardView>('operacion');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Datos sincronizados con NestJS API
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [stockCritico, setStockCritico] = useState<AlertaStockCritico[]>([]);
  const [vencimientos, setVencimientos] = useState<AlertaVencimiento[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] =
    useState<ApiConnectionStatus>('checking');

  const [activeAlertModal, setActiveAlertModal] =
    useState<AlertModalType>(null);

  const handleLogout = useCallback((expiredMsg?: string) => {
    clearStoredToken();
    setSession(null);
    setDispositivos([]);
    setBodegas([]);
    setMovimientos([]);
    setStockCritico([]);
    setVencimientos([]);
    setApiError(null);
    setSessionExpiredMessage(expiredMsg ?? null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      handleLogout(
        'Su sesión institucional expiró o no está autorizada. Ingrese nuevamente.'
      );
    });
  }, [handleLogout]);

  const loadDashboardData = useCallback(async () => {
    if (!session) return;
    setIsLoadingData(true);
    setApiStatus('checking');
    setApiError(null);

    const results = await Promise.allSettled([
      dispositivosApi.getAll(),
      bodegasApi.getAll(),
      movimientosApi.getAll(),
      alertasApi.getStockCritico(),
      alertasApi.getVencimientos(),
    ]);

    const [
      dispositivosRes,
      bodegasRes,
      movimientosRes,
      stockCriticoRes,
      vencimientosRes,
    ] = results;

    let anySuccess = false;
    let firstError: unknown = null;

    if (dispositivosRes.status === 'fulfilled') {
      setDispositivos(dispositivosRes.value);
      anySuccess = true;
    } else if (!firstError) {
      firstError = dispositivosRes.reason;
    }

    if (bodegasRes.status === 'fulfilled') {
      setBodegas(bodegasRes.value);
      anySuccess = true;
    } else if (!firstError) {
      firstError = bodegasRes.reason;
    }

    if (movimientosRes.status === 'fulfilled') {
      setMovimientos(movimientosRes.value);
      anySuccess = true;
    } else if (!firstError) {
      firstError = movimientosRes.reason;
    }

    if (stockCriticoRes.status === 'fulfilled') {
      setStockCritico(stockCriticoRes.value);
      anySuccess = true;
    }

    if (vencimientosRes.status === 'fulfilled') {
      setVencimientos(vencimientosRes.value);
      anySuccess = true;
    }

    if (anySuccess) {
      setApiStatus('connected');
      if (firstError) {
        setApiError(
          `Algunos módulos no pudieron sincronizarse: ${extractApiErrorMessage(firstError)}`
        );
      }
    } else {
      setApiStatus('disconnected');
      setApiError(
        extractApiErrorMessage(
          firstError,
          `No se pudo conectar con la API en ${API_BASE_URL}.`
        )
      );
    }

    setIsLoadingData(false);
  }, [session]);

  const refreshMovimientosAndAlerts = useCallback(async () => {
    if (!session) return;
    try {
      const [movs, critico, venc] = await Promise.all([
        movimientosApi.getAll(),
        alertasApi.getStockCritico().catch(() => stockCritico),
        alertasApi.getVencimientos().catch(() => vencimientos),
      ]);
      setMovimientos(movs);
      setStockCritico(critico);
      setVencimientos(venc);
      setApiStatus('connected');
    } catch (error) {
      setApiError(extractApiErrorMessage(error));
    }
  }, [session, stockCritico, vencimientos]);

  useEffect(() => {
    if (session) {
      void loadDashboardData();
    }
  }, [session, loadDashboardData]);

  const movimientosDelDia = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    return movimientos.filter((mov) => {
      const dt = new Date(mov.fecha_hora);
      return (
        !Number.isNaN(dt.getTime()) &&
        dt.getFullYear() === y &&
        dt.getMonth() === m &&
        dt.getDate() === d
      );
    }).length;
  }, [movimientos]);

  const handleLoginSuccess = (token: string, user: JwtPayload) => {
    setStoredToken(token);
    setSessionExpiredMessage(null);
    setSession({ token, user });
    setActiveView('operacion');
  };

  if (!session) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        sessionExpiredMessage={sessionExpiredMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        user={session.user}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <HeaderBar
          activeView={activeView}
          user={session.user}
          apiStatus={apiStatus}
          onRetryConnection={() => void loadDashboardData()}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onLogout={() => handleLogout()}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Banner de error de conectividad / API */}
          {apiError && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{apiError}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboardData()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-100/60 font-semibold text-rose-800 whitespace-nowrap self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reintentar conexión</span>
              </button>
            </div>
          )}

          {/* KPIs superiores */}
          <KpiCards
            totalInsumos={dispositivos.length}
            movimientosDelDia={movimientosDelDia}
            totalStockCritico={stockCritico.length}
            totalVencimientos={vencimientos.length}
            isLoading={isLoadingData}
            onOpenStockCriticoModal={() => setActiveAlertModal('stock-critico')}
            onOpenVencimientosModal={() => setActiveAlertModal('vencimientos')}
          />

          {/* Vista activa */}
          {activeView === 'operacion' && (
            <OperacionView
              dispositivos={dispositivos}
              bodegas={bodegas}
              movimientos={movimientos}
              isLoadingData={isLoadingData}
              onMovementCreated={refreshMovimientosAndAlerts}
              onRefreshMovimientos={refreshMovimientosAndAlerts}
            />
          )}

          {activeView === 'catalogo' && (
            <CatalogoView
              dispositivos={dispositivos}
              userRole={session.user.rol}
              isLoading={isLoadingData}
              onCatalogChanged={loadDashboardData}
            />
          )}

          {activeView === 'bodegas' && (
            <BodegasView
              bodegas={bodegas}
              movimientos={movimientos}
              userRole={session.user.rol}
              isLoading={isLoadingData}
              onBodegaCreated={loadDashboardData}
            />
          )}
        </main>
      </div>

      <AlertsModal
        modalType={activeAlertModal}
        stockCritico={stockCritico}
        vencimientos={vencimientos}
        onClose={() => setActiveAlertModal(null)}
      />
    </div>
  );
}
