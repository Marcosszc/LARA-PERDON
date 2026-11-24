-- Ejecutar en el SQL Editor de Supabase
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.puntos_asistencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  latitud double precision NOT NULL CHECK (latitud >= -90 AND latitud <= 90),
  longitud double precision NOT NULL CHECK (longitud >= -180 AND longitud <= 180),
  servicio text NOT NULL CHECK (servicio IN ('inflado', 'herramientas', 'ambos')),
  horario text NOT NULL,
  referencia_puesto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_puntos_asistencia_servicio
  ON public.puntos_asistencia (servicio);

-- Habilitar Row Level Security (el servidor Express usa SUPABASE_KEY desde el backend)
ALTER TABLE public.puntos_asistencia ENABLE ROW LEVEL SECURITY;

-- Si utilizás la Anon Key desde el servidor sin Service Role, habilitá esta política
-- o usá SUPABASE_SERVICE_ROLE_KEY en Render para acceso completo desde el backend.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'puntos_asistencia'
      AND policyname = 'Permitir operaciones CRUD desde servicio web'
  ) THEN
    CREATE POLICY "Permitir operaciones CRUD desde servicio web"
      ON public.puntos_asistencia
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Tres ejemplos iniciales en ubicaciones distintas
INSERT INTO public.puntos_asistencia (nombre, latitud, longitud, servicio, horario, referencia_puesto)
SELECT * FROM (
  VALUES
    (
      'Estación Ciclovía Palermo',
      -34.573600,
      -58.414800,
      'inflado',
      '24 horas',
      'Tótem azul junto al cruce de Av. del Libertador y Av. Sarmiento'
    ),
    (
      'Taller Urbano Centro',
      -34.603722,
      -58.381592,
      'herramientas',
      'Lun a Sáb 08:00 - 20:00',
      'Puesto municipal sobre dársena peatonal, esquina Diagonal Norte'
    ),
    (
      'Parador Costanera Sur',
      -34.618450,
      -58.356210,
      'ambos',
      'Mar a Dom 09:00 - 19:00',
      'Acceso sur frente a la Fuente de las Nereidas, módulo metálico verde'
    )
) AS v(nombre, latitud, longitud, servicio, horario, referencia_puesto)
WHERE NOT EXISTS (SELECT 1 FROM public.puntos_asistencia);
