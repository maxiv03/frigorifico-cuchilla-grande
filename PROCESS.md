# Proceso

Cómo se construyó el sitio de Frigorífico Cuchilla Grande con Claude Code, qué se decidió y por qué,
qué salió mal y qué aprendimos. Es el registro honesto del proyecto: incluye los errores, también los
del agente.

## Cómo trabajamos

El proyecto se hizo entre el 15 y el 16 de octubre de 2026, en una sola conversación larga con Claude
Code (con varias compactaciones de contexto y un corte por límite de uso en la fase 6), sobre una
máquina Windows con Git Bash y PowerShell.

1. **Brief con lecciones de un proyecto anterior.** El equipo de fourvexa ya había hecho otro sitio
   demo con Claude Code ("Tranquera de Paysandú"). El brief traía de entrada lo que había salido mal
   ahí: traducir también el contenido y no solo la interfaz, el keep-alive de Supabase, los límites
   de los crons de Vercel Hobby, los grants por defecto del rol anon, una sola base con migraciones
   aditivas, fotos reales desde la primera fase visual.
2. **Plan antes que código.** La primera respuesta fue un plan por fases, el modelo de datos, la ficha
   de la empresa con las cifras inventadas y los riesgos. El equipo lo aprobó con cambios (por
   ejemplo, mover la planta de Durazno sobre ruta 5 a Sarandí del Yí sobre ruta 6, para alejarla de
   una planta real; cortes en inglés con término de exportación y alias de consumidor en campos
   separados).
3. **CLAUDE.md primero.** El primer archivo del repo fue la guía del proyecto: stack, convenciones y
   reglas duras (por ejemplo, qué clave de Supabase se usa dónde). Se actualizó en cada fase y quedó
   como referencia final.
4. **Fases cerradas con checklist.** Cada fase terminó con typecheck, lint, build, i18n:check, prueba
   de permisos si se tocó la base, las pruebas de QA contra producción, capturas a 1440 y 375 px en
   ES y EN, y un informe. Las pruebas de QA se fueron sumando fase a fase.
5. **Revisión humana entre fases.** Nada avanzaba sin aprobación. El equipo miraba las capturas y el
   sitio, y la fase siguiente arrancaba con una lista de correcciones. Muchas de las mejoras más
   importantes salieron de esa revisión, no de las pruebas automáticas.
6. **Secretos fuera del chat.** El equipo creó el proyecto de Supabase y dejó las claves en
   `.env.local`; el agente nunca las pidió ni (después de un error en la fase 0, ver abajo) las
   imprimió.

| Fase | Contenido |
|---|---|
| 0 | Infraestructura e i18n: Next 16, Supabase (esquema, RLS, grants, seed, prueba de permisos), cron diario, Vercel |
| 1 | Sistema visual, logo, header, footer, menú móvil y home |
| 2 | Catálogo de cortes con diagrama interactivo, filtros en la URL y detalle |
| 3 | Calidad, empresa y mercados |
| 4 | Portal de productores: pizarra, gráfico, calculadora y formulario "Ofrecer ganado" |
| 5 | Contacto, sostenibilidad, noticias y trabajá con nosotros |
| 6 | SEO técnico, accesibilidad, performance, seguridad y QA cruzado ES/EN |
| 7 | Documentación, limpieza y cierre |

## Fase por fase

### Fase 0 — Infraestructura e i18n

Next 16 con Cache Components, next-intl con rutas traducidas, Supabase con tablas base y de
traducción, RLS, grants por columna, trigger de límite de envíos y una prueba de permisos de 50
verificaciones que exige "permiso denegado" (42501) donde corresponde. Un cron diario de Vercel hace
de keep-alive y rota la pizarra de precios.

Antes de la fase 1 el equipo pidió probar en producción que el cron invalida la caché: se borró la
semana vigente, se hizo un deploy (que horneó la semana anterior), se llamó al cron y la home mostró la
semana nueva sin redeploy (`REVALIDATED` y después `HIT`). Quedó documentado como prueba reproducible.

### Fase 1 — Diseño base y home

Tokens de color bordó y tierra con contraste AA verificado, Source Serif 4 + Source Sans 3, componentes
base, un isotipo propio (una "C" con dos tajos), header con barra de secundarias, menú móvil accesible,
footer con el aviso de empresa ficticia y la home.

