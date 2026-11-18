import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { AlertaStockCritico, AlertaVencimiento } from '../types';

export type AlertModalType = 'stock-critico' | 'vencimientos' | null;

interface AlertsModalProps {
  modalType: AlertModalType;
  stockCritico: AlertaStockCritico[];
  vencimientos: AlertaVencimiento[];
  onClose: () => void;
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return 'No informada';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  modalType,
  stockCritico,
  vencimientos,
  onClose,
}) => {
  if (!modalType) return null;

  const isStock = modalType === 'stock-critico';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerts-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isStock
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isStock ? (
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              ) : (
                <CalendarClock className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2
                id="alerts-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {isStock
                  ? 'Alertas de Stock Crítico'
                  : 'Alertas de Próximo Vencimiento'}
              </h2>
              <p className="text-xs text-slate-500">
                {isStock
                  ? 'Dispositivos por debajo o en el límite del stock mínimo institucional.'
                  : 'Insumos y lotes próximos a su fecha de caducidad clínica.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de alertas"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isStock ? (
            stockCritico.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2
                  className="w-10 h-10 text-[#0D9488] mx-auto mb-3"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-slate-900">
                  Sin alertas de stock crítico
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Todos los dispositivos cumplen con el stock mínimo configurado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Dispositivo</th>
                      <th className="py-3 px-4">Código GS1</th>
                      <th className="py-3 px-4">Bodega</th>
                      <th className="py-3 px-4 text-right">Stock Actual</th>
                      <th className="py-3 px-4 text-right">Stock Mínimo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {stockCritico.map((item, idx) => {
                      const nombre =
                        item.dispositivo?.nombre ??
                        item.nombre ??
                        `Dispositivo #${item.dispositivo_id ?? item.id ?? idx + 1}`;
                      const gs1 =
                        item.dispositivo?.codigo_gs1 ?? item.codigo_gs1 ?? '—';
                      const bodega =
                        item.bodega?.nombre ?? item.bodega_nombre ?? 'General';
                      const stockActual =
                        item.stock_actual ??
                        item.cantidad_actual ??
                        item.stock ??
                        0;
                      const stockMinimo =
                        item.dispositivo?.stock_minimo ??
                        item.stock_minimo ??
                        0;

                      return (
                        <tr key={`${item.id ?? idx}-${gs1}`} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {nombre}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-600">
                            {gs1}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{bodega}</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-rose-700 tabular-nums">
                            {stockActual}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                            {stockMinimo}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : vencimientos.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2
                className="w-10 h-10 text-[#0D9488] mx-auto mb-3"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-slate-900">
                Sin alertas de vencimiento
              </p>
              <p className="mt-1 text-xs text-slate-500">
                No existen lotes próximos a vencer en las bodegas registradas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Dispositivo</th>
                    <th className="py-3 px-4">Lote</th>
                    <th className="py-3 px-4">Bodega</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {vencimientos.map((item, idx) => {
                    const nombre =
                      item.dispositivo?.nombre ??
                      item.nombre ??
                      `Dispositivo #${item.dispositivo_id ?? item.id ?? idx + 1}`;
                    const bodega =
                      item.bodega?.nombre ?? item.bodega_nombre ?? 'General';

                    return (
                      <tr key={`${item.id ?? idx}-${item.lote ?? idx}`} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {nombre}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {item.lote ?? '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{bodega}</td>
                        <td className="py-3 px-4 text-amber-800 font-medium tabular-nums">
                          {formatDate(item.fecha_vencimiento)}
                          {typeof item.dias_restantes === 'number'
                            ? ` (${item.dias_restantes} d)`
                            : ''}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                          {item.cantidad ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-xs font-semibold text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
