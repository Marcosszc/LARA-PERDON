/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
  Wind,
} from 'lucide-react';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DeployGuideView } from './components/DeployGuideView';
import { OpenStreetMapView } from './components/OpenStreetMapView';
import { PuntoFormModal } from './components/PuntoFormModal';
import { PuntosTableView } from './components/PuntosTableView';
import {
  buildGoogleMapsUrl,
  formatCoord,
  SERVICE_LABELS,
  type FiltroServicio,
  type PuntoAsistencia,
  type PuntoInput,
  type TipoServicio,
} from './types/punto';

type ActiveTab = 'explorador' | 'tabla' | 'despliegue';

function ServiceIcon({ servicio }: { servicio: TipoServicio }) {
  if (servicio === 'inflado') {
    return <Wind className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-hidden="true" />;
  }
  if (servicio === 'herramientas') {
    return <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />;
  }
  return <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorador');
  const [puntos, setPuntos] = useState<PuntoAsistencia[]>([]);
  const [filtroServicio, setFiltroServicio] = useState<FiltroServicio>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPickingCoords, setIsPickingCoords] = useState(false);
  const [editingPunto, setEditingPunto] = useState<PuntoAsistencia | null>(null);
  const [pickedCoords, setPickedCoords] = useState<{
    latitud: number;
    longitud: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState<string | null>(null);

  const [deletingPunto, setDeletingPunto] = useState<PuntoAsistencia | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPuntos = useCallback(async (servicioFilter: FiltroServicio) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (servicioFilter !== 'todos') {
        params.set('servicio', servicioFilter);
      }
      const query = params.toString();
      const res = await fetch(`/api/puntos${query ? `?${query}` : ''}`);
      if (!res.ok) {
        throw new Error('Error al cargar los puntos de asistencia.');
      }
      const data = (await res.json()) as PuntoAsistencia[];
      setPuntos(data);
      setSelectedId((prev) => {
        if (prev && data.some((p) => p.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con el servidor.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuntos(filtroServicio);
  }, [fetchPuntos, filtroServicio]);

  const filteredPuntos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return puntos;
    return puntos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.referencia_puesto.toLowerCase().includes(q) ||
        p.horario.toLowerCase().includes(q)
    );
  }, [puntos, searchQuery]);

  const handleOpenCreate = () => {
    setEditingPunto(null);
    setPickedCoords(null);
    setFormServerError(null);
    setIsPickingCoords(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (punto: PuntoAsistencia) => {
    setEditingPunto(punto);
    setPickedCoords(null);
    setFormServerError(null);
    setIsPickingCoords(false);
    setIsFormOpen(true);
  };

  const handleRequestMapPick = () => {
    setActiveTab('explorador');
    setIsPickingCoords(true);
  };

  const handlePickCoordsFromMap = (latitud: number, longitud: number) => {
    setPickedCoords({ latitud, longitud });
    setIsPickingCoords(false);
  };

  const handleSubmitForm = async (data: PuntoInput) => {
    setIsSubmitting(true);
    setFormServerError(null);
    try {
      const isEdit = Boolean(editingPunto);
      const url = isEdit ? `/api/puntos/${editingPunto!.id}` : '/api/puntos';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!res.ok) {
        const detail =
          body?.errors && typeof body.errors === 'object'
            ? Object.values(body.errors).join(' ')
            : body?.error || 'No se pudo guardar el punto.';
        setFormServerError(detail);
        return;
      }

      const saved = body as PuntoAsistencia;
      setIsFormOpen(false);
      setEditingPunto(null);
      setPickedCoords(null);
      await fetchPuntos(filtroServicio);
      setSelectedId(saved.id);
    } catch {
      setFormServerError('Error de red al guardar el punto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPunto) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/puntos/${deletingPunto.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('No se pudo eliminar el punto.');
      }
      const removedId = deletingPunto.id;
      setDeletingPunto(null);
      await fetchPuntos(filtroServicio);
      if (selectedId === removedId) {
        setSelectedId(null);
      }
    } catch {
      setLoadError('No se pudo eliminar el registro seleccionado.');
      setDeletingPunto(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInspectOnMap = (id: string) => {
    setSelectedId(id);
    setActiveTab('explorador');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Barra superior: contrato de 3 zonas */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[1050]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#explorador"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('explorador');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Puntos de Asistencia
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveTab('explorador')}
              className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'explorador'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Explorador y Mapa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tabla')}
              className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'tabla'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Listado completo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('despliegue')}
              className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'despliegue'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              SQL y Despliegue
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo punto
            </button>
          </div>
        </div>

        {/* Navegación móvil compacta */}
        <div className="flex md:hidden border-t border-slate-100 px-4 gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('explorador')}
            className={`py-2.5 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 ${
              activeTab === 'explorador'
                ? 'border-blue-700 text-slate-900'
                : 'border-transparent text-slate-600'
            }`}
          >
            Explorador y Mapa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tabla')}
            className={`py-2.5 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 ${
              activeTab === 'tabla'
                ? 'border-blue-700 text-slate-900'
                : 'border-transparent text-slate-600'
            }`}
          >
            Listado completo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('despliegue')}
            className={`py-2.5 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 ${
              activeTab === 'despliegue'
                ? 'border-blue-700 text-slate-900'
                : 'border-transparent text-slate-600'
            }`}
          >
            SQL y Despliegue
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">
        {loadError && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => fetchPuntos(filtroServicio)}
              className="px-3 py-1 text-xs font-semibold bg-white border border-red-200 hover:bg-red-100 rounded-md whitespace-nowrap shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Controles compartidos de filtro cuando se muestran puntos */}
        {activeTab !== 'despliegue' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Red de Puntos de Inflado y Herramientas
              </h1>
              <p className="text-sm text-slate-600">
                Seleccioná un registro para centrar OpenStreetMap o abrir sus coordenadas decimales en Google Maps.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label="Filtrar por servicio"
                className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
              >
                {(
                  [
                    { id: 'todos', label: 'Todos' },
                    { id: 'inflado', label: 'Inflado' },
                    { id: 'herramientas', label: 'Herramientas' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFiltroServicio(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      filtroServicio === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'explorador' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
            {/* Columna izquierda: buscador + listado */}
            <section
              aria-label="Listado de puntos de asistencia"
              className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden lg:max-h-[calc(100vh-200px)] min-h-[480px]"
            >
              <div className="p-3.5 border-b border-slate-200">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, horario o referencia..."
                    aria-label="Buscar puntos"
                    className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    <span className="font-mono-tabular font-medium text-slate-700">
                      {filteredPuntos.length}
                    </span>{' '}
                    {filteredPuntos.length === 1 ? 'punto visible' : 'puntos visibles'}
                  </span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-blue-700 hover:text-blue-800 font-medium"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="p-4 space-y-2 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-5/6" />
                    </div>
                  ))
                ) : filteredPuntos.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      Sin puntos coincidentes
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Probá cambiando el filtro de servicio o agregando un nuevo punto.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreate}
                      className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar punto
                    </button>
                  </div>
                ) : (
                  filteredPuntos.map((punto) => {
                    const isSelected = punto.id === selectedId;
                    return (
                      <div
                        key={punto.id}
                        className={`p-4 transition-colors ${
                          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedId(punto.id)}
                            className="text-left flex-1 min-w-0 focus:outline-none"
                          >
                            <div className="flex items-center gap-2">
                              <ServiceIcon servicio={punto.servicio} />
                              <span
                                className={`text-sm font-semibold truncate ${
                                  isSelected ? 'text-blue-900' : 'text-slate-900'
                                }`}
                              >
                                {punto.nombre}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-600">
                              <span>{SERVICE_LABELS[punto.servicio]}</span>
                              <span aria-hidden="true" className="mx-1.5">·</span>
                              <span>{punto.horario}</span>
                            </p>

                            <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                              {punto.referencia_puesto}
                            </p>

                            <p className="mt-2 font-mono-tabular text-[11px] text-slate-500">
                              {formatCoord(punto.latitud)}, {formatCoord(punto.longitud)}
                            </p>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={buildGoogleMapsUrl(punto.latitud, punto.longitud)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir en Google Maps"
                              aria-label={`Abrir ${punto.nombre} en Google Maps`}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(punto)}
                              title="Editar punto"
                              aria-label={`Editar ${punto.nombre}`}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPunto(punto)}
                              title="Eliminar punto"
                              aria-label={`Eliminar ${punto.nombre}`}
                              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Columna derecha: Mapa OpenStreetMap */}
            <section
              aria-label="Mapa OpenStreetMap"
              className="lg:col-span-7 xl:col-span-8 lg:h-[calc(100vh-200px)] min-h-[480px]"
            >
              <OpenStreetMapView
                puntos={filteredPuntos}
                selectedId={selectedId}
                onSelectPunto={setSelectedId}
                onEditPunto={handleOpenEdit}
                isPickingCoords={isPickingCoords}
                onPickCoords={handlePickCoordsFromMap}
                onCancelPickCoords={() => setIsPickingCoords(false)}
              />
            </section>
          </div>
        )}

        {activeTab === 'tabla' && (
          <PuntosTableView
            puntos={filteredPuntos}
            selectedId={selectedId}
            onInspectOnMap={handleInspectOnMap}
            onEdit={handleOpenEdit}
            onDelete={setDeletingPunto}
          />
        )}

        {activeTab === 'despliegue' && <DeployGuideView />}
      </main>

      <PuntoFormModal
        isOpen={isFormOpen}
        isHiddenForPick={isPickingCoords}
        editingPunto={editingPunto}
        pickedCoords={pickedCoords}
        isSubmitting={isSubmitting}
        serverError={formServerError}
        onRequestMapPick={handleRequestMapPick}
        onClose={() => {
          setIsFormOpen(false);
          setIsPickingCoords(false);
          setEditingPunto(null);
          setPickedCoords(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <DeleteConfirmModal
        punto={deletingPunto}
        isDeleting={isDeleting}
        onCancel={() => setDeletingPunto(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
