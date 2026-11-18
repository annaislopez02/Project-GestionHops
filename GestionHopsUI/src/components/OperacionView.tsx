import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  ScanBarcode,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
import {
  dispositivosApi,
  extractApiErrorMessage,
  movimientosApi,
} from '../api/client';
import type {
  Bodega,
  CreateMovimientoPayload,
  Dispositivo,
  Movimiento,
  TipoMovimiento,
} from '../types';

interface OperacionViewProps {
  dispositivos: Dispositivo[];
  bodegas: Bodega[];
  movimientos: Movimiento[];
  isLoadingData: boolean;
  onMovementCreated: () => Promise<void>;
  onRefreshMovimientos: () => Promise<void>;
}

const MOVEMENT_TYPE_CONFIG: Record<
  TipoMovimiento,
  {
    label: string;
    activeClass: string;
    badgeClass: string;
    sign: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  INGRESO: {
    label: 'Ingreso',
    activeClass: 'bg-[#0D9488] text-white border-[#0D9488]',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    sign: '+',
    icon: ArrowDownLeft,
  },
  SALIDA: {
    label: 'Salida',
    activeClass: 'bg-rose-600 text-white border-rose-600',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    sign: '-',
    icon: ArrowUpRight,
  },
  TRASPASO: {
    label: 'Traspaso',
    activeClass: 'bg-indigo-600 text-white border-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    sign: '↔ ',
    icon: ArrowLeftRight,
  },
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export const OperacionView: React.FC<OperacionViewProps> = ({
  dispositivos,
  bodegas,
  movimientos,
  isLoadingData,
  onMovementCreated,
  onRefreshMovimientos,
}) => {
  const gs1InputRef = useRef<HTMLInputElement>(null);

  // Estado del escáner GS1
  const [gs1Query, setGs1Query] = useState('');
  const [isSearchingGs1, setIsSearchingGs1] = useState(false);
  const [gs1Error, setGs1Error] = useState<string | null>(null);
  const [selectedDispositivo, setSelectedDispositivo] =
    useState<Dispositivo | null>(null);

  // Estado del formulario inteligente de movimiento
  const [tipoMovimiento, setTipoMovimiento] =
    useState<TipoMovimiento>('INGRESO');
  const [bodegaOrigenId, setBodegaOrigenId] = useState<string>('');
  const [bodegaDestinoId, setBodegaDestinoId] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('1');
  const [observacion, setObservacion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Estado de filtros de bitácora
  const [filterTipo, setFilterTipo] = useState<'ALL' | TipoMovimiento>('ALL');
  const [searchLog, setSearchLog] = useState('');
  const [isRefreshingLog, setIsRefreshingLog] = useState(false);

  // Auto-foco al cargar la vista operativa
  useEffect(() => {
    gs1InputRef.current?.focus();
  }, []);

  // Limpiar bodegas no aplicables al cambiar tipo de movimiento
  const handleSelectTipoMovimiento = (tipo: TipoMovimiento) => {
    setTipoMovimiento(tipo);
    setSubmitError(null);
    if (tipo === 'INGRESO') {
      setBodegaOrigenId('');
    } else if (tipo === 'SALIDA') {
      setBodegaDestinoId('');
    }
  };

  const handleGs1Search = async () => {
    const trimmed = gs1Query.trim();
    if (!trimmed) {
      setGs1Error('Escanee o ingrese un código GS1 antes de buscar.');
      gs1InputRef.current?.focus();
      return;
    }

    setIsSearchingGs1(true);
    setGs1Error(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const found = await dispositivosApi.getByGs1(trimmed);
      setSelectedDispositivo(found);
      setGs1Query(found.codigo_gs1);
    } catch (error) {
      setSelectedDispositivo(null);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setGs1Error(
          `No existe ningún dispositivo médico registrado con el código GS1 "${trimmed}".`
        );
      } else {
        setGs1Error(extractApiErrorMessage(error));
      }
    } finally {
      setIsSearchingGs1(false);
    }
  };

  const handleGs1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleGs1Search();
    }
  };

  const handleManualDispositivoSelect = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const id = Number(e.target.value);
    if (!id) {
      setSelectedDispositivo(null);
      return;
    }
    const found = dispositivos.find((d) => d.id === id) ?? null;
    setSelectedDispositivo(found);
    if (found) {
      setGs1Query(found.codigo_gs1);
      setGs1Error(null);
    }
  };

  const handleClearSelection = () => {
    setSelectedDispositivo(null);
    setGs1Query('');
    setGs1Error(null);
    gs1InputRef.current?.focus();
  };

  const requiresOrigen =
    tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRASPASO';
  const requiresDestino =
    tipoMovimiento === 'INGRESO' || tipoMovimiento === 'TRASPASO';

  const handleSubmitMovimiento = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!selectedDispositivo) {
      setSubmitError(
        'Debe escanear un código GS1 o seleccionar un dispositivo médico.'
      );
      gs1InputRef.current?.focus();
      return;
    }

    const parsedCantidad = Number(cantidad);
    if (!Number.isInteger(parsedCantidad) || parsedCantidad <= 0) {
      setSubmitError('La cantidad debe ser un número entero mayor a 0.');
      return;
    }

    const origenId = Number(bodegaOrigenId);
    const destinoId = Number(bodegaDestinoId);

    if (requiresOrigen && !origenId) {
      setSubmitError('Seleccione la Bodega de Origen.');
      return;
    }

    if (requiresDestino && !destinoId) {
      setSubmitError('Seleccione la Bodega de Destino.');
      return;
    }

    if (tipoMovimiento === 'TRASPASO' && origenId === destinoId) {
      setSubmitError(
        'En un traspaso, la Bodega de Origen y la Bodega de Destino deben ser distintas.'
      );
      return;
    }

    const payload: CreateMovimientoPayload = {
      dispositivo_id: selectedDispositivo.id,
      tipo_movimiento: tipoMovimiento,
      cantidad: parsedCantidad,
      ...(requiresOrigen ? { bodega_origen_id: origenId } : {}),
      ...(requiresDestino ? { bodega_destino_id: destinoId } : {}),
      ...(observacion.trim() ? { observacion: observacion.trim() } : {}),
    };

    setIsSubmitting(true);
    try {
      await movimientosApi.create(payload);
      setSubmitSuccess(
        `Movimiento ${tipoMovimiento} de ${parsedCantidad} u. (${selectedDispositivo.nombre}) registrado correctamente.`
      );
      setCantidad('1');
      setObservacion('');
      setSelectedDispositivo(null);
      setGs1Query('');
      await onMovementCreated();
      gs1InputRef.current?.focus();
    } catch (error) {
      setSubmitError(extractApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshLog = async () => {
    setIsRefreshingLog(true);
    try {
      await onRefreshMovimientos();
    } finally {
      setIsRefreshingLog(false);
    }
  };

  const filteredMovimientos = useMemo(() => {
    const query = searchLog.trim().toLowerCase();
    return [...movimientos]
      .sort(
        (a, b) =>
          new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
      )
      .filter((mov) => {
        if (filterTipo !== 'ALL' && mov.tipo_movimiento !== filterTipo) {
          return false;
        }
        if (!query) return true;

        const dispositivoName = mov.dispositivo?.nombre?.toLowerCase() ?? '';
        const gs1 = mov.dispositivo?.codigo_gs1?.toLowerCase() ?? '';
        const obs = mov.observacion?.toLowerCase() ?? '';
        const userName = mov.usuario?.nombre?.toLowerCase() ?? '';
        const userRut = mov.usuario?.rut?.toLowerCase() ?? '';
        const origen = mov.bodega_origen?.nombre?.toLowerCase() ?? '';
        const destino = mov.bodega_destino?.nombre?.toLowerCase() ?? '';

        return (
          dispositivoName.includes(query) ||
          gs1.includes(query) ||
          obs.includes(query) ||
          userName.includes(query) ||
          userRut.includes(query) ||
          origen.includes(query) ||
          destino.includes(query)
        );
      });
  }, [movimientos, filterTipo, searchLog]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Columna izquierda: Escáner GS1 + Formulario inteligente */}
      <section
        aria-label="Registro de movimiento e ingreso GS1"
        className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6"
      >
        {/* Barra de lectura rápida GS1 */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor="gs1-scanner-input"
              className="text-sm font-bold text-slate-900 flex items-center gap-2"
            >
              <ScanBarcode
                className="w-4 h-4 text-[#0F4C81]"
                aria-hidden="true"
              />
              <span>Lectura Rápida Código GS1</span>
            </label>
            <span className="text-xs text-slate-500">Presione Enter</span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={gs1InputRef}
                id="gs1-scanner-input"
                type="text"
                autoFocus
                value={gs1Query}
                onChange={(e) => {
                  setGs1Query(e.target.value);
                  if (gs1Error) setGs1Error(null);
                }}
                onKeyDown={handleGs1KeyDown}
                placeholder="Escanee o escriba código GS1..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-3.5 pr-9 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 transition-colors"
              />
              {(gs1Query || selectedDispositivo) && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  aria-label="Limpiar búsqueda GS1"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleGs1Search()}
              disabled={isSearchingGs1}
              className="px-4 py-2.5 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] disabled:opacity-60 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              {isSearchingGs1 ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Buscar</span>
            </button>
          </div>

          {gs1Error && (
            <div
              role="alert"
              className="mt-2.5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
            >
              <AlertCircle
                className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{gs1Error}</span>
            </div>
          )}

          {/* Selección alternativa desde catálogo */}
          <div className="mt-3">
            <label
              htmlFor="manual-device-select"
              className="block text-xs font-medium text-slate-500 mb-1"
            >
              O seleccione dispositivo manualmente del catálogo
            </label>
            <select
              id="manual-device-select"
              value={selectedDispositivo?.id ?? ''}
              onChange={handleManualDispositivoSelect}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
            >
              <option value="">-- Seleccionar insumo o dispositivo --</option>
              {dispositivos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre} ({item.codigo_gs1})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vista previa del insumo identificado */}
        {selectedDispositivo && (
          <div className="rounded-xl border border-[#0F4C81]/25 bg-[#0F4C81]/[0.04] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0F4C81]">
                  Dispositivo Seleccionado
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {selectedDispositivo.nombre}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                  <span className="font-mono text-slate-800">
                    {selectedDispositivo.codigo_gs1}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedDispositivo.categoria}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    Stock mín: {selectedDispositivo.stock_minimo} u.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <hr className="border-slate-200" />

        {/* Formulario inteligente de movimientos */}
        <form onSubmit={handleSubmitMovimiento} className="space-y-4">
          <div>
            <span className="block text-sm font-bold text-slate-900 mb-2">
              Tipo de Movimiento
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                ['INGRESO', 'SALIDA', 'TRASPASO'] as TipoMovimiento[]
              ).map((tipo) => {
                const cfg = MOVEMENT_TYPE_CONFIG[tipo];
                const Icon = cfg.icon;
                const isSelected = tipoMovimiento === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleSelectTipoMovimiento(tipo)}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] ${
                      isSelected
                        ? cfg.activeClass
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bodegas dinámicas según tipo_movimiento */}
          <div className="grid grid-cols-1 gap-4">
            {requiresOrigen && (
              <div>
                <label
                  htmlFor="bodega-origen"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Bodega de Origen <span className="text-rose-600">*</span>
                </label>
                <select
                  id="bodega-origen"
                  required
                  value={bodegaOrigenId}
                  onChange={(e) => {
                    setBodegaOrigenId(e.target.value);
                    setSubmitError(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                >
                  <option value="">Seleccione bodega de salida...</option>
                  {bodegas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                      {b.ubicacion ? ` — ${b.ubicacion}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {requiresDestino && (
              <div>
                <label
                  htmlFor="bodega-destino"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Bodega de Destino <span className="text-rose-600">*</span>
                </label>
                <select
                  id="bodega-destino"
                  required
                  value={bodegaDestinoId}
                  onChange={(e) => {
                    setBodegaDestinoId(e.target.value);
                    setSubmitError(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                >
                  <option value="">Seleccione bodega receptora...</option>
                  {bodegas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                      {b.ubicacion ? ` — ${b.ubicacion}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="mov-cantidad"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Cantidad <span className="text-rose-600">*</span>
              </label>
              <input
                id="mov-cantidad"
                type="number"
                min={1}
                step={1}
                required
                value={cantidad}
                onChange={(e) => {
                  setCantidad(e.target.value);
                  setSubmitError(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="mov-observacion"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Observación / Lote / Unidad Clínica
              </label>
              <input
                id="mov-observacion"
                type="text"
                maxLength={180}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej: Lote #A12 - Pabellón"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
              />
            </div>
          </div>

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
            >
              <AlertCircle
                className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800"
            >
              <CheckCircle2
                className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{submitSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0D9488] hover:bg-[#0B7C72] disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Registrando en bitácora...</span>
              </>
            ) : (
              <span>Registrar {MOVEMENT_TYPE_CONFIG[tipoMovimiento].label}</span>
            )}
          </button>
        </form>
      </section>

      {/* Columna derecha: Bitácora Auditada en Vivo */}
      <section
        aria-label="Bitácora auditada de movimientos"
        className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bitácora Auditada en Vivo
              </h2>
              <p className="text-xs text-slate-500">
                Trazabilidad cronológica con responsable verificado por JWT.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleRefreshLog()}
              disabled={isRefreshingLog}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshingLog ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filtro por tipo de movimiento */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              {(
                [
                  { id: 'ALL', label: 'Todos' },
                  { id: 'INGRESO', label: 'Ingreso' },
                  { id: 'SALIDA', label: 'Salida' },
                  { id: 'TRASPASO', label: 'Traspaso' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTipo(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filterTipo === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Buscador en bitácora */}
            <div className="relative sm:w-64">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="Buscar insumo, GS1, usuario..."
                aria-label="Filtrar bitácora de movimientos"
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
              />
            </div>
          </div>
        </div>

        {/* Tabla de bitácora */}
        {isLoadingData ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-12 rounded-lg bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filteredMovimientos.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <ClipboardList
              className="w-10 h-10 text-slate-300 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-slate-900">
              No hay movimientos que coincidan
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Escanee un código GS1 y registre un ingreso, salida o traspaso en
              el panel izquierdo para iniciar la trazabilidad.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                  <th className="py-3 px-4">Insumo / Observación</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Cant.
                  </th>
                  <th className="py-3 px-4">Bodega</th>
                  <th className="py-3 px-4 whitespace-nowrap">Fecha / Hora</th>
                  <th className="py-3 px-4">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredMovimientos.map((mov) => {
                  const cfg = MOVEMENT_TYPE_CONFIG[mov.tipo_movimiento];
                  const Icon = cfg.icon;

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border font-semibold ${cfg.badgeClass}`}
                        >
                          <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top min-w-[180px]">
                        <p className="font-semibold text-slate-900 text-sm leading-snug">
                          {mov.dispositivo?.nombre ??
                            `Dispositivo #${mov.dispositivo_id ?? '—'}`}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-slate-500">
                          {mov.dispositivo?.codigo_gs1 && (
                            <span className="font-mono text-[11px]">
                              {mov.dispositivo.codigo_gs1}
                            </span>
                          )}
                          {mov.observacion && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-600">
                                {mov.observacion}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                        <span className="font-mono font-semibold text-sm text-slate-900 tabular-nums">
                          {cfg.sign}
                          {mov.cantidad}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top text-slate-700 min-w-[140px]">
                        {mov.tipo_movimiento === 'TRASPASO' ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <span>{mov.bodega_origen?.nombre ?? 'Origen'}</span>
                            <ArrowRight
                              className="w-3 h-3 text-slate-400 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-medium text-slate-900">
                              {mov.bodega_destino?.nombre ?? 'Destino'}
                            </span>
                          </div>
                        ) : mov.tipo_movimiento === 'INGRESO' ? (
                          <span className="font-medium text-slate-900">
                            {mov.bodega_destino?.nombre ??
                              `Bodega #${mov.bodega_destino_id ?? '—'}`}
                          </span>
                        ) : (
                          <span>
                            {mov.bodega_origen?.nombre ??
                              `Bodega #${mov.bodega_origen_id ?? '—'}`}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top whitespace-nowrap font-mono text-slate-600 tabular-nums">
                        {formatDateTime(mov.fecha_hora)}
                      </td>

                      <td className="py-3 px-4 align-top min-w-[140px]">
                        {mov.usuario ? (
                          <div>
                            <p className="font-semibold text-slate-800 inline-flex items-center gap-1">
                              <UserCheck
                                className="w-3 h-3 text-[#0F4C81] shrink-0"
                                aria-hidden="true"
                              />
                              <span>{mov.usuario.nombre}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {mov.usuario.rol} · {mov.usuario.rut}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Auditado JWT</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
