import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, X, Link2, Check, MessageCircle, Share2 } from "lucide-react";
import {
  fetchPuntosMapa,
  frasesWrapped,
  indiceConPesos,
  nivelIndice,
  PESOS_POR_DEFECTO,
  type MunicipioFicha,
  type Pesos,
} from "@/lib/cyl";

const BASE = "https://mipuebloencyl.lovable.app";

export function TarjetaWrapped({
  municipio,
  pesos = PESOS_POR_DEFECTO,
}: {
  municipio: MunicipioFicha;
  pesos?: Pesos;
}) {
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const cerrar = useRef<HTMLButtonElement>(null);
  const puntos = useQuery({ queryKey: ["puntos-mapa"], queryFn: fetchPuntosMapa, staleTime: 1000 * 60 * 60 });

  useEffect(() => {
    if (abierto) cerrar.current?.focus();
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto]);

  const enlace = `${BASE}/wrapped/${municipio.cod_ine}`;
  const frases = frasesWrapped(municipio, puntos.data ?? [], pesos);
  const indice = indiceConPesos(municipio, pesos);
  const nivel = nivelIndice(indice);
  const texto = `Así de bien atendido está ${municipio.nombre} (${municipio.provincia}) según los datos abiertos de Castilla y León`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-ficha)] transition-opacity hover:opacity-90"
      >
        <Sparkles className="size-4" aria-hidden /> Descubre tu pueblo
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Resumen destacado de ${municipio.nombre}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card shadow-[var(--shadow-ficha)]">
            <div className="relative overflow-hidden rounded-t-3xl bg-primary p-7 text-primary-foreground">
              <button
                ref={cerrar}
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar el resumen"
                className="absolute right-4 top-4 rounded-full bg-primary-foreground/15 p-2"
              >
                <X className="size-4" aria-hidden />
              </button>
              <p className="text-xs uppercase tracking-[0.22em] opacity-80">Tu pueblo, en 4 datos</p>
              <p className="mt-1 font-display text-4xl leading-tight">{municipio.nombre}</p>
              <p className="text-sm opacity-85">Provincia de {municipio.provincia}</p>
              <div className="mt-5 space-y-3">
                {frases.length === 0 && <p className="text-sm opacity-85">Calculando comparativas…</p>}
                {frases.map((f) => (
                  <div key={f.texto} className="rounded-2xl bg-primary-foreground/12 p-4">
                    <p className="font-display text-2xl leading-none">{f.destacado}</p>
                    <p className="mt-1.5 text-sm leading-relaxed opacity-95">{f.texto}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs opacity-80">
                Índice global {indice ?? "s/d"}/100 · cobertura {nivel.etiqueta.toLowerCase()} · MiPuebloEnCyL
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-5">
              <button
                type="button"
                onClick={copiar}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
              >
                {copiado ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
                {copiado ? "Enlace copiado" : "Copiar enlace"}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${texto}: ${enlace}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
              >
                <MessageCircle className="size-4" aria-hidden /> WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(enlace)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
              >
                <Share2 className="size-4" aria-hidden /> X (Twitter)
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
