# Frigorífico Cuchilla Grande — guía del proyecto

Sitio demo de portfolio (fourvexa.com) de un frigorífico uruguayo **ficticio**,
exportador de carne vacuna y ovina. Marca, personas, cifras y datos son inventados
pero verosímiles. Público: compradores B2B del exterior y productores ganaderos.

Planta ficticia: Sarandí del Yí (departamento de Durazno), sobre ruta 6.

## Stack

| Pieza | Versión fijada | Notas |
|---|---|---|
| Next.js (App Router, Turbopack) | 16.4.1 | `cacheComponents` + `partialPrefetching` activos |
| React | 19.3 | |
| TypeScript | 5.x | estricto |
| Tailwind CSS | 4.x | config en `src/app/globals.css` (`@theme`) |
| next-intl | 4.14.9 | locale vía `next/root-params` |
| Supabase (`@supabase/supabase-js`) | 2.117.3 | proyecto cloud gratuito, región São Paulo |
| zod | 4.6.7 | validación de formularios y env |
| Leaflet + react-leaflet | (fase 3) | tiles: se decide en fase 3 |
| Playwright | 1.64.1 | solo para capturas de QA |
| Node | 24 LTS | |

Deploy: Vercel Hobby (cuenta personal), repo público `maxiv03/frigorifico-cuchilla-grande`
en la cuenta personal de GitHub (Vercel Hobby no conecta repos de organizaciones).

## Estructura

```
src/
  app/[locale]/          páginas (rutas internas en inglés; las públicas se traducen vía pathnames)
  app/api/cron/daily/    único cron: keep-alive + rotación de precios + purga de formularios
  i18n/                  routing.ts (locales + pathnames), request.ts, navigation.ts
  messages/{es,en}.json  textos de interfaz
  data/company.ts        ÚNICA fuente de verdad de cifras y datos de la empresa
  config/navigation.ts   ítems de menú con flag `enabled` por sección
  components/ui/         Button, Section, Container, Card, Badge (+ cn)
  components/layout/     header, footer, menú móvil, selector de idioma
  components/brand/      Logo e Isotype
  components/home/       secciones de la home
  components/cuts/       catálogo: diagrama SVG (geometría + componente), tarjeta, filtros
  lib/supabase/          public.ts (clave publicable) y admin.ts (clave secreta)
  lib/prices/            lógica determinista de la pizarra (compartida por seed y cron)
  lib/catalog/           tipos y claves neutras, filtros de URL, slugs de especie, fotos por categoría
  lib/data/              lecturas cacheadas ('use cache'): pizarra y catálogo
  lib/contact.ts         teléfono/WhatsApp/mail desde env + links con "[Demo]"
  lib/format.ts          formatFigure / formatPrice / formatChange
supabase/
  migrations/            SQL versionado (solo aditivo)
  seed/                  contenido bilingüe en TS → se carga con `npm run db:seed`
scripts/                 seed, i18n-check, test-permissions, screenshots, check-links, qa-*, diagram-preview
public/brand/            isotipo color / mono / blanco (SVG)
```

## Sistema visual (fase 1)

Tokens en `src/app/globals.css` (`@theme` de Tailwind 4). Usar siempre los tokens, nunca
hex sueltos.

| Grupo | Tokens | Uso |
|---|---|---|
| Marca (bordó) | `brand-50…950`, principal `brand-700` #7a1f2b | CTA primario, acentos, links |
| Tierra/arena | `earth-50…800` | secundario; público productores (`earth-700`, `earth-100`) |
| Neutros | `surface` #fff, `surface-muted` #f7f5f1, `ink`, `ink-muted`, `ink-subtle`, `line`, `night` | fondos alternados, texto, footer |
| Estado | `up` / `down` | variaciones de la pizarra |
| Radios | `rounded-sm` 4px, `rounded-md` 8px, `rounded-lg` 14px | botones `md`, tarjetas `lg` |
| Sombras | `shadow-card`, `shadow-raised` | tarjetas / fotos destacadas |
| Espaciado | `py-section` (5rem), `py-section-lg` (7rem), `h-header` (4.5rem), `max-w-site` (76rem) | secciones y layout |

