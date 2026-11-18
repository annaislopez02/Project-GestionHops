import React from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';

interface KpiCardsProps {
  totalInsumos: number;
  movimientosDelDia: number;
  totalStockCritico: number;
  totalVencimientos: number;
  isLoading: boolean;
  onOpenStockCriticoModal: () => void;
  onOpenVencimientosModal: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalInsumos,
  movimientosDelDia,
  totalStockCritico,
  totalVencimientos,
  isLoading,
  onOpenStockCriticoModal,
  onOpenVencimientosModal,
}) => {
  return (
    <section
      aria-label="Indicadores clave de inventario"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {/* Total de insumos activos */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            Total Insumos Activos
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {isLoading ? '—' : totalInsumos}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Dispositivos en catálogo GS1
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] flex items-center justify-center shrink-0">
          <PackageCheck className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      {/* Movimientos del día */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            Movimientos del Día
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {isLoading ? '—' : movimientosDelDia}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Registros auditados hoy
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      {/* Alertas de stock crítico */}
      <button
        type="button"
        onClick={onOpenStockCriticoModal}
        className={`text-left bg-white border rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] ${
          totalStockCritico > 0
            ? 'border-rose-200 hover:border-rose-300 hover:bg-rose-50/30'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            Alertas de Stock Crítico
          </p>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${
              totalStockCritico > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {isLoading ? '—' : totalStockCritico}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#0F4C81]">
            <span>Ver detalle</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            totalStockCritico > 0
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
      </button>

      {/* Alertas de vencimiento */}
      <button
        type="button"
        onClick={onOpenVencimientosModal}
        className={`text-left bg-white border rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] ${
          totalVencimientos > 0
            ? 'border-amber-200 hover:border-amber-300 hover:bg-amber-50/30'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            Alertas de Vencimiento
          </p>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${
              totalVencimientos > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}
          >
            {isLoading ? '—' : totalVencimientos}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#0F4C81]">
            <span>Revisar lotes</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            totalVencimientos > 0
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <CalendarClock className="w-5 h-5" aria-hidden="true" />
        </div>
      </button>
    </section>
  );
};
