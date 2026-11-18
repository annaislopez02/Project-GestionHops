import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MapPin,
  Plus,
  Search,
  Warehouse,
  X,
} from 'lucide-react';
import { bodegasApi, extractApiErrorMessage } from '../api/client';
import type { Bodega, BodegaPayload, Movimiento, UserRole } from '../types';
import { canManageCatalog } from '../utils/jwt';

interface BodegasViewProps {
  bodegas: Bodega[];
  movimientos: Movimiento[];
  userRole: UserRole;
  isLoading: boolean;
  onBodegaCreated: () => Promise<void>;
}

const EMPTY_BODEGA: BodegaPayload = {
  nombre: '',
  tipo: '',
  ubicacion: '',
};

export const BodegasView: React.FC<BodegasViewProps> = ({
  bodegas,
  movimientos,
  userRole,
  isLoading,
  onBodegaCreated,
}) => {
  const canCreate = canManageCatalog(userRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<BodegaPayload>(EMPTY_BODEGA);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Conteo real de movimientos asociados por bodega
  const movementCountByBodega = useMemo(() => {
    const counts = new Map<number, number>();
    movimientos.forEach((mov) => {
      const originId = mov.bodega_origen?.id ?? mov.bodega_origen_id;
      const destId = mov.bodega_destino?.id ?? mov.bodega_destino_id;
      if (originId) counts.set(originId, (counts.get(originId) ?? 0) + 1);
      if (destId && destId !== originId) {
        counts.set(destId, (counts.get(destId) ?? 0) + 1);
      }
    });
    return counts;
  }, [movimientos]);

  const filteredBodegas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return bodegas;
    return bodegas.filter(
      (b) =>
        b.nombre.toLowerCase().includes(q) ||
        (b.tipo?.toLowerCase().includes(q) ?? false) ||
        (b.ubicacion?.toLowerCase().includes(q) ?? false)
    );
  }, [bodegas, searchTerm]);

  const handleOpenCreate = () => {
    setFormData(EMPTY_BODEGA);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate) return;
    setFormError(null);

    if (!formData.nombre.trim()) {
      setFormError('Ingrese el nombre de la bodega.');
      return;
    }

    const payload: BodegaPayload = {
      nombre: formData.nombre.trim(),
      ...(formData.tipo?.trim() ? { tipo: formData.tipo.trim() } : {}),
      ...(formData.ubicacion?.trim()
        ? { ubicacion: formData.ubicacion.trim() }
        : {}),
    };

    setIsSaving(true);
    try {
      await bodegasApi.create(payload);
      setIsModalOpen(false);
      await onBodegaCreated();
    } catch (error) {
      setFormError(extractApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section
        aria-label="Directorio de bodegas hospitalarias"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar bodega por nombre, tipo o ubicación..."
              aria-label="Buscar bodegas"
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
            />
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Nueva Bodega</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 rounded-xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filteredBodegas.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <Warehouse
              className="w-10 h-10 text-slate-300 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-slate-900">
              No hay bodegas disponibles
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {bodegas.length === 0
                ? 'Registre las unidades y recintos de almacenamiento del hospital.'
                : 'No hay coincidencias para el filtro ingresado.'}
            </p>
            {canCreate && bodegas.length === 0 && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-xs font-semibold text-white"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Crear Primera Bodega</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBodegas.map((bodega) => {
              const movCount = movementCountByBodega.get(bodega.id) ?? 0;
              return (
                <article
                  key={bodega.id}
                  className="border border-slate-200 rounded-xl p-5 bg-white hover:border-slate-300 transition-colors flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-slate-500 tabular-nums">
                          ID #{bodega.id}
                          {bodega.tipo ? ` · ${bodega.tipo}` : ''}
                        </p>
                        <h3 className="mt-1 text-base font-bold text-slate-900">
                          {bodega.nombre}
                        </h3>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] flex items-center justify-center shrink-0">
                        <Warehouse className="w-4 h-4" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin
                        className="w-3.5 h-3.5 text-slate-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {bodega.ubicacion || 'Ubicación hospitalaria no especificada'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Movimientos registrados
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {movCount}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Nueva Bodega */}
      {canCreate && isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bodega-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2
                id="bodega-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Registrar Nueva Bodega
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
                >
                  <AlertCircle
                    className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="bodega-nombre"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Nombre de la Bodega <span className="text-rose-600">*</span>
                </label>
                <input
                  id="bodega-nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  placeholder="Ej: Bodega Central Pabellón"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="bodega-tipo"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Tipo de Recinto
                </label>
                <input
                  id="bodega-tipo"
                  type="text"
                  value={formData.tipo ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tipo: e.target.value }))
                  }
                  placeholder="Ej: Central, Pabellón, UCI, Urgencia"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="bodega-ubicacion"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Ubicación Física
                </label>
                <input
                  id="bodega-ubicacion"
                  type="text"
                  value={formData.ubicacion ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ubicacion: e.target.value,
                    }))
                  }
                  placeholder="Ej: Torre Quirúrgica, Piso 3"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0B7C72] disabled:opacity-60 text-xs font-semibold text-white"
                >
                  {isSaving && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  )}
                  <span>Crear Bodega</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