- Tipografía: **Source Serif 4** (títulos, `font-serif`) + **Source Sans 3** (texto,
  `font-sans`), con `next/font`. Misma superfamilia de Adobe: combinan sin choque.
- Contraste AA verificado para todos los pares usados (texto sobre `surface`,
  `surface-muted`, `earth-100`, `night`, blanco sobre `brand-600/700/800`). Al sumar un
  par nuevo, verificarlo.
- Secciones: alternar `<Section tone="white">` y `tone="muted"`. Encabezados con
  `<SectionHeader eyebrow title lead />`.
- Fotos: `next/image` con `sizes` reales; prioridad solo en el hero
  (`loading="eager"` + `fetchPriority="high"`, no `preload`, porque hay una imagen por
  breakpoint). Todas con `alt` traducido.
- Logo: `<Logo variant="color|mono|light" />`; isotipo suelto `<Isotype />`
  (currentColor). Favicon `src/app/icon.svg`, `apple-icon.png`, `manifest.ts`.

## Navegación
- `src/config/navigation.ts`: cada ítem con `enabled`. **Solo se activan secciones que
  existen**; al cerrar una fase se activa su ítem. CTAs usan `isEnabled(key)` para ir a
  la página real o, mientras no exista, a un ancla de la home / mailto / WhatsApp.
- `NAV_PREVIEW=1 npm run dev` muestra todos los ítems para revisar diseño (ignorado en
  producción).
- `npm run check:links -- <url>` recorre el sitio y falla ante cualquier link interno o
  ancla rota. Correrlo contra producción al cerrar cada fase.
- Menú móvil: el panel va en un portal a `<body>` (el header sticky usa
  `backdrop-filter`, que rompe `position: fixed` dentro de él).
- Selector de idioma: páginas con slug traducido declaran `<SetAlternates hrefs={…}/>`;
  los searchParams se conservan siempre. Usa `<a>` (carga completa), no `<Link>`: cambiar de
  idioma cambia el layout raíz y la navegación de cliente dejaba montadas las dos páginas.
  Antes de hidratar, en rutas con params de contenido el link al otro idioma apunta a la
  página padre estática (nunca a una URL con slugs del idioma equivocado).

## Catálogo de cortes (fase 2)
- Datos: `cut_zones` / `cuts` con ids globales `${species}_${clave}` (p. ej. `beef_loin`); en la
  URL y en el código se usa la clave sin prefijo (`?zone=loin`). Slugs por idioma derivados del
  nombre con `slugify()` en el seed. Especie en la URL del detalle: `speciesSlugs`
  (`vacuno/ovino` ↔ `beef/lamb`).
- Vacunos con nombres del manual INAC 2023 (sin códigos). `alias` = término de consumidor,
  opcional por idioma (i18n:check lo permite solo para `alias`).
- Fotos por categoría en `src/lib/catalog/images.ts`: `cutImage()` solo devuelve claves de la
  especie del corte. Alt traducido en `Products.images.<clave>`.
- Diagrama (`components/cuts/`): siluetas propias; cada zona es un polígono de una partición
  del plano recortado por la silueta (sin huecos ni superposiciones por construcción).
  Estados sin depender del color: hover (tono + contorno fino), foco (anillo punteado, solo
  teclado), seleccionada (rayado + contorno grueso + etiqueta en negrita). Revisar cambios
  de geometría con `npm run diagram:preview`.
- Filtros: estado propio del componente + `history.replaceState` (sin ida y vuelta al
  servidor). No depender de `useSearchParams` después de montar: llega desfasado con clics
  rápidos. La página lee `searchParams` dentro de `<Suspense>`; el fallback es el catálogo
  sin filtros (queda en el HTML estático).
- Detalle: `generateStaticParams` para todos los cortes y `export const instant = false`
  (lee params fuera de Suspense a propósito, para que el contenido quede en el HTML).
  Slug desconocido → `notFound()`; con Cache Components el 1.er pedido puede salir 200 con la
  404 + noindex (no existe `dynamicParams=false`). `check:links` lo cuenta como roto.

