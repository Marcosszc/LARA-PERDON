import { useEffect, useState, type FormEvent } from 'react';
import { Crosshair, ExternalLink, X } from 'lucide-react';
import {
  buildGoogleMapsUrl,
  parseDecimalCoord,
  validatePuntoInput,
  type PuntoAsistencia,
  type PuntoInput,
  type TipoServicio,
} from '../types/punto';

interface PuntoFormModalProps {
  isOpen: boolean;
  isHiddenForPick: boolean;
  editingPunto: PuntoAsistencia | null;
  pickedCoords: { latitud: number; longitud: number } | null;
  isSubmitting: boolean;
  serverError: string | null;
  onRequestMapPick: () => void;
  onClose: () => void;
  onSubmit: (data: PuntoInput) => Promise<void>;
}

const SERVICIO_OPCIONES: { value: TipoServicio; label: string }[] = [
  { value: 'inflado', label: 'Inflado' },
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'ambos', label: 'Inflado y herramientas' },
];

export function PuntoFormModal({
  isOpen,
  isHiddenForPick,
  editingPunto,
  pickedCoords,
  isSubmitting,
  serverError,
  onRequestMapPick,
  onClose,
  onSubmit,
}: PuntoFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [servicio, setServicio] = useState<TipoServicio>('inflado');
  const [horario, setHorario] = useState('');
  const [referenciaPuesto, setReferenciaPuesto] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingPunto) {
      setNombre(editingPunto.nombre);
      setLatitud(String(editingPunto.latitud));
      setLongitud(String(editingPunto.longitud));
      setServicio(editingPunto.servicio);
      setHorario(editingPunto.horario);
      setReferenciaPuesto(editingPunto.referencia_puesto);
    } else {
      setNombre('');
      setLatitud('');
      setLongitud('');
      setServicio('inflado');
      setHorario('');
      setReferenciaPuesto('');
    }
    setErrors({});
  }, [isOpen, editingPunto]);

  useEffect(() => {
    if (!pickedCoords) return;
    setLatitud(String(pickedCoords.latitud));
    setLongitud(String(pickedCoords.longitud));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.latitud;
      delete next.longitud;
      return next;
    });
  }, [pickedCoords]);

  if (!isOpen || isHiddenForPick) return null;

  const latParsed = parseDecimalCoord(latitud);
  const lngParsed = parseDecimalCoord(longitud);
  const coordsValidForPreview =
    Number.isFinite(latParsed) &&
    latParsed >= -90 &&
    latParsed <= 90 &&
    Number.isFinite(lngParsed) &&
    lngParsed >= -180 &&
    lngParsed <= 180;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = validatePuntoInput({
      nombre,
      latitud,
      longitud,
      servicio,
      horario,
      referencia_puesto: referenciaPuesto,
    });

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmit(result.data);
  };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-punto-titulo"
    >
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="modal-punto-titulo" className="text-lg font-semibold text-slate-900">
            {editingPunto ? 'Editar punto de asistencia' : 'Nuevo punto de asistencia'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="px-3.5 py-2.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="punto-nombre" className="block text-sm font-medium text-slate-800 mb-1">
              Nombre del punto
            </label>
            <input
              id="punto-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Estación Parque Centenario"
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-800 mb-1.5">
              Servicio disponible
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {SERVICIO_OPCIONES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setServicio(opt.value)}
                  className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                    servicio === opt.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.servicio && (
              <p className="mt-1 text-xs text-red-600">{errors.servicio}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-800">
                Coordenadas en grados decimales
              </span>
              <button
                type="button"
                onClick={onRequestMapPick}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
              >
                <Crosshair className="w-3.5 h-3.5" />
                Elegir en el mapa
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="punto-latitud" className="block text-xs text-slate-600 mb-1">
                  Latitud (-90 a 90)
                </label>
                <input
                  id="punto-latitud"
                  type="text"
                  inputMode="decimal"
                  value={latitud}
                  onChange={(e) => setLatitud(e.target.value)}
                  placeholder="-34.603722"
                  className="w-full px-3 py-2 text-sm font-mono-tabular text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                {errors.latitud && (
                  <p className="mt-1 text-xs text-red-600">{errors.latitud}</p>
                )}
              </div>

              <div>
                <label htmlFor="punto-longitud" className="block text-xs text-slate-600 mb-1">
                  Longitud (-180 a 180)
                </label>
                <input
                  id="punto-longitud"
                  type="text"
                  inputMode="decimal"
                  value={longitud}
                  onChange={(e) => setLongitud(e.target.value)}
                  placeholder="-58.381592"
                  className="w-full px-3 py-2 text-sm font-mono-tabular text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                {errors.longitud && (
                  <p className="mt-1 text-xs text-red-600">{errors.longitud}</p>
                )}
              </div>
            </div>

            {coordsValidForPreview && (
              <div className="mt-2">
                <a
                  href={buildGoogleMapsUrl(latParsed, lngParsed)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Verificar ubicación en Google Maps
                </a>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="punto-horario" className="block text-sm font-medium text-slate-800 mb-1">
              Horario
            </label>
            <input
              id="punto-horario"
              type="text"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="Ej. Lun a Dom 08:00 - 20:00 o 24 horas"
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            {errors.horario && (
              <p className="mt-1 text-xs text-red-600">{errors.horario}</p>
            )}
          </div>

          <div>
            <label htmlFor="punto-referencia" className="block text-sm font-medium text-slate-800 mb-1">
              Referencia del puesto
            </label>
            <textarea
              id="punto-referencia"
              rows={2}
              value={referenciaPuesto}
              onChange={(e) => setReferenciaPuesto(e.target.value)}
              placeholder="Ej. Junto al acceso norte, módulo metálico azul"
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none"
            />
            {errors.referencia_puesto && (
              <p className="mt-1 text-xs text-red-600">{errors.referencia_puesto}</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              {isSubmitting
                ? 'Guardando...'
                : editingPunto
                ? 'Guardar cambios'
                : 'Agregar punto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
