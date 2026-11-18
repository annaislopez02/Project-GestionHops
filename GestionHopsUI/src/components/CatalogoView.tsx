import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Edit3,
  Loader2,
  Lock,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { dispositivosApi, extractApiErrorMessage } from '../api/client';
import type { Dispositivo, DispositivoPayload, UserRole } from '../types';
import { canManageCatalog } from '../utils/jwt';

interface CatalogoViewProps {
  dispositivos: Dispositivo[];
  userRole: UserRole;
  isLoading: boolean;
  onCatalogChanged: () => Promise<void>;
}

const EMPTY_FORM: DispositivoPayload = {
  codigo_gs1: '',
  nombre: '',
  categoria: '',
  stock_minimo: 10,
};

export const CatalogoView: React.FC<CatalogoViewProps> = ({
  dispositivos,
  userRole,
  isLoading,
  onCatalogChanged,
}) => {
  const canEdit = canManageCatalog(userRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('ALL');

  // Modal Crear / Editar
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Dispositivo | null>(null);
  const [formData, setFormData] = useState<DispositivoPayload>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Eliminar
  const [deletingItem, setDeletingItem] = useState<Dispositivo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const unique = new Set<string>();
    dispositivos.forEach((d) => {
      if (d.categoria?.trim()) unique.add(d.categoria.trim());
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [dispositivos]);

  const filteredDispositivos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return dispositivos.filter((item) => {
      if (
        selectedCategoria !== 'ALL' &&
        item.categoria !== selectedCategoria
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.codigo_gs1.toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q)
      );
    });
  }, [dispositivos, searchTerm, selectedCategoria]);

  const openCreateModal = () => {
    if (!canEdit) return;
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (item: Dispositivo) => {
    if (!canEdit) return;
    setEditingItem(item);
    setFormData({
      codigo_gs1: item.codigo_gs1,
      nombre: item.nombre,
      categoria: item.categoria,
      stock_minimo: item.stock_minimo,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setFormError(null);

    if (!formData.codigo_gs1.trim() || !formData.nombre.trim() || !formData.categoria.trim()) {
      setFormError('Complete código GS1, nombre y categoría del dispositivo.');
      return;
    }

    const stockMin = Number(formData.stock_minimo);
    if (!Number.isInteger(stockMin) || stockMin < 0) {
      setFormError('El stock mínimo debe ser un número entero mayor o igual a 0.');
      return;
    }

    const payload: DispositivoPayload = {
      codigo_gs1: formData.codigo_gs1.trim(),
      nombre: formData.nombre.trim(),
      categoria: formData.categoria.trim(),
      stock_minimo: stockMin,
    };

    setIsSaving(true);
    try {
      if (editingItem) {
        await dispositivosApi.update(editingItem.id, payload);
      } else {
        await dispositivosApi.create(payload);
      }
      setIsFormOpen(false);
      await onCatalogChanged();
    } catch (error) {
      setFormError(extractApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canEdit || !deletingItem) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await dispositivosApi.remove(deletingItem.id);
      setDeletingItem(null);
      await onCatalogChanged();
    } catch (error) {
      setDeleteError(extractApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aviso de solo lectura para rol CLINICO */}
      {!canEdit && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
          <Lock className="w-4 h-4 text-[#0F4C81] shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-slate-900">
              Modo lectura clínica ({userRole}):
            </strong>{' '}
            la creación, edición y eliminación de dispositivos del catálogo está
            habilitada exclusivamente para perfiles <strong>ADMIN</strong> o{' '}
            <strong>JEFE_BODEGA</strong>.
          </span>
        </div>
      )}

      <section
        aria-label="Catálogo maestro de dispositivos médicos"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        {/* Barra superior de filtros y acción RBAC */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o código GS1..."
                aria-label="Buscar dispositivos médicos"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
              />
            </div>

            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              aria-label="Filtrar por categoría"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
            >
              <option value="ALL">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Nuevo Dispositivo</span>
            </button>
          )}
        </div>

        {/* Tabla del catálogo */}
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-12 rounded-lg bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filteredDispositivos.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <Package
              className="w-10 h-10 text-slate-300 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-slate-900">
              No se encontraron dispositivos médicos
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {dispositivos.length === 0
                ? 'Aún no hay insumos registrados en el catálogo institucional.'
                : 'Ajuste los filtros de búsqueda para ver otros resultados.'}
            </p>
            {canEdit && dispositivos.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-xs font-semibold text-white"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Registrar Primer Dispositivo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-5">Código GS1</th>
                  <th className="py-3 px-5">Nombre del Dispositivo</th>
                  <th className="py-3 px-5">Categoría</th>
                  <th className="py-3 px-5 text-right">Stock Mínimo</th>
                  {canEdit && (
                    <th className="py-3 px-5 text-right">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredDispositivos.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-5 font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
                      {item.codigo_gs1}
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-900">
                      {item.nombre}
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {item.categoria}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {item.stock_minimo}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            aria-label={`Editar ${item.nombre}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingItem(item);
                            }}
                            aria-label={`Eliminar ${item.nombre}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-medium text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Crear / Editar Dispositivo (solo ADMIN / JEFE_BODEGA) */}
      {canEdit && isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="device-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2
                id="device-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingItem
                  ? 'Editar Dispositivo Médico'
                  : 'Nuevo Dispositivo Médico'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Cerrar formulario"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
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
                  htmlFor="device-gs1"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Código GS1 <span className="text-rose-600">*</span>
                </label>
                <input
                  id="device-gs1"
                  type="text"
                  required
                  value={formData.codigo_gs1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      codigo_gs1: e.target.value,
                    }))
                  }
                  placeholder="Ej: 7801234567890"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="device-nombre"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Nombre Clínico <span className="text-rose-600">*</span>
                </label>
                <input
                  id="device-nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  placeholder="Ej: Catéter Venoso Periférico 20G"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="device-categoria"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Categoría <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="device-categoria"
                    type="text"
                    required
                    value={formData.categoria}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        categoria: e.target.value,
                      }))
                    }
                    placeholder="Ej: Insumos Vasculares"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="device-stock-min"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Stock Mínimo <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="device-stock-min"
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={formData.stock_minimo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stock_minimo: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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
                  <span>
                    {editingItem ? 'Guardar Cambios' : 'Crear Dispositivo'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminación */}
      {canEdit && deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-device-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h2
              id="delete-device-title"
              className="text-base font-bold text-slate-900"
            >
              Confirmar eliminación
            </h2>
            <p className="text-sm text-slate-600">
              ¿Está seguro que desea eliminar{' '}
              <strong className="text-slate-900">{deletingItem.nombre}</strong>{' '}
              (<span className="font-mono">{deletingItem.codigo_gs1}</span>)?
            </p>

            {deleteError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
              >
                <AlertCircle
                  className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-xs font-semibold text-white"
              >
                {isDeleting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                )}
                <span>Eliminar Dispositivo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
