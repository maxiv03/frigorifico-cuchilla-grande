# Créditos

Sitio de demostración de una empresa ficticia. Las fotos muestran escenas genéricas de
ganadería y comercio exterior; no corresponden a ninguna planta ni establecimiento real.

## Fotografías

Todas bajo la [Unsplash License](https://unsplash.com/license) (uso comercial y no
comercial gratuito, sin obligación de atribución; la damos igual). Recortes y
compresión propios.

| Archivo | Dónde se usa | Autor | Fuente |
|---|---|---|---|
| `public/images/home/hero-angus-campo-h.jpg` / `-v.jpg` | Home · hero (recorte horizontal para escritorio, vertical para móvil) | Priscilla Du Preez ([@priscilladupreez](https://unsplash.com/@priscilladupreez)) | [unsplash.com/photos/tGtWKDdicn4](https://unsplash.com/photos/tGtWKDdicn4) |
| `public/images/home/compradores-buque.jpg` | Home · tarjeta "Compradores e importadores" | Venti Views ([@ventiviews](https://unsplash.com/@ventiviews)) | [unsplash.com/photos/1cqIcrWFQBI](https://unsplash.com/photos/1cqIcrWFQBI) |
| `public/images/home/productores-hereford.jpg` | Home · tarjeta "Productores ganaderos" | Dmitry Fomin ([@dafomin](https://unsplash.com/@dafomin)) | [unsplash.com/photos/YZUyYzgvnAY](https://unsplash.com/photos/YZUyYzgvnAY) |
| `public/images/home/campo-angus-eucaliptos.jpg` | Home · bloque "Desde Sarandí del Yí al mundo" | Jason Leung ([@ninjason](https://unsplash.com/@ninjason)) | [unsplash.com/photos/VZYJ9uuZFp0](https://unsplash.com/photos/VZYJ9uuZFp0) |

### Fotos de cortes

Una foto por tipo de pieza, solo cuando muestra ESA pieza y es de la especie del corte
(`src/lib/catalog/images.ts` solo permite claves `beef-*` en vacunos y `lamb-*` en ovinos).
Los cortes sin foto adecuada se ilustran con el diagrama de su zona. Las tarjetas del catálogo
usan la mini-silueta; las fotos aparecen en el detalle y en los destacados de la home.
Carne cruda, sin faena ni marcas. Recorte 4:3 a 1200×900.

| Archivo | Corte | Autor | Fuente | Licencia |
|---|---|---|---|---|
| `public/images/cuts/vacuno-lomo.jpg` | Lomo | Cindie Hansen ([@cindie_photographer](https://unsplash.com/@cindie_photographer)) | [unsplash.com/photos/Qt0qVGExVps](https://unsplash.com/photos/Qt0qVGExVps) | Unsplash License |
| `public/images/cuts/vacuno-bife-angosto.jpg` | Bife angosto | Kyle Mackie ([@macrz](https://unsplash.com/@macrz)) | [unsplash.com/photos/QH8SHBARVVk](https://unsplash.com/photos/QH8SHBARVVk) | Unsplash License |
| `public/images/cuts/vacuno-tapa-de-cuadril.jpg` | Tapa de cuadril (picaña) | Marcos Paulo Prado ([@marcospradobr](https://unsplash.com/@marcospradobr)) | [unsplash.com/photos/2x_AZcI_iPQ](https://unsplash.com/photos/2x_AZcI_iPQ) | Unsplash License |
| `public/images/cuts/vacuno-bife-ancho.jpg` | Bife ancho sin tapa (ojo de bife) | Sergey Kotenev ([@sergeykotenev](https://unsplash.com/@sergeykotenev)) | [unsplash.com/photos/x--wK7akQWw](https://unsplash.com/photos/x--wK7akQWw) | Unsplash License |
| `public/images/cuts/vacuno-asado-tira.jpg` | Asado | Lucas Vinicius Peixoto ([@pilgrimcomunicacao](https://unsplash.com/@pilgrimcomunicacao)) | [unsplash.com/photos/P7Um6_hkwbU](https://unsplash.com/photos/P7Um6_hkwbU) | Unsplash License |
| `public/images/cuts/vacuno-vacio.jpg` | Vacío | Jakob Trost ([@jwtrost](https://unsplash.com/@jwtrost)) | [unsplash.com/photos/vPIco9WVV2s](https://unsplash.com/photos/vPIco9WVV2s) | Unsplash License |
| `public/images/cuts/vacuno-garron.jpg` | Garrón con hueso | Anastasia Malysh ([@anastasiamalysh11](https://unsplash.com/@anastasiamalysh11)) | [unsplash.com/photos/ovhsJaE-jKo](https://unsplash.com/photos/ovhsJaE-jKo) | Unsplash License |
| `public/images/cuts/ovino-carre.jpg` | Carré francés | zydeaosika ([Pexels](https://www.pexels.com/@zydeaosika-2261055/)) | [pexels.com/photo/4411696](https://www.pexels.com/photo/4411696/) | Pexels License |
| `public/images/cuts/ovino-pierna.jpg` | Pierna (recorte sin la botella con etiqueta del original) | alireza nikzad ([@a_nikzad](https://unsplash.com/@a_nikzad)) | [unsplash.com/photos/s5MCHa20XDY](https://unsplash.com/photos/s5MCHa20XDY) | Unsplash License |
| `public/images/cuts/ovino-chuletas-lomo.jpg` | Chuletas de lomo | Ragil Tagiyev ([Pexels](https://www.pexels.com/@ragil-tagiyev-1303759/)) | [pexels.com/photo/6281506](https://www.pexels.com/photo/6281506/) | Pexels License |

[Pexels License](https://www.pexels.com/license/): uso gratuito, sin atribución obligatoria.

## Tipografías

- [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) y
  [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3), de Adobe —
  SIL Open Font License 1.1. Servidas con `next/font` (autohospedadas en el build).

## Logo e íconos

Isotipo, favicon, íconos de interfaz y badges: diseño propio para este proyecto.

## Nomenclatura de cortes

- **Vacunos:** nombres en español e inglés tomados del *Manual Uruguayo de Cortes Bovinos /
  Handbook of Uruguayan Bovine Cuts*, Instituto Nacional de Carnes (INAC), setiembre de 2023,
  ISBN 978-9974-7732-8-8 (definiciones según la norma UNIT 1245-2023). Reproducción libre
  citando la fuente. https://www.inac.uy — PDF:
  https://uruguaymeats.uy/wp-content/uploads/2024/05/Manual-Cortes-de-Carne_ESPING-DIGITAL-3.pdf
  El sitio no muestra los códigos numéricos del manual. Los alias de consumidor en inglés
  ("Ribeye", "Picanha"…) son términos comerciales habituales, no del manual.
- **Ovinos:** INAC no publica un manual ovino equivalente en línea; se usan la nomenclatura
  comercial uruguaya y los términos de exportación habituales (Frenched rack, Backstrap,
  Flap…). Pendiente de revisión.
- Datos de presentación (temperaturas): rangos del mismo manual (enfriado −1 a 4 °C; congelado
  ≤ −18 °C). Vida útil y peso de caja: valores referenciales de la demo.

## Mapas

- Datos del mapa base: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
  (ODbL). Atribución visible en el control del mapa.
- Teselas: [CARTO Basemaps](https://carto.com/attributions) (estilo Positron) cuando está
  configurada `CARTO_BASEMAPS_KEY` (© CARTO en la atribución). Sin clave, teselas estándar de
  OpenStreetMap según su [política de uso](https://operations.osmfoundation.org/policies/tiles/).
- Biblioteca: [Leaflet](https://leafletjs.com) (BSD-2-Clause) y react-leaflet (Hippocratic License 2.1).
