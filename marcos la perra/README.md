# Red de Puntos de Asistencia (Inflado y Herramientas)

Servicio web full-stack en **Node.js + Express + React + Vite** conectado a **Supabase**, con mapa interactivo en **OpenStreetMap (Leaflet)** y apertura directa de coordenadas en **Google Maps**.

## Características

- **Base de datos en Supabase (`puntos_asistencia`)**: ID único (`uuid`), nombre del punto, latitud y longitud en grados decimales (validados entre `-90` y `90` / `-180` y `180`), servicio (`inflado`, `herramientas` o `ambos`), horario y referencia del puesto.
- **CRUD completo desde la web**: Agregar, listar, editar y eliminar puntos con validación en cliente y servidor.
- **Tres ejemplos precargados** en ubicaciones distintas.
- **Filtrado por servicio**: `Todos`, `Inflado` y `Herramientas`, más buscador por nombre o referencia.
- **Mapa OpenStreetMap + Google Maps**: Al seleccionar un registro se centra el mapa en sus coordenadas, muestra su nombre y marcador, y ofrece un botón **Abrir en Google Maps** (además de selector de coordenadas haciendo clic sobre el mapa).

## Despliegue en Supabase + GitHub + Render

1. **Supabase**:
   - Creá un proyecto en [Supabase](https://supabase.com).
   - Abrí el **SQL Editor** y ejecutá el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   - Copiá la URL del proyecto (`SUPABASE_URL`) y la clave (`service_role` o `anon` en `SUPABASE_KEY`).

2. **GitHub**:
   - Subí este repositorio a tu cuenta de GitHub.

3. **Render**:
   - Creá un nuevo **Web Service** en [Render](https://render.com) conectado a tu repositorio (o importá `render.yaml`).
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Variables de entorno:
     - `NODE_ENV=production`
     - `SUPABASE_URL=https://tu-proyecto.supabase.co`
     - `SUPABASE_KEY=tu_clave_de_supabase`
