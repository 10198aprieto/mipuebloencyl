import { useQuery } from "@tanstack/react-query";
import {
  Bus,
  Library,
  Trophy,
  TrendingUp,
  TrendingDown,
  SplitSquareHorizontal,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { fetchDatosCuriosos, type DatoCurioso } from "@/lib/cyl";

const ICONOS: Record<string, React.ComponentType<{ className?: string }>> = {
  bus: Bus,
  library: Library,
  trophy: Trophy,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  split: SplitSquareHorizontal,
  sparkles: Sparkles,
};

export function DatosCuriosos({ onSelectCodIne }: { onSelectCodIne?: (codIne: number) => void }) {
  const curiosos = useQuery<DatoCurioso[]>({
    queryKey: ["datos-curiosos"],
    queryFn: fetchDatosCuriosos,
    staleTime: 1000 * 60 * 60,
  });
  const lista = curiosos.data ?? [];
  if (!lista.length) return null;

  return (
    <section aria-labelledby="titulo-curiosos" className="space-y-3">
      <div>
        <h2 id="titulo-curiosos" className="text-2xl">
          ¿Sabías que…?
        </h2>
        <p className="text-sm text-muted-foreground">
          Hallazgos calculados sobre los datos abiertos ya sincronizados de los 2.248 municipios.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((d) => {
          const Icono = ICONOS[d.icono] ?? Sparkles;
          const clicable = !!(d.cod_ine && onSelectCodIne);
          return (
            <li key={d.clave} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-ficha)]">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <Icono className="size-4" aria-hidden /> {d.titulo}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{d.texto}</p>
              {clicable && (
                <button
                  type="button"
                  onClick={() => onSelectCodIne!(d.cod_ine!)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
                >
                  Ver la ficha de {d.municipio_nombre} <ArrowRight className="size-3.5" aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
