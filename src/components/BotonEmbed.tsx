import { useState } from "react";
import { Code2, Copy, Check } from "lucide-react";

export function BotonEmbed({ codIne, nombre }: { codIne: number; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const base = typeof window !== "undefined" ? window.location.origin : "https://mipuebloencyl.lovable.app";
  const codigo = `<iframe src="${base}/embed/${codIne}" title="Servicios públicos de ${nombre} · MiPuebloEnCyL" width="100%" height="620" style="border:1px solid #e5e0d8;border-radius:16px" loading="lazy"></iframe>`;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Code2 className="size-4" aria-hidden /> Insertar en tu web
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Insertar la ficha de ${nombre} en tu web`}
          onClick={() => setAbierto(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-ficha)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl">Insertar la ficha de {nombre}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Copia este código y pégalo en la página de tu ayuntamiento o asociación. La ficha se actualizará sola
              cada mes con los datos de la Junta.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-secondary/60 p-3 text-xs leading-relaxed">
              <code>{codigo}</code>
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(codigo);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2500);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copiado ? "Copiado" : "Copiar código"}
              </button>
              <a
                href={`/embed/${codIne}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Ver vista previa
              </a>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="ml-auto inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cerrar
              </button>
            </div>
            <p aria-live="polite" className="sr-only">
              {copiado ? "Código copiado al portapapeles" : ""}
            </p>
          </div>
        </div>
      )}
    </>
  );
}