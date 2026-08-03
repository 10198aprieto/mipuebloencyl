# Mi Pueblo en Castilla y León

Quiero crear un proyecto nuevo desde cero: un comparador de servicios públicos por municipio de Castilla y León ("¿Cómo de bien atendido está mi pueblo?"). Usa Supabase para persistencia. El usuario busca o selecciona un municipio y ve una ficha con indicadores de acceso a servicios públicos (educación, salud, transporte, calidad del aire), comparándolo con la media de su provincia y de la comunidad. Cubre los ~2.200 municipios de Castilla y León.

FUENTES DE DATOS

Todas provienen de la API pública de la Junta de Castilla y León (Opendatasoft, sin API key, solo lectura):

Endpoint base: https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/{dataset-id}/records

Datasets confirmados a usar:

1. registro-de-municipios-de-castilla-y-leon — listado maestro de municipios (actualización diaria). Todos los demás datasets se cruzan contra este por municipio.

2. directorio-de-centros-docentes — centros educativos no universitarios.

3. centros-de-salud-municipios — centros de salud y su municipio asociado.

4. registro-de-centros-sanitarios-de-castilla-y-leon — registro completo de centros de salud, consultorios y hospitales (más detallado que el anterior; combínalo o usa el que tenga mejor cobertura de municipio tras revisar el esquema).

5. estaciones-de-autobuses — estaciones de autobuses (nota: solo cubre municipios de más de 5.000 habitantes; para el resto, el indicador de "acceso a transporte" debe calcularse como distancia a la estación más cercana, no como presencia/ausencia en el propio municipio).

6. estaciones-de-control-de-la-calidad-del-aire — estaciones de medición de calidad del aire.

PASO PREVIO OBLIGATORIO — no lo saltes

Antes de construir nada, para cada uno de los 6 datasets llama a:

https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/{dataset-id}

y confirma los nombres reales de los campos, especialmente el que identifica el municipio en cada uno (puede llamarse "municipio", "nombre_municipio", "cod_municipio", etc., y no ser el mismo en todos). Documenta esa correspondencia antes de escribir las Edge Functions. Para los datasets 3 y 4 (salud), decide si usarlos combinados o si uno es suficiente, según qué tan completos estén sus campos de geolocalización/municipio.

ESTRUCTURA EN SUPABASE

1. Tabla "municipios": codigo_ine (o el identificador que use el dataset maestro), nombre, provincia, latitud, longitud, poblacion (si el dataset la trae), updated_at.

2. Tabla "servicios_educacion": municipio_id (FK), num_centros, updated_at.

3. Tabla "servicios_salud": municipio_id (FK), num_centros_salud, num_hospitales_consultorios, updated_at.

4. Tabla "transporte_municipio": municipio_id (FK), estacion_autobus_mas_cercana, distancia_km, updated_at. Usa la extensión PostGIS de Supabase para calcular la estación de autobús más próxima a cada municipio por coordenadas, dado que el dataset de estaciones no cubre todos los municipios directamente.

5. Tabla "calidad_aire_municipio": municipio_id (FK), estacion_mas_cercana, ultimo_valor, fecha_dato, updated_at. Mismo cálculo de proximidad con PostGIS.

6. Tabla "indice_servicios": municipio_id (FK), indice_calculado (numérico, normalizado 0-100), updated_at. Combina de forma ponderada simple los indicadores anteriores: normaliza cada uno entre 0 y 1 respecto al máximo de la comunidad y promedia (puedes dar más peso a educación y salud que a calidad del aire si tiene sentido).

EDGE FUNCTIONS

1. "sync-municipios": trae el listado completo de municipios paginando (límite máximo 100 por página en la API, itera con "offset" hasta cubrir los ~2.200) y hace upsert en "municipios".

2. Una función equivalente por cada fuente adicional (educación, salud x2, autobuses, calidad del aire), cada una agregando por municipio.

3. Programa todas para ejecutarse una vez al mes vía Supabase Scheduled Functions o pg_cron.

4. Una función final que recalcule "indice_servicios" cada vez que se actualicen los datos base.

FRONTEND

1. Buscador/selector de municipio con autocompletado sobre la tabla "municipios".

2. Mapa interactivo de Castilla y León (Leaflet + OpenStreetMap) coloreado por índice de servicios (escala tipo semáforo).

3. Ficha de municipio al seleccionarlo: nº de centros educativos, nº de centros de salud/hospitales, distancia a la estación de bus más cercana, calidad del aire de la estación más próxima (con fecha del dato), e índice global comparado con la media provincial y autonómica.

4. El frontend lee siempre desde las tablas de Supabase, nunca llama directamente a la API externa de la Junta.

5. Indica siempre la fuente y fecha de actualización de los datos, con enlace a datosabiertos.jcyl.es.

DISEÑO

Diseño limpio y accesible para cualquier ciudadano sin conocimientos técnicos. Prioriza que el mapa cargue rápido con ~2.200 municipios (usa clustering o simplificación de geometría si hace falta).

Empieza por: 1) confirmar los esquemas de los 6 datasets, 2) crear las tablas de Supabase, 3) las Edge Functions de sincronización, 4) el frontend con mapa y ficha de municipio.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mipuebloencyl.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/68d774e2-6fe6-4035-8eec-d8410fada867).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
