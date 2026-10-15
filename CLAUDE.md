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
  lib/supabase/          public.ts (clave publicable) y admin.ts (clave secreta)
  lib/prices/            lógica determinista de la pizarra (compartida por seed y cron)
supabase/
  migrations/            SQL versionado (solo aditivo)
  seed/                  contenido bilingüe en TS → se carga con `npm run db:seed`
scripts/                 seed, i18n-check, test-permissions, screenshots
```

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
npm run shots -- <url-base> [rutas…]   # capturas 1440 px y 375 px, ES y EN
```

## Cierre de cada fase
typecheck, lint, build, i18n:check (y db:test-permissions si se tocó la base),
capturas en escritorio y 375 px de las páginas tocadas en ES y EN. Esperar revisión
del usuario antes de pasar a la siguiente fase.
