import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { CATEGORIAS, PESOS_POR_DEFECTO, sonPesosPorDefecto, type Pesos } from "@/lib/cyl";

type Props = {
  pesos: Pesos;
  onChange: (p: Pesos) => void;
};

export function SelectorPesos({ pesos, onChange }: Props) {
  const total = CATEGORIAS.reduce((s, c) => s + (pesos[c.clave] ?? 0), 0);
  const porDefecto = sonPesosPorDefecto(pesos);

  return (
    <section
      aria-label="Selector de pesos del índice"
      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-ficha)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden /> Ajusta el índice a tu vida
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Da más peso a lo que más te importa. El mapa y las fichas se recalculan al instante.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...PESOS_POR_DEFECTO })}
          disabled={porDefecto}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Pesos por defecto
        </button>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIAS.map((c) => {
          const valor = pesos[c.clave] ?? 0;
          const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
          return (
            <div key={c.clave}>
              <label htmlFor={`peso-${c.clave}`} className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{c.etiqueta}</span>
                <span className="text-xs text-muted-foreground">{pct} % del índice</span>
              </label>
              <input
                id={`peso-${c.clave}`}
                type="range"
                min={0}
                max={40}
                step={1}
                value={valor}
                onChange={(e) => onChange({ ...pesos, [c.clave]: Number(e.target.value) })}
                className="mt-1 w-full accent-[hsl(var(--primary))]"
              />
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <p className="mt-3 text-sm text-destructive">
          Sube al menos una categoría para poder calcular el índice.
        </p>
      )}
    </section>
  );
}