## Reglas

### Claves de Supabase (regla dura)
- **Clave publicable (rol `anon`)**: todas las lecturas de contenido y todos los
  inserts de formularios. Cliente en `src/lib/supabase/public.ts`.
- **Clave secreta (`service_role`)**: SOLO en `src/app/api/cron/daily/route.ts` y en
  `scripts/` (seed, prueba de permisos). Cliente en `src/lib/supabase/admin.ts`
  (`import 'server-only'`). Usarla en otro lado anula RLS y grants y deja sin valor
  la prueba de permisos.
- Ninguna variable de Supabase lleva prefijo `NEXT_PUBLIC_`: el navegador nunca habla
  con Supabase; todo pasa por Server Components y Server Actions.
- Inserts de formularios **sin `.select()`** (devolver la fila requiere SELECT, que
  anon no tiene).

### Base de datos
- Una sola base para desarrollo y producción. Orden: migración aditiva →
  `npm run db:seed` → push/deploy. Nunca migraciones destructivas sobre datos vivos.
- Antes de cada migración nueva revisar grants: `revoke all` por defecto a `anon` y
  `authenticated`; después `grant select` (contenido) o `grant insert` (formularios).
  RLS activado en todas las tablas. Los default privileges están revocados.
- Contenido bilingüe: tabla base + tabla `*_translations (…, locale, …)` con FK a
  `locales`. Sumar un idioma = fila en `locales` + filas de traducción, sin cambiar esquema.
- Formularios: columna `env` (`development`/`preview`/`production`), `ip_hash`
  (sha256 con `IP_HASH_SALT`), límite de envíos por trigger en la base. Se purgan
  a los 90 días (cron) — está declarado en la página de privacidad.
- Después de cambiar grants/RLS: `npm run db:test-permissions`.

### i18n
- Locales en `src/i18n/routing.ts` (`es` por defecto, `en`). Agregar un idioma no
  debe requerir refactor: nada de `if (locale === 'es')` en componentes.
- TODO el contenido se traduce (interfaz, cortes, noticias, datos del seed), no solo
  la UI. `npm run i18n:check` valida mensajes **y** seed: ningún campo vacío ni igual
  al español salvo los listados en `scripts/i18n-allowlist.ts`.
- ESLint prohíbe texto literal en JSX y en `alt`/`title`/`placeholder`/`aria-label`.
- Rutas públicas traducidas con `pathnames` de next-intl. Slugs de contenido
  traducidos por locale (`UNIQUE(locale, slug)`). Detalle de corte con especie:
  `/es/productos/vacuno/[corte]` ↔ `/en/products/beef/[cut]`.
- Filtros por searchParams con claves y valores neutros e idénticos en todos los
  idiomas: `?species=beef&market=cn&presentation=chilled&bone=boneless`. Contacto: `?tab=quote|producer`.
- Cortes en inglés: término de exportación como nombre principal (`name`) y término
  de consumidor como alias (`alias`), en campos separados; búsqueda y filtros usan ambos.
  Solo nombres verificados, sin códigos numéricos. Nomenclatura basada en INAC (CREDITS.md).
- Server Actions y Route Handlers no tienen `next/root-params`: pasar el locale
  explícito (`getTranslations({ locale, namespace })`).

### Next 16
- El middleware es `src/proxy.ts`.
- Con Cache Components: todo lo que lea searchParams, cookies, headers o datos sin
  caché va dentro de `<Suspense>`. Datos de contenido con `'use cache'` + `cacheLife`
  + `cacheTag`; el cron invalida con `revalidateTag`.
- `generateStaticParams` en `[locale]/layout.tsx` es obligatorio (root param).

### Caché de la pizarra de precios (verificado en producción el 2026-10-15)
- `getPriceBoard()` (`src/lib/data/prices.ts`): `'use cache'` + `cacheTag("prices")` +
  `cacheLife("days")`. La home es estática y la pizarra queda dentro del prerender.
