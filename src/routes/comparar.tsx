import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Link2, Trophy } from "lucide-react";
import { BuscadorMunicipio } from "@/components/BuscadorMunicipio";
import {
  CATEGORIAS,
  fetchPuntosMapa,
  fmtNum,
  indiceConPesos,
  nivelIndice,
  PESOS_POR_DEFECTO,
  type PuntoMapa,
} from "@/lib/cyl";

const BASE = "https://mipuebloencyl.lovable.app";

type Busqueda = { a?: number; b?: number };

export const Route = createFileRoute("/comparar")({
  validateSearch: (search: Record<string, unknown>): Busqueda => ({
    a: search["a"] ? Number(search["a"]) : undefined,
    b: search["b"] ? Number(search["b"]) : undefined,
  }),
  head: () => {
    const titulo = "Comparar dos municipios de Castilla y León | MiPuebloEnCyL";
    const desc =
      "Enfrenta dos municipios de Castilla y León y compara su educación, salud, movilidad, servicios sociales, cultura y comercio con datos abiertos oficiales.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: desc },
        { property: "og:title", content: titulo },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "MiPuebloEnCyL" },
        { property: "og:locale", content: "es_ES" },
        { property: "og:url", content: `${BASE}/comparar` },
        { property: "og:image", content: `${BASE}/og-mipuebloencyl.jpg` },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: titulo },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: `${BASE}/og-mipuebloencyl.jpg` },
      ],
      links: [{ rel: "canonical", href: `${BASE}/comparar` }],
    };
  },
  component: Comparar,
});

function Columna({ m, gana }: { m: PuntoMapa | null; gana: boolean }) {
  if (!m) return <p className="text-sm text-muted-foreground">Sin municipio seleccionado</p>;
  const indice = indiceConPesos(m, PESOS_POR_DEFECTO);
  const nivel = nivelIndice(indice);
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{m.provincia}</p>
      <p className="text-2xl">{m.nombre}</p>
      <p className="flex items-center gap-2 font-display text-4xl leading-none" style={{ color: nivel.color }}>
        {indice ?? "s/d"}
        <span className="text-base text-muted-foreground">/100</span>
        {gana && <Trophy className="size-5" aria-label="Mejor índice global" />}
      </p>
    </div>
  );
}

function Comparar() {
  const { a, b } = Route.useSearch();
  const navigate = Route.useNavigate();
  const puntos = useQuery({ queryKey: ["puntos-mapa"], queryFn: fetchPuntosMapa, staleTime: 1000 * 60 * 60 });
  const lista = puntos.data ?? [];
  const [copiado, setCopiado] = useState(false);

  // Los códigos INE viajan en la URL para poder compartir la comparación.
  const porCodIne = useMemo(() => new Map(lista.map((p) => [p.id, p])), [lista]);
  void porCodIne;
  const uno = useMemo(() => lista.find((p) => hash(p) === a) ?? null, [lista, a]);
  const dos = useMemo(() => lista.find((p) => hash(p) === b) ?? null, [lista, b]);

  function elegir(lado: "a" | "b", m: PuntoMapa) {
    navigate({ search: (prev: Busqueda) => ({ ...prev, [lado]: hash(m) }) });
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  const iUno = uno ? indiceConPesos(uno, PESOS_POR_DEFECTO) : null;
  const iDos = dos ? indiceConPesos(dos, PESOS_POR_DEFECTO) : null;

  return (
    <main id="contenido-principal" className="mx-auto max-w-5xl space-y-6 px-5 py-10">
      <header>
        <h1 className="text-4xl">Tu pueblo frente a otro</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Elige dos municipios de Castilla y León y compara, categoría a categoría, cómo de bien atendidos están
          según los datos abiertos de la Junta.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium">Primer municipio</p>
          <BuscadorMunicipio municipios={lista} onSelect={(m) => elegir("a", m)} seleccionado={uno?.nombre ?? null} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Segundo municipio</p>
          <BuscadorMunicipio municipios={lista} onSelect={(m) => elegir("b", m)} seleccionado={dos?.nombre ?? null} />
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-ficha)]">
        <div className="grid grid-cols-2 gap-6 border-b border-border pb-4">
          <Columna m={uno} gana={iUno !== null && iDos !== null && iUno > iDos} />
          <div className="text-right">
            <Columna m={dos} gana={iUno !== null && iDos !== null && iDos > iUno} />
          </div>
        </div>

        {uno && dos ? (
          <ul className="mt-5 space-y-4">
            {CATEGORIAS.map((c) => {
              const v1 = uno[c.clave] ?? 0;
              const v2 = dos[c.clave] ?? 0;
              const gana1 = v1 > v2;
              const gana2 = v2 > v1;
              return (
                <li key={c.clave}>
                  <p className="mb-1 text-center text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {c.etiqueta}
                  </p>
                  <div className="grid grid-cols-2 items-center gap-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-sm ${gana1 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                        {fmtNum(v1, "/100", 1)}
                      </span>
                      <span className="h-3 w-full max-w-[16rem] overflow-hidden rounded-full bg-secondary" aria-hidden>
                        <span
                          className="ml-auto block h-full rounded-full"
                          style={{
                            width: `${Math.min(100, v1)}%`,
                            backgroundColor: gana1 ? nivelIndice(v1).color : "var(--muted-foreground, #9a9186)",
                            marginLeft: "auto",
                          }}
                        />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-full max-w-[16rem] overflow-hidden rounded-full bg-secondary" aria-hidden>
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.min(100, v2)}%`,
                            backgroundColor: gana2 ? nivelIndice(v2).color : "var(--muted-foreground, #9a9186)",
                          }}
                        />
                      </span>
                      <span className={`text-sm ${gana2 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                        {fmtNum(v2, "/100", 1)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            Selecciona los dos municipios para ver la comparación categoría a categoría.
          </p>
        )}

        {uno && dos && (
          <button
            type="button"
            onClick={copiar}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
          >
            {copiado ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
            {copiado ? "Enlace copiado" : "Copiar enlace de esta comparación"}
          </button>
        )}
      </section>

      <Link to="/" className="inline-block font-medium text-primary underline underline-offset-4">
        Volver al buscador y al mapa
      </Link>
    </main>
  );
}

/** Identificamos cada municipio en la URL por su código INE cuando está disponible. */
function hash(m: PuntoMapa & { cod_ine?: number }) {
  return (m as { cod_ine?: number }).cod_ine ?? undefined;
}
