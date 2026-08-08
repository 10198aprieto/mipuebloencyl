import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { CATEGORIAS, fetchEstadoSincronizacion, fmtFecha } from "@/lib/cyl";

export const Route = createFileRoute("/metodologia")({
  head: () => ({
    meta: [
      { title: "Metodología del índice de servicios | MiPuebloEnCyL" },
      {
        name: "description",
        content:
          "Datasets utilizados, normalización de cada indicador, pesos del índice de servicios, limitaciones conocidas y frecuencia de actualización de MiPuebloEnCyL.",
      },
      { property: "og:title", content: "Metodología del índice de servicios | MiPuebloEnCyL" },
      {
        property: "og:description",
        content: "Cómo se construye el índice de servicios de los 2.248 municipios de Castilla y León.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://mipuebloencyl.lovable.app/metodologia" },
      { property: "og:site_name", content: "MiPuebloEnCyL" },
      { property: "og:locale", content: "es_ES" },
      { property: "og:image", content: "https://mipuebloencyl.lovable.app/og-mipuebloencyl.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Metodología del índice de servicios | MiPuebloEnCyL" },
      {
        name: "twitter:description",
        content: "Cómo se construye el índice de servicios de los 2.248 municipios de Castilla y León.",
      },
      { name: "twitter:image", content: "https://mipuebloencyl.lovable.app/og-mipuebloencyl.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://mipuebloencyl.lovable.app/metodologia" }],
  }),
  component: Metodologia,
});

const DATASETS: Array<{ id: string; titulo: string; uso: string }> = [
  { id: "registro-de-municipios-de-castilla-y-leon", titulo: "Registro de municipios", uso: "Listado maestro de los 2.248 municipios, código INE, provincia, coordenadas y población." },
  { id: "municipio-limites-categorias-est", titulo: "Límites municipales (categorías estadísticas)", uso: "Geometrías de polígono de cada término municipal para el mapa coroplético." },
  { id: "directorio-de-centros-docentes", titulo: "Directorio de centros docentes", uso: "Centros educativos no universitarios en situación de alta." },
  { id: "centros-de-salud-municipios", titulo: "Centros de salud por municipio", uso: "Centros de salud y municipio de referencia." },
  { id: "registro-de-centros-sanitarios-de-castilla-y-leon", titulo: "Registro de centros sanitarios", uso: "Hospitales y consultorios locales." },
  { id: "registro-de-establecimientos-farmaceuticos-de-castilla-y-leon", titulo: "Establecimientos farmacéuticos", uso: "Oficinas de farmacia por municipio." },
  { id: "estaciones-de-autobuses", titulo: "Estaciones de autobuses", uso: "Ubicación de las estaciones para calcular la distancia más corta." },
  { id: "estaciones-de-control-de-la-calidad-del-aire", titulo: "Estaciones de calidad del aire", uso: "Ubicación de las estaciones de medición." },
  { id: "bibliotecas-bibliobuses-y-puntos-de-servicio-movil-geolocalizados", titulo: "Bibliotecas y bibliobuses", uso: "Equipamiento bibliotecario fijo y móvil." },
  { id: "museos", titulo: "Museos", uso: "Museos registrados por municipio." },
  { id: "centros-de-caracter-social", titulo: "Centros de carácter social", uso: "Centros de servicios sociales." },
  { id: "servicios-de-caracter-social", titulo: "Servicios de carácter social", uso: "Servicios sociales prestados en el municipio." },
  { id: "colegios-profesionales", titulo: "Colegios profesionales", uso: "Sedes de colegios profesionales." },
  { id: "estaciones-itv", titulo: "Estaciones de ITV", uso: "Centros de inspección técnica de vehículos." },
  { id: "puntos-de-recarga-para-vehiculos-electricos", titulo: "Puntos de recarga eléctrica", uso: "Infraestructura de recarga de vehículos." },
];

