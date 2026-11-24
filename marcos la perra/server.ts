import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  matchesServicioFilter,
  validatePuntoInput,
  type FiltroServicio,
  type PuntoAsistencia,
  type PuntoInput,
} from './src/types/punto.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '') || '';
const SUPABASE_KEY =
  process.env.SUPABASE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  '';

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
const TABLE_NAME = 'puntos_asistencia';

const DATA_DIR = path.resolve(__dirname, 'data');
const LOCAL_STORE_PATH = path.resolve(DATA_DIR, 'puntos.json');

const SEED_PUNTOS: PuntoAsistencia[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    nombre: 'Estación Ciclovía Palermo',
    latitud: -34.5736,
    longitud: -58.4148,
    servicio: 'inflado',
    horario: '24 horas',
    referencia_puesto: 'Tótem azul junto al cruce de Av. del Libertador y Av. Sarmiento',
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    nombre: 'Taller Urbano Centro',
    latitud: -34.603722,
    longitud: -58.381592,
    servicio: 'herramientas',
    horario: 'Lun a Sáb 08:00 - 20:00',
    referencia_puesto: 'Puesto municipal sobre dársena peatonal, esquina Diagonal Norte',
    created_at: '2026-01-11T10:00:00.000Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    nombre: 'Parador Costanera Sur',
    latitud: -34.61845,
    longitud: -58.35621,
    servicio: 'ambos',
    horario: 'Mar a Dom 09:00 - 19:00',
    referencia_puesto: 'Acceso sur frente a la Fuente de las Nereidas, módulo metálico verde',
    created_at: '2026-01-12T10:00:00.000Z',
  },
];

function ensureLocalStore(): PuntoAsistencia[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_STORE_PATH)) {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(SEED_PUNTOS, null, 2), 'utf8');
    return [...SEED_PUNTOS];
  }
  try {
    const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as PuntoAsistencia[];
    }
  } catch (error) {
    console.error('Error leyendo almacenamiento local:', error);
  }
  fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(SEED_PUNTOS, null, 2), 'utf8');
  return [...SEED_PUNTOS];
}

function saveLocalStore(items: PuntoAsistencia[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(items, null, 2), 'utf8');
}

async function supabaseFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = new Headers(options.headers);
  headers.set('apikey', SUPABASE_KEY);
  headers.set('Authorization', `Bearer ${SUPABASE_KEY}`);
  headers.set('Content-Type', 'application/json');
  return fetch(url, { ...options, headers });
}

async function listPuntos(filtro: FiltroServicio): Promise<PuntoAsistencia[]> {
  if (isSupabaseConfigured) {
    const res = await supabaseFetch(
      `${TABLE_NAME}?select=*&order=created_at.asc`,
      { method: 'GET' }
    );
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Supabase error (${res.status}): ${detail}`);
    }
    const rows = (await res.json()) as PuntoAsistencia[];
    return rows.filter((p) => matchesServicioFilter(p.servicio, filtro));
  }

  const items = ensureLocalStore();
  return items.filter((p) => matchesServicioFilter(p.servicio, filtro));
}

async function createPunto(input: PuntoInput): Promise<PuntoAsistencia> {
  if (isSupabaseConfigured) {
    const res = await supabaseFetch(TABLE_NAME, {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Supabase error (${res.status}): ${detail}`);
    }
    const created = (await res.json()) as PuntoAsistencia[];
    return created[0];
  }

  const items = ensureLocalStore();
  const nuevo: PuntoAsistencia = {
    id: crypto.randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  items.push(nuevo);
  saveLocalStore(items);
  return nuevo;
}

async function updatePunto(
  id: string,
  input: PuntoInput
): Promise<PuntoAsistencia | null> {
  if (isSupabaseConfigured) {
    const res = await supabaseFetch(
      `${TABLE_NAME}?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(input),
      }
    );
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Supabase error (${res.status}): ${detail}`);
    }
    const updated = (await res.json()) as PuntoAsistencia[];
    return updated[0] || null;
  }

  const items = ensureLocalStore();
  const idx = items.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const updated: PuntoAsistencia = {
    ...items[idx],
    ...input,
  };
  items[idx] = updated;
  saveLocalStore(items);
  return updated;
}

async function deletePunto(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const res = await supabaseFetch(
      `${TABLE_NAME}?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: {
          Prefer: 'return=representation',
        },
      }
    );
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Supabase error (${res.status}): ${detail}`);
    }
    const deleted = (await res.json()) as PuntoAsistencia[];
    return deleted.length > 0;
  }

  const items = ensureLocalStore();
  const next = items.filter((p) => p.id !== id);
  if (next.length === items.length) return false;
  saveLocalStore(next);
  return true;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      backend: isSupabaseConfigured ? 'supabase' : 'local',
    });
  });

  app.get('/api/puntos', async (req, res) => {
    try {
      const servicioParam = req.query.servicio;
      const filtro: FiltroServicio =
        servicioParam === 'inflado' || servicioParam === 'herramientas'
          ? servicioParam
          : 'todos';
      const puntos = await listPuntos(filtro);
      res.json(puntos);
    } catch (error) {
      console.error('Error al listar puntos:', error);
      res.status(500).json({ error: 'No se pudieron obtener los puntos.' });
    }
  });

  app.post('/api/puntos', async (req, res) => {
    const validation = validatePuntoInput(req.body ?? {});
    if (!validation.ok) {
      return res.status(400).json({
        error: 'Datos inválidos.',
        errors: validation.errors,
      });
    }

    try {
      const created = await createPunto(validation.data);
      return res.status(201).json(created);
    } catch (error) {
      console.error('Error al crear punto:', error);
      return res.status(500).json({ error: 'No se pudo guardar el punto.' });
    }
  });

  app.put('/api/puntos/:id', async (req, res) => {
    const id = req.params.id;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'ID de punto inválido.' });
    }

    const validation = validatePuntoInput(req.body ?? {});
    if (!validation.ok) {
      return res.status(400).json({
        error: 'Datos inválidos.',
        errors: validation.errors,
      });
    }

    try {
      const updated = await updatePunto(id, validation.data);
      if (!updated) {
        return res.status(404).json({ error: 'Punto no encontrado.' });
      }
      return res.json(updated);
    } catch (error) {
      console.error('Error al actualizar punto:', error);
      return res.status(500).json({ error: 'No se pudo actualizar el punto.' });
    }
  });

  app.delete('/api/puntos/:id', async (req, res) => {
    const id = req.params.id;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'ID de punto inválido.' });
    }

    try {
      const deleted = await deletePunto(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Punto no encontrado.' });
      }
      return res.json({ deleted: true, id });
    } catch (error) {
      console.error('Error al eliminar punto:', error);
      return res.status(500).json({ error: 'No se pudo eliminar el punto.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