- Datos en `'use cache'` **no van dentro de `<Suspense>`**: React "outlinea" los límites
  completos cuando el HTML previo supera `progressiveChunkSize` (12,8 KB) y el HTML
  inicial queda con el fallback (los valores llegan al final del documento y los inserta
  un script). Verificar con curl que el precio aparece antes de cualquier `<template id="B:`.
- El cron, cuando inserta una semana, llama `revalidateTag("prices", { expire: 0 })`:
  la siguiente visita renderiza la pizarra nueva (no sirve la vieja). `updateTag` no
  aplica: solo existe en Server Actions.
- `cacheLife("days")` es solo red de seguridad si el cron no corre (revalida a las 24 h).
  No bajarlo a `hours`: taparía fallas del cron y multiplica lecturas.
- Prueba reproducible: borrar la semana vigente de `price_quotes` → deploy (el build
  hornea la semana anterior, `X-Vercel-Cache: PRERENDER`) → `GET /api/cron/daily` con
  `Authorization: Bearer $CRON_SECRET` → la home muestra la semana nueva en la 1.ª
  visita (`REVALIDATED`) y luego `HIT`, sin redeploy.

### Vercel
- Hobby: crons como máximo 1 vez por día y solo en producción. Hay UN cron
  (`/api/cron/daily`, 09:00 UTC) protegido con `Authorization: Bearer $CRON_SECRET`.
- `vercel.json` fija `"framework": "nextjs"`.
- Variables de entorno: se cargan con `vercel env add`; valores con caracteres
  especiales en `.env*` van entre comillas simples.

### Contenido y marca
- Todo es ficticio: footer con "Sitio de demostración — empresa ficticia" (ES/EN).
  Habilitación MGAP `DEMO-000`, rotulada como ficticia.
- Teléfono/WhatsApp y mail del equipo desde env (`WHATSAPP_NUMBER`, `CONTACT_EMAIL`).
  Mensajes prellenados de WhatsApp empiezan con "[Demo]". Sin dominios registrables.
- Certificaciones con badges genéricos propios, nunca logos oficiales.
- Fotos reales gratuitas (Pexels/Unsplash) con crédito en CREDITS.md, desde la
  primera fase visual. Nada de placeholders grises. Sin imágenes de faena ni marcas
  de plantas reales. **Cada foto corresponde a su especie** (nunca un corte vacuno
  ilustrando uno ovino).
- Precios de hacienda rotulados como referenciales/ficticios.
- Toda cifra (destacada o en texto corrido) con `formatFigure()` de `src/lib/format.ts`
  (`useGrouping: "always"` → "1.150" / "1,150"), pasada al mensaje como string. Nunca
  `{n, number}` de ICU en los mensajes (en ES omite el separador con cuatro cifras).
- Anclas de la home con ids neutros, iguales en ES y EN (`#buyers`, `#producers`).

## Comandos

```
npm run dev                  # desarrollo
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint
npm run build
npm run i18n:check           # mensajes + seed
npm run db:push              # aplica migraciones (SUPABASE_DB_URL)
npm run db:seed              # upsert idempotente del contenido (clave secreta)
npm run db:test-permissions  # verifica que anon no lea/modifique formularios
npm run shots -- <url-base> es en es/productos [--menu]  # capturas 1440 y 375 px (rutas sin "/" inicial en Git Bash)
npm run check:links -- <url-base>  # links internos y anclas sin errores (cuenta soft-404)
npm run qa:layout -- <url-base>    # skip link, menú móvil, idioma, imágenes, overflow
npm run qa:catalog -- <url-base>   # diagrama por teclado, filtros en URL, idioma, vacío, detalle
npm run diagram:preview            # PNG de las siluetas en screenshots/diagram
```

## Cierre de cada fase
typecheck, lint, build, i18n:check (y db:test-permissions si se tocó la base),
check:links, qa:layout y qa:catalog contra producción,
capturas en escritorio y 375 px de las páginas tocadas en ES y EN. Esperar revisión
del usuario antes de pasar a la siguiente fase.
