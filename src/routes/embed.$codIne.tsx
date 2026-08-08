import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Stethoscope, Bus, Wind, Library, Store } from "lucide-react";
import {
  CATEGORIAS,
  fetchFichaPorCodIne,
  fmtNum,
  indiceConPesos,
  nivelIndice,
  PESOS_POR_DEFECTO,
} from "@/lib/cyl";

export const Route = createFileRoute("/embed/$codIne")({
  head: ({ params }) => ({
    meta: [
      { title: `Servicios públicos del municipio ${params.codIne} | MiPuebloEnCyL` },
      {
        name: "description",
        content: "Ficha compacta de servicios públicos municipales para incrustar en otra web.",
      },
      { property: "og:title", content: `Servicios públicos del municipio ${params.codIne} | MiPuebloEnCyL` },
      {
        property: "og:description",
        content: "Ficha compacta de servicios públicos municipales para incrustar en otra web.",
      },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "MiPuebloEnCyL" },
      { property: "og:locale", content: "es_ES" },
      { property: "og:url", content: `https://mipuebloencyl.lovable.app/embed/${params.codIne}` },
      { property: "og:image", content: `https://mipuebloencyl.lovable.app/api/og/${params.codIne}` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: `https://mipuebloencyl.lovable.app/api/og/${params.codIne}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Embed,
});

function Dato({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icono} {etiqueta}
      </p>
      <p className="mt-1 font-display text-2xl leading-none">{valor}</p>
    </div>
  );
}

function Embed() {
  const { codIne } = Route.useParams();
  const ficha = useQuery({
    queryKey: ["ficha-embed", codIne],
    queryFn: () => fetchFichaPorCodIne(Number(codIne)),
  });

  if (ficha.isLoading) return <div className="h-64 animate-pulse bg-secondary" />;
  if (ficha.error || !ficha.data)
    return <p className="p-6 text-sm text-muted-foreground">No se han podido cargar los datos del municipio.</p>;

  const m = ficha.data;
  const indice = indiceConPesos(m, PESOS_POR_DEFECTO);
  const nivel = nivelIndice(indice);

  return (
    <main className="bg-background p-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Provincia de {m.provincia}</p>
          <h1 className="text-3xl">{m.nombre}</h1>
          <p className="text-xs text-muted-foreground">{fmtNum(m.poblacion)} habitantes</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Índice de servicios</p>
          <p className="font-display text-4xl leading-none" style={{ color: nivel.color }}>
            {indice ?? "s/d"}
            <span className="text-base text-muted-foreground">/100</span>
          </p>
          <p className="text-sm font-medium" style={{ color: nivel.color }}>
            Cobertura {nivel.etiqueta.toLowerCase()}
          </p>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Dato icono={<GraduationCap className="size-3.5" aria-hidden />} etiqueta="Centros docentes" valor={fmtNum(m.num_centros_educativos)} />
        <Dato icono={<Stethoscope className="size-3.5" aria-hidden />} etiqueta="Centros sanitarios" valor={fmtNum(m.num_centros_salud + m.num_hospitales_consultorios)} />
        <Dato icono={<Stethoscope className="size-3.5" aria-hidden />} etiqueta="Farmacias" valor={fmtNum(m.num_farmacias)} />
        <Dato icono={<Bus className="size-3.5" aria-hidden />} etiqueta="Estación de bus" valor={fmtNum(m.distancia_bus_km, " km", 1)} />
        <Dato icono={<Library className="size-3.5" aria-hidden />} etiqueta="Cultura" valor={fmtNum(m.num_bibliotecas_bibliobuses + m.num_museos)} />
        <Dato icono={<Store className="size-3.5" aria-hidden />} etiqueta="Comercios" valor={fmtNum(m.num_establecimientos_comerciales)} />
      </div>

      <ul className="mt-4 space-y-1.5">
        {CATEGORIAS.map((c) => {
          const v = m[c.clave] ?? 0;
          const n = nivelIndice(v);
          return (
            <li key={c.clave}>
              <span className="flex items-baseline justify-between text-xs">
                <span>{c.etiqueta}</span>
                <span className="font-medium" style={{ color: n.color }}>
                  {fmtNum(v, "/100", 1)}
                </span>
              </span>
              <span className="mt-0.5 block h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
                <span className="block h-full rounded-full" style={{ width: `${Math.min(100, v)}%`, backgroundColor: n.color }} />
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex items-center gap-1 border-t border-border pt-2 text-[0.7rem] text-muted-foreground">
        <Wind className="size-3" aria-hidden /> Datos:{" "}
        <a href="https://mipuebloencyl.lovable.app/" target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">
          MiPuebloEnCyL
        </a>{" "}
        ·{" "}
        <a href="https://datosabiertos.jcyl.es/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          datosabiertos.jcyl.es
        </a>
      </p>
    </main>
  );
}