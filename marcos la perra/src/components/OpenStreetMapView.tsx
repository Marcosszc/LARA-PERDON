import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Check,
  Copy,
  Crosshair,
  ExternalLink,
  Maximize2,
  Pencil,
} from 'lucide-react';
import {
  buildGoogleMapsUrl,
  formatCoord,
  SERVICE_LABELS,
  type PuntoAsistencia,
  type TipoServicio,
} from '../types/punto';

interface OpenStreetMapViewProps {
  puntos: PuntoAsistencia[];
  selectedId: string | null;
  onSelectPunto: (id: string) => void;
  onEditPunto: (punto: PuntoAsistencia) => void;
  isPickingCoords: boolean;
  onPickCoords: (latitud: number, longitud: number) => void;
  onCancelPickCoords: () => void;
}

const SERVICE_PIN_COLORS: Record<TipoServicio, string> = {
  inflado: '#0f766e',
  herramientas: '#b45309',
  ambos: '#1d4ed8',
};

function createMarkerIcon(servicio: TipoServicio, isSelected: boolean): L.DivIcon {
  const fill = SERVICE_PIN_COLORS[servicio];
  const size = isSelected ? 34 : 26;
  const strokeWidth = isSelected ? 3 : 2;
  const ring = isSelected
    ? `<circle cx="17" cy="17" r="15" fill="none" stroke="#0f172a" stroke-width="2" stroke-opacity="0.25" />`
    : '';

  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 34 34" style="display:block;filter:drop-shadow(0 3px 6px rgba(15,23,42,0.28));">
      ${ring}
      <circle cx="17" cy="17" r="${isSelected ? 11 : 9}" fill="${fill}" stroke="#ffffff" stroke-width="${strokeWidth}" />
      <circle cx="17" cy="17" r="${isSelected ? 4 : 3}" fill="#ffffff" />
    </svg>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    tooltipAnchor: [0, -(size / 2) - 4],
  });
}

export function OpenStreetMapView({
  puntos,
  selectedId,
  onSelectPunto,
  onEditPunto,
  isPickingCoords,
  onPickCoords,
  onCancelPickCoords,
}: OpenStreetMapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickHandlerRef = useRef(onPickCoords);
  const isPickingRef = useRef(isPickingCoords);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  pickHandlerRef.current = onPickCoords;
  isPickingRef.current = isPickingCoords;

  const selectedPunto = puntos.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-34.603722, -58.381592],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapRef.current = map;

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (isPickingRef.current) {
        const lat = Number(event.latlng.lat.toFixed(6));
        const lng = Number(event.latlng.lng.toFixed(6));
        pickHandlerRef.current(lat, lng);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    puntos.forEach((punto) => {
      const isSelected = punto.id === selectedId;
      const marker = L.marker([punto.latitud, punto.longitud], {
        icon: createMarkerIcon(punto.servicio, isSelected),
        zIndexOffset: isSelected ? 500 : 0,
      });

      marker.bindTooltip(punto.nombre, {
        permanent: isSelected,
        direction: 'top',
        offset: [0, -6],
        className: 'punto-label-tooltip',
      });

      marker.on('click', () => {
        if (!isPickingRef.current) {
          onSelectPunto(punto.id);
        }
      });

      marker.addTo(layer);
    });
  }, [puntos, selectedId, onSelectPunto]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedPunto) {
      map.flyTo([selectedPunto.latitud, selectedPunto.longitud], Math.max(map.getZoom(), 14), {
        duration: 0.55,
      });
    } else if (puntos.length > 0) {
      const bounds = L.latLngBounds(
        puntos.map((p) => [p.latitud, p.longitud] as [number, number])
      );
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    }
  }, [selectedPunto, puntos]);

  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map || puntos.length === 0) return;
    const bounds = L.latLngBounds(
      puntos.map((p) => [p.latitud, p.longitud] as [number, number])
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  };

  const handleCopyCoords = async (punto: PuntoAsistencia) => {
    const text = `${formatCoord(punto.latitud)}, ${formatCoord(punto.longitud)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(punto.id);
      setTimeout(() => setCopiedId((prev) => (prev === punto.id ? null : prev)), 2000);
    } catch {
      // Fallback silencioso si el navegador bloquea el portapapeles
    }
  };

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
      <div
        ref={containerRef}
        className={`w-full h-full min-h-[480px] ${
          isPickingCoords ? 'cursor-crosshair' : ''
        }`}
        aria-label="Mapa interactivo de OpenStreetMap con puntos de asistencia"
      />

      {isPickingCoords && (
        <div className="absolute top-3 left-3 right-14 z-[1000] flex items-center justify-between gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg border border-slate-800">
          <div className="flex items-center gap-2.5 text-sm">
            <Crosshair className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Hacé clic sobre el mapa para capturar latitud y longitud en grados decimales.</span>
          </div>
          <button
            type="button"
            onClick={onCancelPickCoords}
            className="px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-md whitespace-nowrap shrink-0 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {!isPickingCoords && puntos.length > 0 && (
        <div className="absolute top-3 left-3 z-[900]">
          <button
            type="button"
            onClick={handleFitAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium rounded-lg border border-slate-200 shadow-sm transition-colors whitespace-nowrap"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Encuadrar puntos ({puntos.length})
          </button>
        </div>
      )}

      {!isPickingCoords && selectedPunto && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[400px] z-[950] bg-white border border-slate-200 rounded-xl shadow-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {selectedPunto.nombre}
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                <span>{SERVICE_LABELS[selectedPunto.servicio]}</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>{selectedPunto.horario}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditPunto(selectedPunto)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors shrink-0"
              title="Editar punto"
              aria-label={`Editar ${selectedPunto.nombre}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-2.5 text-sm text-slate-700 leading-snug">
            {selectedPunto.referencia_puesto}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono-tabular text-xs text-slate-600">
              {formatCoord(selectedPunto.latitud)}, {formatCoord(selectedPunto.longitud)}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyCoords(selectedPunto)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {copiedId === selectedPunto.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </>
                )}
              </button>

              <a
                href={buildGoogleMapsUrl(selectedPunto.latitud, selectedPunto.longitud)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir en Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
