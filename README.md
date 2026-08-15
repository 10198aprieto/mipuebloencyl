# MiPuebloEnCyL

**¿Cómo de bien atendido está mi pueblo?**

Comparador de servicios públicos por municipio de Castilla y León, construido a partir del [Portal de Datos Abiertos de la Junta de Castilla y León](https://datosabiertos.jcyl.es/). Presentado al **X Concurso de Datos Abiertos de Castilla y León**.

🔗 **Web en producción:** [mipuebloencyl.es](https://mipuebloencyl.es)

---

## ¿Qué hace?

MiPuebloEnCyL permite buscar cualquier municipio de Castilla y León y consultar, en un vistazo, su nivel de acceso a servicios públicos: centros educativos, centros sanitarios, farmacias, servicios sociales, cultura, distancia a la estación de autobuses más cercana y calidad del aire de la estación más próxima. Todos los indicadores se combinan en un **índice de servicios (0-100)** ajustable, con el que cada persona puede dar más peso a lo que más le importa, y comparar su municipio con la media de su provincia y de la comunidad.

El objetivo es visibilizar, con datos reales y abiertos, las diferencias de acceso a servicios entre zonas urbanas y rurales de Castilla y León — un problema especialmente relevante en el contexto de la despoblación.

### Funcionalidades principales

- 🔍 Buscador de municipios con autocompletado
- 🗺️ Mapa interactivo (coroplético) de Castilla y León coloreado por índice de servicios
- 🎚️ Índice de servicios con pesos ajustables por categoría
- 📊 Ranking de municipios mejor y peor atendidos, con cifras destacadas
- 📄 Ficha detallada por municipio, comparada con la media provincial y autonómica
- 🧩 Widget embebible (`/embed/{municipio}`) para que ayuntamientos lo incorporen en su propia web
- 🖼️ Imagen social (Open Graph) dinámica al compartir la ficha de un municipio
- 📝 Botón de sugerencias para reportar datos incorrectos o que falten
- ♿ Accesibilidad básica (WCAG AA, navegación por teclado, lectores de pantalla)
- 🍪 Consentimiento de cookies conforme a normativa española/UE

## Fuentes de datos

Todos los datos provienen del Portal de Datos Abiertos de la Junta de Castilla y León ([datosabiertos.jcyl.es](https://datosabiertos.jcyl.es/)), consultados vía su API pública (Opendatasoft):

| Categoría | Dataset |
|---|---|
| Municipios (maestro) | `registro-de-municipios-de-castilla-y-leon` |
| Límites municipales | `limites-municipales-de-castilla-y-leon-recintos` |
| Educación | `directorio-de-centros-docentes` |
| Salud | `centros-de-salud-municipios`, `registro-de-centros-sanitarios-de-castilla-y-leon` |
| Farmacias | `registro-de-establecimientos-farmaceuticos-de-castilla-y-leon` |
| Transporte | `estaciones-de-autobuses` |
| Calidad del aire | `estaciones-de-control-de-la-calidad-del-aire`, `calidad-del-aire-datos-historicos-diarios` |
| Servicios sociales | `centros-de-caracter-social`, `servicios-de-caracter-social` |
| Cultura | `bibliotecas-bibliobuses-y-puntos-de-servicio-movil-geolocalizados`, `museos` |

Los datos se sincronizan automáticamente una vez al mes mediante Edge Functions. Más detalle sobre la metodología y cómo se calcula el índice en [`/metodologia`](https://mipuebloencyl.es/metodologia).

## Stack técnico

- **Frontend:** [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/start) (SSR) + [TanStack Router](https://tanstack.com/router)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Mapa:** [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Backend / base de datos:** [Supabase](https://supabase.com/) (PostgreSQL + PostGIS, Edge Functions, RLS)
- **Build:** [Vite](https://vitejs.dev/) + [Nitro](https://nitro.build/)
- **Despliegue:** [Vercel](https://vercel.com/), dominio propio vía [Arsys](https://www.arsys.es/)
- **Gestor de paquetes:** [Bun](https://bun.sh/)

## Desarrollo local

### Requisitos

- [Bun](https://bun.sh/) instalado
- Una cuenta y proyecto de [Supabase](https://supabase.com/) (para las variables de entorno)

### Instalación

```bash
git clone https://github.com/10198aprieto/mipuebloencyl.git
cd mipuebloencyl
bun install
```

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```
SUPABASE_PROJECT_ID=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

Los valores se obtienen desde el dashboard de tu proyecto de Supabase (**Settings → API**).

### Scripts disponibles

```bash
bun run dev        # entorno de desarrollo con hot-reload
bun run build       # build de producción
bun run preview     # previsualizar el build de producción
bun run lint         # linting con ESLint
bun run format       # formateo con Prettier
```

## Estructura del proyecto

```
├── src/
│   ├── routes/           # rutas de TanStack Router (páginas)
│   ├── integrations/     # cliente de Supabase y otras integraciones
│   ├── server.ts          # entrada del servidor (SSR)
│   └── styles.css         # estilos globales
├── supabase/
│   └── migrations/        # esquema de la base de datos
└── vite.config.ts
```

## Licencia y aviso legal

Proyecto sin ánimo de lucro, desarrollado por **Mateo Fernández Prieto** (Arroyo de la Encomienda, Valladolid, España) para el X Concurso de Datos Abiertos de Castilla y León. Los datos originales son propiedad de la Junta de Castilla y León y se reutilizan conforme a las condiciones del [Portal de Datos Abiertos de la Junta de Castilla y León](https://datosabiertos.jcyl.es/).

Más información legal en [Aviso legal](https://mipuebloencyl.es/aviso-legal), [Política de privacidad](https://mipuebloencyl.es/politica-privacidad) y [Política de cookies](https://mipuebloencyl.es/politica-cookies).

---

© 2026 Mateo Fernández Prieto