function Metodologia() {
  const estado = useQuery({ queryKey: ["estado-sync"], queryFn: fetchEstadoSincronizacion });

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/" className="text-sm text-primary underline underline-offset-4">
        ← Volver al comparador
      </Link>
      <h1 className="mt-4 text-4xl">Metodología</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        El índice de servicios resume en una escala de 0 a 100 el acceso de cada municipio de Castilla y León a
        seis grandes familias de servicios públicos, a partir exclusivamente de datos abiertos publicados por la
        Junta de Castilla y León.
      </p>

      <section className="mt-10 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-2xl text-foreground">1. Datasets utilizados</h2>
        <ul className="space-y-2">
          {DATASETS.map((d) => (
            <li key={d.id} className="border-t border-border pt-2">
              <a
                className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4"
                href={`https://analisis.datosabiertos.jcyl.es/explore/dataset/${d.id}/information/`}
                target="_blank"
                rel="noreferrer"
              >
                {d.titulo} <ExternalLink className="size-3.5" aria-hidden />
              </a>
              <p>{d.uso}</p>
            </li>
          ))}
        </ul>
        <p className="pt-2">
          A ellos se suman el paro registrado por provincia y el registro de establecimientos comerciales y
          servicios de proximidad, usados como contexto económico y comercial.
        </p>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-2xl text-foreground">2. Cómo se normaliza cada indicador</h2>
        <p>
          Los indicadores de <em>recuento</em> (centros docentes, sanitarios, farmacias, bibliotecas, museos,
          comercios, servicios sociales, ITV y puntos de recarga) se normalizan con una escala logarítmica
          respecto al máximo de la comunidad: <code>ln(1 + valor) / ln(1 + máximo)</code>. Así, pasar de 0 a 1
          centro pesa mucho más que pasar de 40 a 41, que es como se percibe realmente el acceso a un servicio en
          un pueblo pequeño.
        </p>
        <p>
          Los indicadores de <em>distancia</em> (estación de autobuses) se invierten y se acotan a 60 km:{" "}
          <code>1 − mín(1, distancia / 60)</code>, medida en línea recta con PostGIS desde el centroide del
          municipio.
        </p>
        <p>
          La <em>calidad del aire</em> toma el último valor disponible de la estación de medición más cercana y se
          invierte sobre una referencia de 50 µg/m³: <code>1 − mín(1, valor / 50)</code>.
        </p>
        <p>Cada subíndice resultante se expresa de 0 a 100.</p>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-2xl text-foreground">3. Cómo se combinan en el índice final</h2>
        <p>
          El índice global es la media ponderada de los seis subíndices. Estos son los pesos por defecto, que
          suman el 100 %; puedes cambiarlos en la portada y todo (mapa, ranking y fichas) se recalcula al instante
          en tu navegador:
        </p>
        <ul className="list-disc pl-5">
          {CATEGORIAS.map((c) => (
            <li key={c.clave}>
              <strong className="text-foreground">{c.etiqueta}:</strong> {c.pesoBase} %
            </li>
          ))}
        </ul>
        <p>
          El subíndice de salud combina centros de salud, hospitales y consultorios con las oficinas de farmacia.
          El de movilidad combina la cercanía a la estación de autobuses (60 %) con ITV y puntos de recarga
          eléctrica (40 %). La calidad del aire se muestra en la ficha como indicador de contexto.
        </p>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-2xl text-foreground">4. Limitaciones conocidas</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            El registro de estaciones de autobuses solo cubre municipios de más de 5.000 habitantes: por eso el
            transporte se mide como distancia a la estación más cercana, no como presencia en el municipio.
          </li>
          <li>
            La red de estaciones de calidad del aire es reducida: el valor asignado a un municipio pequeño puede
            proceder de una estación situada a decenas de kilómetros.
          </li>
          <li>
            Los recuentos se hacen por municipio de ubicación del equipamiento; no reflejan la accesibilidad real
            en tiempo de viaje ni el uso de servicios en municipios vecinos.
          </li>
          <li>
            Los datos dependen de la calidad y actualización de los registros de origen: pueden faltar altas o
            bajas recientes.
          </li>
          <li>
            El índice es una elaboración propia con fines divulgativos, no una valoración oficial de ningún
            municipio.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-2xl text-foreground">5. Frecuencia de actualización</h2>
        <p>
          Un proceso programado sincroniza automáticamente todas las fuentes una vez al mes y recalcula los
          subíndices. Cada ejecución queda registrada, con el número de registros procesados y el error si lo
          hubiera. Estado de la última sincronización de cada fuente:
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full border-collapse text-left text-sm">
            <caption className="sr-only">Estado de la última sincronización por fuente de datos</caption>
            <thead>
              <tr className="border-b border-border text-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">Fuente</th>
                <th scope="col" className="py-2 pr-3 font-medium">Registros</th>
                <th scope="col" className="py-2 pr-3 font-medium">Estado</th>
                <th scope="col" className="py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(estado.data ?? []).map((e) => (
                <tr key={e.fuente} className="border-b border-border">
                  <td className="py-2 pr-3 text-foreground">{e.fuente}</td>
                  <td className="py-2 pr-3 tabular-nums">{e.registros?.toLocaleString("es-ES") ?? "—"}</td>
                  <td className="py-2 pr-3">{e.ok ? "Correcta" : `Error: ${e.mensaje ?? "desconocido"}`}</td>
                  <td className="py-2">{fmtFecha(e.ejecutado_en)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}