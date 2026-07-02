# Salgo 🪩

Red social de fiesta para decidir **a dónde salir** y **montar la previa**.
La gente crea su perfil, añade amigos, marca a qué discoteca o terraza va, y
ve en directo quién va a cada sitio. Si no tienes previa, puedes escribirle a
quien va al mismo sitio para montarla juntos.

Prueba inicial en **Madrid**, **Córdoba** y **El Puerto de Santa María**.

## Qué incluye esta primera versión

- **Perfil** con nombre, ciudad y **código de amigo**.
- **Amigos**: añade a tu gente por código y mira a qué discoteca sale cada uno.
- **Catálogo completo de locales**: discotecas, bares y pubs de cada ciudad se
  descargan en vivo desde **OpenStreetMap** (con coordenadas reales) y se
  cachean. Hay una lista curada de respaldo por si OSM no responde.
- **Feed por ciudad** con buscador, filtro por tipo (discotecas / bares / pubs /
  terrazas) y un indicador de ambiente ("Arrancando", "Llenando", "Ambientazo").
- **Mapa de la noche** con **MapLibre GL** y estilo oscuro de Carto (gratis, sin
  API key): cada local es un punto y los que tienen gente se ven resaltados.
- **"Voy"**: marca a dónde vas y mira quién más va. Tus amigos salen destacados.
- **Previa**: tablón público por discoteca **+ chat 1-a-1** para cuadrar plan
  con quien va al mismo sitio.
- **Reinicio automático cada noche**: la asistencia se borra sola a las 6:00
  (tus amigos y tu código se mantienen).

## Arrancar en local

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite. Por defecto funciona en **modo local**: los datos
se guardan en tu navegador y se sincronizan entre pestañas. Para probar la
sensación de "varias personas", abre varias pestañas/ventanas y crea un perfil
distinto en cada una.

## Sincronización real entre móviles (Supabase)

El modo local no sincroniza entre dispositivos distintos. Para probarlo de
verdad con tu gente, conecta un backend gratuito (Supabase). Son ~5 minutos:

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta:

   ```sql
   create table if not exists kv (
     key text primary key,
     value jsonb,
     updated_at timestamptz default now()
   );

   alter table kv enable row level security;

   -- Prototipo abierto: cualquiera con la anon key puede leer y escribir.
   create policy "kv abierto" on kv
     for all using (true) with check (true);

   -- Necesario para la sincronización en vivo:
   alter publication supabase_realtime add table kv;
   ```

3. En **Project Settings → API**, copia la **Project URL** y la **anon key**.
4. Crea un archivo `.env` (copia de `.env.example`) con:

   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
   ```

5. Reinicia `npm run dev`. La app detecta las variables y pasa a sincronizar
   entre todos los móviles que abran el mismo enlace.

> ⚠️ La política de seguridad de arriba deja la tabla **abierta** a propósito,
> para un prototipo de prueba. Antes de un lanzamiento real habrá que añadir
> autenticación y reglas por usuario.

## Desplegar

`npm run build` genera la web estática en `dist/`, lista para Vercel, Netlify o
GitHub Pages. Acuérdate de configurar las variables `VITE_SUPABASE_*` en el
panel del proveedor si quieres sincronización real.

## Estructura

```
src/
  App.jsx              Orquestador: estado, acciones y navegación
  data.js              Ciudades y discotecas
  theme.js             Paleta y estilos compartidos
  lib/
    store.js           Elige backend (local o Supabase) automáticamente
    localStore.js      Almacenamiento local + sync entre pestañas
    supabaseStore.js   Sincronización real entre dispositivos
    util.js            Avatares, "día de fiesta", códigos, etc.
  components/          Onboarding, Feed, ClubDetail, Friends, Chat, Profile, ui
```
