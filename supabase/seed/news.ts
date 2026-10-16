import type { NewsSeed } from "./types";

/**
 * Noticias ficticias (2025–2026). Sin declaraciones de personas ni organismos reales: solo
 * hablan personas ficticias de la empresa. Las cifras coinciden con src/data/company.ts.
 * Fotos en public/images/news (crédito en CREDITS.md).
 */
export const news: NewsSeed[] = [
  {
    id: "solar_park",
    publishedAt: "2025-04-08",
    image: "parque-solar",
    title: {
      es: "Entra en operación el parque solar de la planta",
      en: "The plant's solar park goes into operation",
    },
    excerpt: {
      es: "Los paneles instalados en el predio de Sarandí del Yí cubren el 30 % del consumo eléctrico anual de la planta.",
      en: "The panels installed on the Sarandí del Yí site cover 30% of the plant's annual electricity use.",
    },
    body: {
      es: `El parque solar construido en el predio de la planta, sobre ruta 6, quedó conectado y en operación. Ocupa unas 3 hectáreas de las 58 del predio y tiene una potencia de 1,6 MWp.

Con la generación esperada para un año normal, el parque cubre el 30 % de la electricidad que consume la planta. El resto sigue llegando de la red nacional.

## Por qué solar en una planta de frío

La demanda eléctrica de un frigorífico se concentra en la refrigeración, que trabaja todo el día y tiene su pico en las horas de más calor, justo cuando más genera el parque.

"Era la inversión que tenía más sentido para nosotros: el frío es el mayor consumo de la planta", explicó Lucía Iturralde, directora general.

## Próximos pasos

- Medición mensual de la generación y publicación del avance en la página de sostenibilidad.
- Estudio de baterías para desplazar parte de la generación al turno de la noche.`,
      en: `The solar park built on the plant's site, along Route 6, is now connected and in operation. It covers about 3 of the site's 58 hectares and has a capacity of 1.6 MWp.

Based on expected output in a typical year, the park covers 30% of the plant's electricity use. The rest still comes from the national grid.

## Why solar for a cold-chain plant

A meat plant's electricity demand is driven by refrigeration, which runs around the clock and peaks during the hottest hours, exactly when the park generates the most.

"It was the investment that made the most sense for us: refrigeration is the plant's largest load," said Lucía Iturralde, Chief Executive Officer.

## Next steps

- Monthly monitoring of generation, with progress published on the sustainability page.
- A study of battery storage to shift part of the output to the night shift.`,
    },
  },
  {
    id: "producers_day",
    publishedAt: "2025-07-22",
    image: "jornada-productores",
    title: {
      es: "Jornada con productores: del campo a la liquidación",
      en: "Producer day: from the farm to the settlement",
    },
    excerpt: {
      es: "Más de 120 productores de la zona recorrieron los corrales y repasaron con el equipo de compras cómo se arma una liquidación.",
      en: "More than 120 local producers toured the yards and went through how a settlement is put together with the buying team.",
    },
    body: {
      es: `Más de 120 productores de Durazno, Florida, Tacuarembó y Flores participaron en la jornada anual en la planta.

La mañana empezó en los corrales de espera, con el recorrido del manejo de los animales desde la descarga del camión. Después, el equipo de compras repasó en detalle una liquidación: rendimiento en carcasa, tipificación, descuentos y plazos de pago.

## Machucones: un indicador compartido

Uno de los temas del día fue la incidencia de machucones en las carcasas, un indicador que depende de todo el recorrido del animal. Desde este año, cada liquidación incluye el dato del lote para que cada productor pueda compararlo con el promedio.

"Lo que pasa en el embarque y en el camión se ve en la carcasa; medirlo juntos es la forma de mejorar", dijo Andrés Píriz, comprador de hacienda.

La jornada cerró con un almuerzo en el predio y la agenda de turnos de ingreso para la primavera.`,
      en: `More than 120 producers from Durazno, Florida, Tacuarembó and Flores took part in the annual producer day at the plant.

The morning started in the lairage pens, following how animals are handled from the moment the truck is unloaded. The buying team then went through a settlement in detail: carcass yield, grading, deductions and payment terms.

## Bruising: a shared indicator

One of the topics of the day was bruising on carcasses, an indicator that depends on the animal's whole journey. Starting this year, every settlement includes the figure for the lot so each producer can compare it with the average.

"What happens at loading and on the truck shows up on the carcass; measuring it together is how we improve," said Andrés Píriz, livestock buyer.

The day ended with lunch on site and the delivery slot schedule for spring.`,
    },
  },
  {
    id: "food_fair",
    publishedAt: "2025-10-14",
    image: "feria-alimentos",
    title: {
      es: "Con stand propio en una feria internacional de alimentos",
      en: "With our own stand at an international food fair",
    },
    excerpt: {
      es: "El equipo comercial presentó los cortes enfriados y la línea ovina a importadores de Europa, Medio Oriente y Asia.",
      en: "The sales team presented chilled cuts and the lamb line to importers from Europe, the Middle East and Asia.",
    },
    body: {
      es: `El equipo comercial participó con stand propio en una feria internacional de alimentos en Europa, una de las citas habituales del comercio de carnes.

Durante cuatro días se mantuvieron reuniones con importadores, distribuidores y cadenas de servicio de comidas de Europa, Medio Oriente y Asia.

## Lo que más se consultó

- Cortes vacunos enfriados para el canal de restaurantes.
- Cortes ovinos Halal, en especial carré y pierna.
- Plazos de tránsito y vida útil de la carne enfriada en contenedor.

"Volvemos con pedidos de muestras y con mucho para mejorar en la información que damos en la cotización", resumió Martín Sosa, gerente comercial de exportación.

Las consultas recibidas en la feria se están respondiendo desde el formulario de cotización del sitio.`,
      en: `The sales team took part with its own stand in an international food fair in Europe, one of the regular events in the meat trade calendar.

Over four days the team met importers, distributors and food service chains from Europe, the Middle East and Asia.

## Most requested

- Chilled beef cuts for the restaurant channel.
- Halal lamb cuts, especially rack and leg.
- Transit times and shelf life of chilled meat in containers.

"We are coming back with sample requests and plenty of ideas for improving the information we give in our quotations," said Martín Sosa, Export Sales Manager.

Enquiries received at the fair are being answered through the quote form on the website.`,
    },
  },
  {
    id: "cold_storage",
    publishedAt: "2026-02-10",
    image: "ampliacion-frio",
    title: {
      es: "Comienza la obra de ampliación de frío",
      en: "Work begins on the cold storage expansion",
    },
    excerpt: {
      es: "Una nueva nave de cámaras de congelado sumará 800 toneladas de capacidad y reemplazará los equipos más antiguos.",
      en: "A new freezer building will add 800 tonnes of capacity and replace the oldest equipment.",
    },
    body: {
      es: `Comenzó la construcción de una nueva nave de cámaras de congelado junto a los túneles de congelado rápido. Cuando entre en operación, prevista para 2027, sumará 800 toneladas a las 4.200 de capacidad actual.

## Menos pérdidas de refrigerante

La obra incluye el reemplazo de las cámaras más antiguas de la planta. Es el paso que falta para cumplir la meta de pérdidas de refrigerante, hoy atrasada, como se informa en la página de sostenibilidad.

## Durante la obra

La operación de la planta sigue con normalidad. Los ingresos de camiones a la zona de expedición se reordenaron para separar el tránsito de obra del de producto terminado.`,
      en: `Construction has started on a new freezer building next to the blast freezing tunnels. Once in operation, expected in 2027, it will add 800 tonnes to the current capacity of 4,200 tonnes.

## Lower refrigerant losses

The project includes replacing the plant's oldest cold rooms. It is the missing step to meet the refrigerant loss target, currently behind schedule as reported on the sustainability page.

## During construction

The plant continues to operate normally. Truck access to the dispatch area has been rearranged to keep construction traffic apart from finished product.`,
    },
  },
  {
    id: "portioned_beef",
    publishedAt: "2026-05-19",
    image: "porcionados-vacunos",
    featured: true,
    title: {
      es: "Nueva línea de porcionados vacunos envasados al vacío",
      en: "New line of vacuum-packed portioned beef",
    },
    excerpt: {
      es: "Bife ancho, bife angosto y lomo en porciones de peso fijo, pensados para servicio de comidas y supermercados.",
      en: "Ribeye, striploin and tenderloin in fixed-weight portions, designed for food service and retail.",
    },
    body: {
      es: `La planta incorporó una línea de porcionado que corta bife ancho, bife angosto y lomo en porciones de peso fijo, envasadas al vacío una por una.

## Para quién es

- Servicio de comidas: porciones parejas que simplifican el costo por plato.
- Supermercados: envase individual listo para la góndola, con la etiqueta del cliente.

Las porciones se ofrecen enfriadas o congeladas, con las mismas temperaturas y la misma trazabilidad que el resto del catálogo.

Las especificaciones de peso y calibre se acuerdan con cada cliente en el pedido de cotización.`,
      en: `The plant has added a portioning line that cuts ribeye, striploin and tenderloin into fixed-weight portions, each individually vacuum-packed.

## Who it is for

- Food service: consistent portions that make cost per plate easier to manage.
- Retail: individual packs ready for the shelf, with the customer's label.

Portions are available chilled or frozen, with the same temperatures and the same traceability as the rest of the catalog.

Weight and size specifications are agreed with each customer in the quote request.`,
    },
  },
  {
    id: "middle_east_chilled",
    publishedAt: "2026-08-25",
    image: "puerto-contenedores",
    title: {
      es: "Primer embarque de cordero enfriado a Medio Oriente",
      en: "First shipment of chilled lamb to the Middle East",
    },
    excerpt: {
      es: "Hasta ahora la carne ovina para la región viajaba congelada; el primer contenedor enfriado Halal ya está en destino.",
      en: "Until now, lamb for the region travelled frozen; the first chilled Halal container has reached its destination.",
    },
    body: {
      es: `Salió del puerto de Montevideo el primer contenedor de cordero enfriado con destino a Medio Oriente. Hasta ahora, la carne ovina para esa región se exportaba solo congelada.

El contenedor llevó carré, pierna y paleta con certificación Halal, en cajas preparadas para el tránsito marítimo en cadena de frío.

## Qué cambia

- Los importadores de la región pueden ofrecer cordero enfriado, con más vida útil en el punto de venta que la carne descongelada.
- La planta programa la faena ovina según las ventanas de salida de los buques.

Medio Oriente representa el 4 % de las exportaciones de la empresa, sobre todo carne ovina.`,
      en: `The first container of chilled lamb bound for the Middle East has left the port of Montevideo. Until now, lamb for the region was exported frozen only.

The container carried rack, leg and shoulder with Halal certification, in cartons prepared for cold-chain sea transit.

## What changes

- Importers in the region can offer chilled lamb, with a longer shelf life at the point of sale than thawed meat.
- The plant schedules sheep processing around vessel departure windows.

The Middle East accounts for 4% of the company's exports, mostly lamb.`,
    },
  },
];