La revisión humana encontró cosas que las pruebas no veían: la foto del bloque institucional eran vacas
lecheras overas en una pradera alpina (se pidió Hereford o Angus en campo ondulado), el hero mostraba
sierras en el horizonte, los rótulos de la banda de cifras eran chicos y el menú móvil no entraba sin
scroll en 375×667. También pidió verificar con `curl` que la pizarra estuviera en el HTML inicial:
no estaba (ver "Problemas reales").

### Fase 2 — Catálogo y diagrama de cortes

36 cortes con nombres del manual de INAC, siluetas SVG propias iteradas con renders, zonas como
partición del plano, estados que no dependen solo del color, chips de zonas en el celular, filtros en
la URL y detalle prerenderizado para todos los cortes en los dos idiomas.

En la revisión el equipo pidió cambiar las fotos de las tarjetas por mini-siluetas con la zona
resaltada, sacar un alias en inglés equivocado ("hanging tender" es otro corte), reubicar la etiqueta
del garrón, que el texto seleccionado no se viera borroso y un panel de filtros para el celular.
Después vinieron la tarjeta compacta horizontal para pantallas chicas y la corrección de la
mini-silueta del pecho, que se desbordaba entre las patas.

### Fase 3 — Calidad, empresa y mercados

Certificaciones con badges propios (nunca logos oficiales), trazabilidad, bienestar animal, línea de
tiempo, recorrido de la planta y un primer mapa de mercados con Leaflet y teselas de CARTO. Ese mapa se
reemplazó al empezar la fase 4 por uno propio en SVG (ver "Decisiones clave").

### Fase 4 — Portal de productores

Pizarra completa de 6 categorías, gráfico SVG propio de 12 semanas con tabla de datos, calculadora de
lote, los pasos para venderle al frigorífico, contacto con los compradores de hacienda y el formulario
"Ofrecer ganado", construido como base reutilizable para todos los formularios. El cierre incluyó un
envío real en producción, borrado después con la clave secreta y registrado en el informe.

### Fase 5 — Contacto y páginas secundarias

Contacto con pestañas accesibles enlazables (`?tab=quote|producer`), pedido de cotización con un
selector de cortes con búsqueda, precarga del corte desde el catálogo (`?cut=beef_tenderloin`, igual en
los dos idiomas), sostenibilidad con metas y avance, noticias con detalle y trabajá con nosotros. Todos
los "Pedir cotización" dejaron de ser mailto y `check:links` falla si vuelve a aparecer uno.

### Fase 6 — SEO, accesibilidad, performance y QA

Indexación controlada por `SITE_INDEXABLE` (apagada por defecto), metadata completa, imágenes Open
Graph de marca, sitemap, JSON-LD, headers de seguridad y CSP. axe en 100 combinaciones de página,
estado, idioma y ancho; recorrido por teclado; Lighthouse móvil; revisión de español (voseo) e inglés
(británico). La fase se cortó a la mitad por el límite de uso y se retomó después sin perder trabajo,
gracias al informe parcial y a que todo quedaba commiteado por partes.

### Fase 7 — Documentación y cierre

Imágenes OG de noticias en JPEG (bajaron de hasta 1,1 MB a menos de 100 KB), trabajo sobre el LCP,
limpieza (flags de navegación, exports sin uso), esta documentación, la licencia y el release.

## Decisiones clave y por qué

**Mapa propio en SVG en lugar de teselas.** El primer mapa usaba Leaflet con teselas de CARTO. En la
práctica, CARTO pasó a exigir una clave (las teselas salían con una marca de agua), Leaflet sumaba
JavaScript y CSS al cliente para mostrar unos pocos países, los círculos del Reino Unido y la UE se
superponían, y dependíamos de un servicio externo. El equipo decidió un mapa propio con datos de
dominio público (Natural Earth) proyectado en el servidor: cero dependencias externas, cero JS de mapa
en el cliente, un elemento enfocable por mercado y países pintados por participación, que se leen mejor
que círculos.

**Noindex por defecto.** Es una empresa inventada con precios de hacienda, compradores con nombre y un
formulario para ofrecer ganado. Si apareciera en buscadores podría confundir a productores reales. Por
eso el sitio no se indexa (meta robots, robots.txt y `X-Robots-Tag`), pero todo el SEO está
implementado y verificado en modo indexable para demostrarlo.

**Mini-siluetas en lugar de fotos repetidas.** Con 36 cortes y pocas fotos de piezas verificables, las
tarjetas repetían la misma foto o mostraban una pieza que no era (la picaña no es un asado atado). La
mini-silueta con la zona resaltada informa más, no repite y es propia. Las fotos quedaron solo donde
muestran esa pieza y esa especie (detalle y destacados).

