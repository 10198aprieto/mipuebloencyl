import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { fetchRadiografia, indiceConPesos, nivelIndice, type Pesos, type PuntoMapa } from "@/lib/cyl";

function Lista({
  titulo,
  icono,
  items,
  onSelect,
}: {
  titulo: string;
  icono: React.ReactNode;
  items: Array<{ p: PuntoMapa; indice: number }>;
  onSelect: (m: PuntoMapa) => void;
}) {
  const max = items[0]?.indice ?? 100;
  return (
    <section>
      <h3 className="flex items-center gap-2 text-lg">
        {icono} {titulo}
      </h3>
      <ol className="mt-2 space-y-1">
        {items.map(({ p, indice }, i) => {
          const nivel = nivelIndice(indice);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="group w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">
                    <span className="text-muted-foreground">{i + 1}.</span>{" "}
                    <span className="font-medium">{p.nombre}</span>{" "}
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{p.provincia}</span>
                  </span>
                  <span className="font-medium tabular-nums" style={{ color: nivel.color }}>
                    {indice.toLocaleString("es-ES", { maximumFractionDigits: 1 })}
                  </span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.max(4, (indice / (max || 1)) * 100)}%`, backgroundColor: nivel.color }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Radiografia({
  puntos,
  pesos,
  onSelect,
}: {
  puntos: PuntoMapa[];
  pesos: Pesos;
  onSelect: (m: PuntoMapa) => void;
}) {
  const cifras = useQuery({ queryKey: ["radiografia"], queryFn: fetchRadiografia, staleTime: 1000 * 60 * 60 });

  const { mejores, peores, ratio } = useMemo(() => {
    const conIndice = puntos
      .map((p) => ({ p, indice: indiceConPesos(p, pesos) }))
      .filter((x): x is { p: PuntoMapa; indice: number } => x.indice !== null)
      .sort((a, b) => b.indice - a.indice);
    const mejores = conIndice.slice(0, 10);
    const peores = conIndice.slice(-10).reverse();
    const mejor = mejores[0]?.indice ?? 0;
    const peor = conIndice[conIndice.length - 1]?.indice ?? 0;
    return { mejores, peores, ratio: peor > 0 ? mejor / peor : null };
  }, [puntos, pesos]);

  const c = cifras.data;
  const pct = (n: number) => (c && c.total ? Math.round((n / c.total) * 100) : null);

  const titulares = [
    ratio
      ? {
          cifra: `${ratio.toLocaleString("es-ES", { maximumFractionDigits: 1 })}×`,
          texto: `El municipio mejor atendido (${mejores[0]?.p.nombre}) tiene un índice ${ratio.toLocaleString("es-ES", { maximumFractionDigits: 1 })} veces mayor que el peor atendido.`,
        }
      : null,
    c
      ? {
          cifra: `${pct(c.sinCentroSanitario)} %`,
          texto: `de los ${c.total.toLocaleString("es-ES")} municipios no tiene ningún centro de salud ni consultorio dentro del término municipal.`,
        }
      : null,
    c
      ? {
          cifra: `${pct(c.lejosDelBus)} %`,
          texto: "está a más de 20 km en línea recta de la estación de autobuses más cercana.",
        }
      : null,
  ].filter(Boolean) as Array<{ cifra: string; texto: string }>;

  return (
    <section
      aria-label="Radiografía de Castilla y León"
      className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-ficha)]"
    >
      <h2 className="flex items-center gap-2 text-2xl">
        <BarChart3 className="size-5 text-muted-foreground" aria-hidden /> Radiografía de Castilla y León
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Calculado en vivo con los pesos que tengas seleccionados. Pulsa cualquier municipio para abrir su ficha.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {titulares.map((t) => (
          <div key={t.texto} className="rounded-xl border border-border bg-secondary/50 p-4">
            <p className="font-display text-3xl leading-none text-foreground">{t.cifra}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.texto}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Lista
          titulo="10 municipios mejor atendidos"
          icono={<TrendingUp className="size-4 text-muted-foreground" aria-hidden />}
          items={mejores}
          onSelect={onSelect}
        />
        <Lista
          titulo="10 municipios peor atendidos"
          icono={<TrendingDown className="size-4 text-muted-foreground" aria-hidden />}
          items={peores}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}