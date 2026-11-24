export type TipoServicio = 'inflado' | 'herramientas' | 'ambos';

export type FiltroServicio = 'todos' | 'inflado' | 'herramientas';

export interface PuntoAsistencia {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  servicio: TipoServicio;
  horario: string;
  referencia_puesto: string;
  created_at?: string;
}

export interface PuntoInput {
  nombre: string;
  latitud: number;
  longitud: number;
  servicio: TipoServicio;
  horario: string;
  referencia_puesto: string;
}

export const SERVICE_LABELS: Record<TipoServicio, string> = {
  inflado: 'Inflado',
  herramientas: 'Herramientas',
  ambos: 'Inflado y herramientas',
};

export function buildGoogleMapsUrl(latitud: number, longitud: number): string {
  const lat = Number(latitud).toFixed(6);
  const lng = Number(longitud).toFixed(6);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function formatCoord(value: number): string {
  return Number(value).toFixed(6);
}

export function matchesServicioFilter(
  servicio: TipoServicio,
  filtro: FiltroServicio
): boolean {
  if (filtro === 'todos') return true;
  if (filtro === 'inflado') {
    return servicio === 'inflado' || servicio === 'ambos';
  }
  if (filtro === 'herramientas') {
    return servicio === 'herramientas' || servicio === 'ambos';
  }
  return true;
}

export function parseDecimalCoord(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const normalized = raw.trim().replace(',', '.');
  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    return Number.NaN;
  }
  return Number(normalized);
}

export function validatePuntoInput(payload: {
  nombre?: unknown;
  latitud?: unknown;
  longitud?: unknown;
  servicio?: unknown;
  horario?: unknown;
  referencia_puesto?: unknown;
}): { ok: true; data: PuntoInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const nombre = typeof payload.nombre === 'string' ? payload.nombre.trim() : '';
  if (!nombre) {
    errors.nombre = 'Ingresá el nombre del punto.';
  } else if (nombre.length > 120) {
    errors.nombre = 'El nombre no puede superar los 120 caracteres.';
  }

  const latRaw =
    typeof payload.latitud === 'number' || typeof payload.latitud === 'string'
      ? parseDecimalCoord(payload.latitud)
      : Number.NaN;
  if (!Number.isFinite(latRaw)) {
    errors.latitud = 'Ingresá una latitud válida en grados decimales (ej. -34.603722).';
  } else if (latRaw < -90 || latRaw > 90) {
    errors.latitud = 'La latitud debe estar entre -90 y 90 grados.';
  }

  const lngRaw =
    typeof payload.longitud === 'number' || typeof payload.longitud === 'string'
      ? parseDecimalCoord(payload.longitud)
      : Number.NaN;
  if (!Number.isFinite(lngRaw)) {
    errors.longitud = 'Ingresá una longitud válida en grados decimales (ej. -58.381592).';
  } else if (lngRaw < -180 || lngRaw > 180) {
    errors.longitud = 'La longitud debe estar entre -180 y 180 grados.';
  }

  const servicio = payload.servicio;
  if (servicio !== 'inflado' && servicio !== 'herramientas' && servicio !== 'ambos') {
    errors.servicio = 'Seleccioná un servicio válido (inflado, herramientas o ambos).';
  }

  const horario = typeof payload.horario === 'string' ? payload.horario.trim() : '';
  if (!horario) {
    errors.horario = 'Indicá el horario de atención.';
  } else if (horario.length > 120) {
    errors.horario = 'El horario no puede superar los 120 caracteres.';
  }

  const referencia =
    typeof payload.referencia_puesto === 'string'
      ? payload.referencia_puesto.trim()
      : '';
  if (!referencia) {
    errors.referencia_puesto = 'Indicá la referencia del puesto.';
  } else if (referencia.length > 240) {
    errors.referencia_puesto = 'La referencia no puede superar los 240 caracteres.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      nombre,
      latitud: Number(latRaw.toFixed(6)),
      longitud: Number(lngRaw.toFixed(6)),
      servicio: servicio as TipoServicio,
      horario,
      referencia_puesto: referencia,
    },
  };
}
