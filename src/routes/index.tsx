import { lazy, Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { BuscadorMunicipio } from "@/components/BuscadorMunicipio";
import { FichaMunicipio } from "@/components/FichaMunicipio";
import { fetchPuntosMapa, fetchUltimaActualizacion, fmtFecha, nivelIndice, type PuntoMapa } from "@/lib/cyl";

const MapaCyL = lazy(() => import("@/components/MapaCyL"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "¿Cómo de bien atendido está mi pueblo? | Servicios en Castilla y León" },
      {
        name: "description",
        content:
          "Compara los servicios públicos (educación, salud, transporte y calidad del aire) de los 2.248 municipios de Castilla y León con la media de su provincia y de la comunidad.",
      },
      { property: "og:title", content: "¿Cómo de bien atendido está mi pueblo?" },
      {
        property: "og:description",
        content:
          "Comparador ciudadano de servicios públicos por municipio de Castilla y León, con datos abiertos de la Junta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LEYENDA = [65, 50, 38, 28, 0].map((v) => nivelIndice(v));

function Index() {
  const [seleccionado, setSeleccionado] = useState<PuntoMapa | null>(null);
  const puntos = useQuery({ queryKey: ["puntos-mapa"], queryFn: fetchPuntosMapa, staleTime: 1000 * 60 * 60 });
  const actualizado = useQuery({ queryKey: ["ultima-actualizacion"], queryFn: fetchUltimaActualizacion });
  const lista = puntos.data ?? [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Datos abiertos · Castilla y León
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl leading-tight sm:text-5xl">
            ¿Cómo de bien atendido está mi pueblo?
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Busca tu municipio y consulta, en un vistazo, sus centros educativos, su atención sanitaria, su
            distancia a la estación de autobuses y la calidad del aire más cercana. Todo comparado con la media
            de tu provincia y de la comunidad.
          </p>
          <div className="mt-6 max-w-xl">
            <BuscadorMunicipio
              municipios={lista}
              onSelect={setSeleccionado}
              seleccionado={seleccionado?.nombre ?? null}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {puntos.isLoading
                ? "Cargando municipios…"
                : `${lista.length.toLocaleString("es-ES")} municipios disponibles. También puedes tocar un punto del mapa.`}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <section aria-label="Mapa de Castilla y León" className="space-y-3">
          <div className="h-[420px] overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-ficha)] sm:h-[520px]">
            <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
                <MapaCyL puntos={lista} seleccionado={seleccionado} onSelect={setSeleccionado} />
              </Suspense>
            </ClientOnly>
          </div>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <li className="font-medium text-foreground">Índice de servicios:</li>
            {LEYENDA.map((n) => (
              <li key={n.etiqueta} className="flex items-center gap-1.5">
                <span className="size-3 rounded-full" style={{ backgroundColor: n.color }} aria-hidden />
                {n.etiqueta}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Ficha del municipio">
          {seleccionado ? (
            <FichaMunicipio municipioId={seleccionado.id} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
              <h2 className="text-2xl">Elige un municipio para ver su ficha</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Escribe su nombre en el buscador o selecciónalo en el mapa. Verás sus indicadores y cómo se sitúa
                frente al resto de Castilla y León.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-secondary/50 p-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg text-foreground">Cómo se calcula el índice</h2>
          <p className="mt-2">
            El índice resume en una escala de 0 a 100 cuatro indicadores: centros educativos (30 %), centros
            sanitarios (30 %), cercanía a una estación de autobuses (25 %) y calidad del aire medida en la
            estación más próxima (15 %). Educación y salud se normalizan de forma logarítmica respecto al máximo
            de la comunidad para que los municipios pequeños sigan siendo comparables entre sí. Como el registro
            de estaciones de autobuses solo cubre municipios de más de 5.000 habitantes, el transporte se mide
            como distancia en línea recta a la estación más cercana, no como presencia en el propio municipio.
          </p>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Fuente:</strong> Portal de Datos Abiertos de la Junta de Castilla
            y León (registro de municipios, directorio de centros docentes, centros de salud, registro de centros
            sanitarios, estaciones de autobuses y estaciones de calidad del aire).
          </p>
          <p className="mt-1">
            Última actualización de los datos: {fmtFecha(actualizado.data)}. Los datos se sincronizan
            automáticamente una vez al mes.
          </p>
          <a
            className="mt-3 inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4"
            href="https://datosabiertos.jcyl.es/"
            target="_blank"
            rel="noreferrer"
          >
            datosabiertos.jcyl.es <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </footer>
    </div>
  );
}
