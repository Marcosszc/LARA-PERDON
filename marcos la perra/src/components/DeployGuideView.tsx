import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

const SUPABASE_SQL_SNIPPET = `CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.puntos_asistencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  latitud double precision NOT NULL CHECK (latitud >= -90 AND latitud <= 90),
  longitud double precision NOT NULL CHECK (longitud >= -180 AND longitud <= 180),
  servicio text NOT NULL CHECK (servicio IN ('inflado', 'herramientas', 'ambos')),
  horario text NOT NULL,
  referencia_puesto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);`;

const RENDER_YAML_SNIPPET = `services:
  - type: web
    name: red-puntos-asistencia
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_KEY
        sync: false`;

export function DeployGuideView() {
  const [copiedBlock, setCopiedBlock] = useState<'sql' | 'render' | null>(null);

  const handleCopy = async (text: string, block: 'sql' | 'render') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBlock(block);
      setTimeout(() => setCopiedBlock((prev) => (prev === block ? null : prev)), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Arquitectura lista para Supabase, GitHub y Render
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
          El proyecto incluye el esquema SQL completo en <span className="font-mono-tabular text-slate-800">supabase/schema.sql</span> y el archivo de despliegue <span className="font-mono-tabular text-slate-800">render.yaml</span> para publicar el servicio web en Render conectando las credenciales de Supabase de forma segura en el servidor.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-slate-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">01. Tabla en Supabase</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Ejecutá <span className="font-mono-tabular">supabase/schema.sql</span> en el SQL Editor para crear <span className="font-mono-tabular">puntos_asistencia</span> con validación de latitud y longitud y los 3 puntos iniciales.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">02. Repositorio GitHub</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Subí el código fuente a GitHub. El archivo <span className="font-mono-tabular">.gitignore</span> evita exponer archivos <span className="font-mono-tabular">.env</span> o datos locales.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">03. Web Service en Render</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Conectá el repositorio en Render y configurá <span className="font-mono-tabular">SUPABASE_URL</span> y <span className="font-mono-tabular">SUPABASE_KEY</span> en Environment Variables.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-semibold text-slate-800">
            supabase/schema.sql
          </span>
          <button
            type="button"
            onClick={() => handleCopy(SUPABASE_SQL_SNIPPET, 'sql')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors"
          >
            {copiedBlock === 'sql' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar SQL
              </>
            )}
          </button>
        </div>
        <pre className="p-5 text-xs font-mono-tabular text-slate-800 overflow-x-auto leading-relaxed bg-white">
          {SUPABASE_SQL_SNIPPET}
        </pre>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-semibold text-slate-800">
            render.yaml
          </span>
          <button
            type="button"
            onClick={() => handleCopy(RENDER_YAML_SNIPPET, 'render')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors"
          >
            {copiedBlock === 'render' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar YAML
              </>
            )}
          </button>
        </div>
        <pre className="p-5 text-xs font-mono-tabular text-slate-800 overflow-x-auto leading-relaxed bg-white">
          {RENDER_YAML_SNIPPET}
        </pre>
      </div>
    </div>
  );
}
