import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import {
  fetchFichaPorCodIne,
  fetchPuntosMapa,
  frasesWrapped,
  indiceConPesos,
  nivelIndice,
  PESOS_POR_DEFECTO,
} from "@/lib/cyl";

const BASE = "https://mipuebloencyl.lovable.app";

export const Route = createFileRoute("/wrapped/$codIne")({
  head: ({ params }) => {
    const img = `${BASE}/api/og/wrapped/${params.codIne}`;
    const titulo = "Así de bien atendido está mi pueblo | MiPuebloEnCyL";
    const desc =
      "Resumen visual de los servicios públicos del municipio comparado con su provincia y con toda Castilla y León.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: desc },
        { property: "og:title", content: titulo },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "MiPuebloEnCyL" },
        { property: "og:locale", content: "es_ES" },
        { property: "og:url", content: `${BASE}/wrapped/${params.codIne}` },
        { property: "og:image", content: img },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: titulo },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
      links: [{ rel: "canonical", href: `${BASE}/wrapped/${params.codIne}` }],
    };
  },
  component: Wrapped,
});

function Wrapped() {
  const { codIne } = Route.useParams();
  const ficha = useQuery({
    queryKey: ["ficha-cod", codIne],
    queryFn: () => fetchFichaPorCodIne(Number(codIne)),
  });
  const puntos = useQuery({ queryKey: ["puntos-mapa"], queryFn: fetchPuntosMapa, staleTime: 1000 * 60 * 60 });

  if (ficha.isLoading) return <div className="m-6 h-80 animate-pulse rounded-3xl bg-secondary" />;
  if (ficha.error || !ficha.data)
    return <p className="p-6 text-sm text-muted-foreground">No se han podido cargar los datos del municipio.</p>;

  const m = ficha.data;
  const frases = frasesWrapped(m, puntos.data ?? [], PESOS_POR_DEFECTO);
  const indice = indiceConPesos(m, PESOS_POR_DEFECTO);
  const nivel = nivelIndice(indice);

  return (
    <main id="contenido-principal" className="mx-auto max-w-xl px-5 py-10">
      <div className="overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground shadow-[var(--shadow-ficha)]">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] opacity-80">
          <Sparkles className="size-4" aria-hidden /> Tu pueblo, en 4 datos
        </p>
        <h1 className="mt-1 font-display text-4xl leading-tight">{m.nombre}</h1>
        <p className="text-sm opacity-85">Provincia de {m.provincia}</p>
        <div className="mt-5 space-y-3">
          {frases.map((f) => (
            <div key={f.texto} className="rounded-2xl bg-primary-foreground/12 p-4">
              <p className="font-display text-2xl leading-none">{f.destacado}</p>
              <p className="mt-1.5 text-sm leading-relaxed opacity-95">{f.texto}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs opacity-80">
          Índice global {indice ?? "s/d"}/100 · cobertura {nivel.etiqueta.toLowerCase()}
        </p>
      </div>
      <Link to="/" className="mt-5 inline-block font-medium text-primary underline underline-offset-4">
        Ver la ficha completa en MiPuebloEnCyL
      </Link>
    </main>
  );
}