**Una sola base con migraciones aditivas.** Desarrollo y producción comparten la base gratuita de
Supabase. La regla fue: migración aditiva, después seed idempotente, después deploy, y nunca una
migración destructiva sobre datos vivos. Las columnas obligatorias nuevas se exigen con checks
`NOT VALID`. Funcionó sin un solo incidente de datos en siete fases.

**Precios como función pura.** La primera fórmula encadenaba cada semana sobre la anterior y no
garantizaba el orden entre categorías. La segunda calcula el precio solo a partir de la categoría y la
fecha (un índice de mercado común por especie más ruido chico y una restricción de orden): el seed y
el cron siempre coinciden, regenerar es idempotente y una prueba compara la pizarra publicada con la
fórmula.

**Páginas estáticas con datos cacheados.** El contenido cambia solo con un seed y la pizarra una vez por
semana: todo se prerenderiza y el cron invalida la etiqueta de la pizarra. Los formularios son la única
parte dinámica, vía Server Actions.

**Pruebas de punta a punta en vez de tests unitarios.** El riesgo real estaba en la integración
(permisos de la base, caché en producción, accesibilidad, rutas traducidas), así que cada fase sumó
scripts de Playwright que corren contra producción.

## Problemas reales y cómo se resolvieron

| Problema | Causa | Solución |
|---|---|---|
| El menú móvil se veía transparente y mal ubicado | El header sticky usa `backdrop-filter`, que crea un contenedor para los `position: fixed` descendientes | El panel del menú se renderiza en un portal a `<body>` |
| La pizarra no estaba en el HTML inicial, solo "Cargando pizarra…" | Con Cache Components, React "outlinea" los límites de `<Suspense>` cuando el HTML previo supera 12,8 KB y los valores llegaban al final del documento | Los datos cacheados no van dentro de `<Suspense>`; se verifica con `curl` que el precio aparezca antes del primer `<template id="B:` |
| Al cambiar de idioma quedaban montadas las dos páginas, ES y EN (llegó a producción en la fase 1) | El idioma es un root param con su propio `<html lang>` y la navegación de cliente entre layouts raíz no desmontaba el anterior | El selector de idioma usa `<a>` (carga completa) |
| Clics rápidos en los filtros revertían la selección | `useSearchParams` llegaba desfasado | Estado propio del componente más `history.replaceState` |
| Semanas con la vaquillona por encima del novillo (la vio el equipo en el gráfico) | La rotación era independiente por categoría | Fórmula nueva con mercado común por especie y orden garantizado; regeneración del historial; prueba del orden en 12 semanas |
| El aviso de errores del formulario quedaba tapado por el header en el celular (lo vio el equipo en una captura) | El foco iba al campo y el desplazamiento no consideraba el header sticky | `scroll-margin` del alto del header y una función que lleva el aviso a la vista y enfoca el campo sin volver a desplazar; prueba geométrica a 375 px |
| En la pestaña de productores de contacto, las etiquetas apuntaban a los campos ocultos de la otra pestaña (lo encontró axe en la fase 6) | Los dos formularios repetían ids (`phone`, `message`, `privacy`, honeypot) | Prefijo de ids por formulario (`FieldIdScope`) |
| Imágenes OG de noticias de hasta 1,1 MB (WhatsApp no muestra la vista previa) | `ImageResponse` solo genera PNG y la foto quedaba sin compresión | Recodificación en JPEG; `check:seo` falla por encima de 300 KB |
| La CSP estricta en report-only bajó "Buenas prácticas" a 92 | Chrome registra un error de consola por cada script inline que la viola | La CSP aplicada se mantiene y la estricta quedó detrás de una variable, apagada en producción |
| Todas las páginas descargaban la foto del hero de la home | El `preload()` de React viaja en el payload RSC, y las páginas precargan la home por el logo | Se revirtió el preload del hero; se verificó que los de los detalles no se filtran |
| Cada página llevaba en el HTML los mensajes de todo el sitio, más 70 KB de mensajes por `global-error` | El proveedor de next-intl sin `messages` explícito y un import de los dos JSON | Solo los namespaces de cliente; textos de `global-error` en un módulo chico |
| Fechas en inglés con formato estadounidense ("October 12, 2026") | Intl con el locale `en` | `formatDate` con `en-GB` en todo el sitio y verificación en `check:seo` |
| No se podía verificar que el cron corriera todos los días | Vercel Hobby retiene los logs menos de una hora y Supabase gratis 24 horas | Tabla `cron_runs` y `npm run ops:status` |
| La imagen OG del listado de noticias redirigía | El proxy de idiomas tomaba `opengraph-image` como slug de una noticia | Las rutas de imagen quedan fuera del matcher del proxy |
| `zod` no mostraba el error de peso según la especie si otro campo fallaba | zod no corre los refinamientos del objeto cuando un campo ya falló | Las validaciones que dependen de otro campo van fuera del schema |
| Fotos que no correspondían | Una foto de "carré" de Pexels resultó ser costillas vacunas; otra podía ser cerdo; el hero tenía sierras | Regla dura: cada foto corresponde a su especie y a su pieza; sin foto adecuada, la ilustración |

