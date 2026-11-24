import { ExternalLink, MapPin, Pencil, Trash2 } from 'lucide-react';
import {
  buildGoogleMapsUrl,
  formatCoord,
  SERVICE_LABELS,
  type PuntoAsistencia,
} from '../types/punto';

interface PuntosTableViewProps {
  puntos: PuntoAsistencia[];
  selectedId: string | null;
  onInspectOnMap: (id: string) => void;
  onEdit: (punto: PuntoAsistencia) => void;
  onDelete: (punto: PuntoAsistencia) => void;
}

export function PuntosTableView({
  puntos,
  selectedId,
  onInspectOnMap,
  onEdit,
  onDelete,
}: PuntosTableViewProps) {
  if (puntos.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <p className="text-sm font-medium text-slate-900">
          No hay puntos registrados para el filtro seleccionado.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Cambiá el filtro de servicio o agregá un nuevo punto de asistencia.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="py-3 px-4">Nombre del punto</th>
              <th className="py-3 px-4">Servicio</th>
              <th className="py-3 px-4">Horario</th>
              <th className="py-3 px-4">Referencia del puesto</th>
              <th className="py-3 px-4 text-right">Latitud</th>
              <th className="py-3 px-4 text-right">Longitud</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {puntos.map((punto) => {
              const isSelected = punto.id === selectedId;
              return (
                <tr
                  key={punto.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {punto.nombre}
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    {SERVICE_LABELS[punto.servicio]}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {punto.horario}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={punto.referencia_puesto}>
                    {punto.referencia_puesto}
                  </td>
                  <td className="py-3 px-4 font-mono-tabular text-xs text-slate-700 text-right whitespace-nowrap">
                    {formatCoord(punto.latitud)}
                  </td>
                  <td className="py-3 px-4 font-mono-tabular text-xs text-slate-700 text-right whitespace-nowrap">
                    {formatCoord(punto.longitud)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspectOnMap(punto.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Mapa
                      </button>
                      <a
                        href={buildGoogleMapsUrl(punto.latitud, punto.longitud)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Google Maps
                      </a>
                      <button
                        type="button"
                        onClick={() => onEdit(punto)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        aria-label={`Editar ${punto.nombre}`}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(punto)}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        aria-label={`Eliminar ${punto.nombre}`}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
