# Créditos

Sitio de demostración de una empresa ficticia. Las fotos muestran escenas genéricas de
ganadería y comercio exterior; no corresponden a ninguna planta ni establecimiento real.

## Fotografías

Todas bajo la [Unsplash License](https://unsplash.com/license) (uso comercial y no
comercial gratuito, sin obligación de atribución; la damos igual). Recortes y
compresión propios.

| Archivo | Dónde se usa | Autor | Fuente |
|---|---|---|---|
| `public/images/home/hero-angus-atardecer-h.jpg` / `-v.jpg` | Home · hero (recorte horizontal para escritorio, vertical para móvil) | Leopold Maitre ([@lm](https://unsplash.com/@lm)) | [unsplash.com/photos/ldYEiVPOCi8](https://unsplash.com/photos/ldYEiVPOCi8) |
| `public/images/home/compradores-buque.jpg` | Home · tarjeta "Compradores e importadores" | Venti Views ([@ventiviews](https://unsplash.com/@ventiviews)) | [unsplash.com/photos/1cqIcrWFQBI](https://unsplash.com/photos/1cqIcrWFQBI) |
| `public/images/home/productores-hereford.jpg` | Home · tarjeta "Productores ganaderos" | Dmitry Fomin ([@dafomin](https://unsplash.com/@dafomin)) | [unsplash.com/photos/YZUyYzgvnAY](https://unsplash.com/photos/YZUyYzgvnAY) |
| `public/images/home/campo-ondulado.jpg` | Home · bloque "Desde Sarandí del Yí al mundo" | Quaritsch Photography ([@quaritsch](https://unsplash.com/@quaritsch)) | [unsplash.com/photos/N8A0Dwp9_CI](https://unsplash.com/photos/N8A0Dwp9_CI) |

### Fotos de cortes (fase 2)

Una foto por categoría de corte, siempre de la especie del corte (`src/lib/catalog/images.ts`
solo permite claves `beef-*` en vacunos y `lamb-*` en ovinos). Carne cruda, sin faena ni marcas.
Recorte 4:3 a 1200×900.

| Archivo | Categoría / dónde se usa | Autor | Fuente | Licencia |
|---|---|---|---|---|
| `public/images/cuts/vacuno-bifes.jpg` | Vacuno · bifes (bife angosto, bife ancho, cuadril con tapa, corazón de cuadril, espinazo) | Sergey Kotenev ([@sergeykotenev](https://unsplash.com/@sergeykotenev)) | [unsplash.com/photos/x--wK7akQWw](https://unsplash.com/photos/x--wK7akQWw) | Unsplash License |
| `public/images/cuts/vacuno-asado-al-horno.jpg` | Vacuno · piezas enteras (lomo, pierna, tapa y colita de cuadril) | Wesual Click ([@wesual](https://unsplash.com/@wesual)) | [unsplash.com/photos/DxJvLtab4ak](https://unsplash.com/photos/DxJvLtab4ak) | Unsplash License |
| `public/images/cuts/vacuno-asado-tira.jpg` | Vacuno · con hueso (asado, aguja con hueso) | Lucas Vinicius Peixoto ([@pilgrimcomunicacao](https://unsplash.com/@pilgrimcomunicacao)) | [unsplash.com/photos/P7Um6_hkwbU](https://unsplash.com/photos/P7Um6_hkwbU) | Unsplash License |
| `public/images/cuts/vacuno-coccion-lenta.jpg` | Vacuno · cocción lenta (aguja, paleta, marucha, pecho, cogote, garrón, brazuelo) | David Foodphototasty ([@phototastyfood](https://unsplash.com/@phototastyfood)) | [unsplash.com/photos/U5lLwx17rWs](https://unsplash.com/photos/U5lLwx17rWs) | Unsplash License |
| `public/images/cuts/vacuno-vacio.jpg` | Vacuno · cortes planos (vacío, matambre, entrañas) | Jakob Trost ([@jwtrost](https://unsplash.com/@jwtrost)) | [unsplash.com/photos/vPIco9WVV2s](https://unsplash.com/photos/vPIco9WVV2s) | Unsplash License |
| `public/images/cuts/ovino-carre.jpg` | Ovino · costillar (carré francés) | zydeaosika ([Pexels](https://www.pexels.com/@zydeaosika-2261055/)) | [pexels.com/photo/4411696](https://www.pexels.com/photo/4411696/) | Pexels License |
| `public/images/cuts/ovino-chuletas-lomo.jpg` | Ovino · lomo (lomo, chuletas de lomo) | Ragil Tagiyev ([Pexels](https://www.pexels.com/@ragil-tagiyev-1303759/)) | [pexels.com/photo/6281506](https://www.pexels.com/photo/6281506/) | Pexels License |
| `public/images/cuts/ovino-cortes.jpg` | Ovino · resto (pierna, cuadril, paleta, garrón, cogote, pecho) | Ragil Tagiyev ([Pexels](https://www.pexels.com/@ragil-tagiyev-1303759/)) | [pexels.com/photo/6281509](https://www.pexels.com/photo/6281509/) | Pexels License |

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

(Fase 3: atribución de OpenStreetMap y del proveedor de tiles.)