## Lo que no salió bien a la primera

- **Se imprimió una contraseña.** En la fase 0, un script de validación de la conexión a la base mostró
  el valor de `SUPABASE_DB_URL` en la salida. El agente avisó, el equipo reseteó la contraseña y desde
  entonces las variables se validan solo con verdadero/falso.
- **Errores que llegaron a producción y vio el equipo, no las pruebas**: el doble montaje al cambiar de
  idioma (fase 1), la pizarra que no estaba en el HTML (fase 1), el orden de precios (fase 4) y el aviso
  tapado por el header (fase 4). Cada uno terminó convertido en una prueba automática.
- **Los ids repetidos vivieron una fase entera.** Se introdujeron en la fase 5 y los encontró axe recién
  en la fase 6. La lección: correr axe en todos los estados desde que existe el primer formulario.
- **Una optimización que empeoró las cosas.** El preload del hero mejoraba la home y hacía que todas las
  demás páginas descargaran una foto que no usaban. Se descubrió midiendo las descargas de otras
  páginas, no la de la home.
- **Capturas engañosas.** Las primeras capturas de página completa salían con fotos a medio cargar
  (placeholders borrosos). Se agregó un paso que recorre la página y espera cada imagen.
- **Fricción del entorno Windows**: archivos escritos con CRLF en un repo LF, heredocs de Python que se
  rompían con texto acentuado, Git Bash convirtiendo `/es` en rutas de Windows y una carpeta creada por
  error en `C:\c` por pasarle una ruta de Git Bash a Node. Varias quedaron anotadas como reglas.
- **Supuestos equivocados**: el agente asumió que el sitio vivía en el dominio de fourvexa (daba 404) y
  usó un id de corte inexistente (`lamb_rack`) en una prueba. También dejó una pestaña del navegador
  abierta, que el equipo notó.
- **Límites de las plataformas descubiertos sobre la marcha**: la búsqueda de Unsplash pasó a exigir
  autorización (se buscó desde el navegador), los previews de Vercel tienen login y `noindex` propio,
  y Chromium headless no anima el desplazamiento suave (una prueba lo daba por roto cuando no lo
  estaba).

## Lecciones para el próximo proyecto

1. **Verificar en producción, no solo en local.** La caché, el 404 del primer pedido y las imágenes OG
   se comportaron distinto en Vercel que en `next start`.
2. **Mirar el HTML, no solo la pantalla.** `curl` mostró que la pizarra no estaba en el HTML aunque la
   página se viera bien.
3. **Cada corrección humana se convierte en prueba.** Así no vuelve: orden de precios, aviso visible a
   375 px, ningún mailto de cotización, foto de la especie correcta.
4. **axe y teclado desde el primer formulario**, en todos los estados (errores, éxito, pestañas), no al
   final.
5. **Medir lo que una optimización le hace al resto del sitio.** Un preload, un proveedor de mensajes o
   un import en `global-error` afectan a todas las páginas.
6. **Datos derivados como funciones puras.** Lo que se puede recalcular (precios, slugs) no debería
   depender del estado previo de la base.
7. **No confiar en logs de planes gratuitos para auditar.** Si algo tiene que poder verificarse después,
   registrarlo en la base desde el día uno.
8. **Secretos: validar con booleanos, nunca imprimir.**
9. **Commits chicos y un informe por etapa.** Permitieron retomar sin pérdidas después de las
   compactaciones de contexto y del corte por límite de uso.
10. **La revisión humana entre fases vale más que cualquier checklist** para lo que es de criterio: si
    una foto muestra la raza correcta, si el menú entra en la pantalla o si un precio es verosímil.
