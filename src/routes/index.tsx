import { lazy, Suspense, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BuscadorMunicipio } from "@/components/BuscadorMunicipio";
const logoSitio = "/logo-mipuebloencyl.png";
import { FichaMunicipio } from "@/components/FichaMunicipio";
import { SelectorPesos } from "@/components/SelectorPesos";
import { Radiografia } from "@/components/Radiografia";
import {
  fetchGeoMunicipios,
  fetchPuntosMapa,
  indiceConPesos,
  nivelIndice,
  PESOS_POR_DEFECTO,
  type Pesos,
  type PuntoMapa,
} from "@/lib/cyl";

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
      { property: "og:title", content: "¿Cómo de bien atendido está mi pueblo? | Servicios en Castilla y León" },
      {
        property: "og:description",
        content:
          "Compara los servicios públicos (educación, salud, transporte y calidad del aire) de los 2.248 municipios de Castilla y León con la media de su provincia y de la comunidad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://mipuebloencyl.lovable.app/" },
      { property: "og:image", content: "https://mipuebloencyl.lovable.app/og-mipuebloencyl.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://mipuebloencyl.lovable.app/og-mipuebloencyl.jpg" },
    ],
  }),
  component: Index,
});

const LEYENDA = [65, 50, 38, 28, 0].map((v) => nivelIndice(v));

function Index() {
  const [seleccionado, setSeleccionado] = useState<PuntoMapa | null>(null);
  const [pesos, setPesos] = useState<Pesos>({ ...PESOS_POR_DEFECTO });
  const puntos = useQuery({ queryKey: ["puntos-mapa"], queryFn: fetchPuntosMapa, staleTime: 1000 * 60 * 60 });
  const geo = useQuery({ queryKey: ["geo-municipios"], queryFn: fetchGeoMunicipios, staleTime: 1000 * 60 * 60 * 24 });
  const lista = puntos.data ?? [];

  const indices = useMemo(
    () => new Map(lista.map((p) => [p.id, indiceConPesos(p, pesos)])),
    [lista, pesos],
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex items-center gap-4">
            <img
              src={logoSitio}
              alt="Logotipo de MiPuebloEnCyL"
              className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20"
              width={80}
              height={80}
            />
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Datos abiertos · Castilla y León
            </p>
          </div>
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
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
              {puntos.isLoading
                ? "Cargando municipios…"
                : `${lista.length.toLocaleString("es-ES")} municipios disponibles. También puedes tocar un punto del mapa.`}
            </p>
          </div>
        </div>
      </header>

      <main id="contenido-principal" className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <Radiografia puntos={lista} pesos={pesos} onSelect={setSeleccionado} />

        <SelectorPesos pesos={pesos} onChange={setPesos} />

        <section aria-label="Mapa de Castilla y León" className="space-y-3">
          <div className="h-[420px] overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-ficha)] sm:h-[520px]">
            <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-secondary" />}>
                <MapaCyL
                  geo={geo.data ?? null}
                  puntos={lista}
                  indices={indices}
                  seleccionado={seleccionado}
                  onSelect={setSeleccionado}
                />
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
            <FichaMunicipio municipioId={seleccionado.id} pesos={pesos} />
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
            El índice resume en una escala de 0 a 100 seis categorías de servicios públicos, con estos pesos por
            defecto: educación (22 %), salud —centros sanitarios y farmacias— (26 %), movilidad —cercanía a la
            estación de autobuses, ITV y puntos de recarga— (16 %), servicios sociales (14 %), cultura y ocio
            —bibliotecas, bibliobuses y museos— (12 %) y comercio de proximidad (10 %). Puedes cambiar esos pesos
            arriba y todo se recalcula al instante. Los recuentos se normalizan de forma logarítmica respecto al
            máximo de la comunidad para que los municipios pequeños sigan siendo comparables; el transporte se
            mide como distancia en línea recta a la estación más cercana, porque ese registro solo cubre
            municipios de más de 5.000 habitantes.
          </p>
          <Link to="/metodologia" className="mt-3 inline-block font-medium text-primary underline underline-offset-4">
            Ver la metodología completa y las fuentes
          </Link>
        </section>
      </main>
    </div>
  );
}
