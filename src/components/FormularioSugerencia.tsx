import { useState } from "react";
import { MessageSquareWarning, Check } from "lucide-react";
import { enviarSugerencia, type TipoSugerencia } from "@/lib/cyl";

const TIPOS: Array<{ valor: TipoSugerencia; etiqueta: string }> = [
  { valor: "dato_incorrecto", etiqueta: "Un dato es incorrecto" },
  { valor: "dato_que_falta", etiqueta: "Falta un dato" },
  { valor: "otro", etiqueta: "Otro" },
];

export function FormularioSugerencia({ municipioId }: { municipioId: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoSugerencia>("dato_incorrecto");
  const [mensaje, setMensaje] = useState("");
  const [contacto, setContacto] = useState("");
  const [estado, setEstado] = useState<"inicial" | "enviando" | "hecho" | "error">("inicial");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      await enviarSugerencia({ municipioId, tipo, mensaje, contacto });
      setEstado("hecho");
      setMensaje("");
      setContacto("");
    } catch {
      setEstado("error");
    }
  }

  return (
    <div className="mt-6 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <MessageSquareWarning className="size-4" aria-hidden /> ¿Ves algo que falta o está mal? Dínoslo
      </button>

      {abierto && (
        <form onSubmit={enviar} className="mt-4 grid max-w-xl gap-3">
          <div>
            <label htmlFor="sug-tipo" className="text-sm font-medium">
              Tipo de sugerencia
            </label>
            <select
              id="sug-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoSugerencia)}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sug-mensaje" className="text-sm font-medium">
              Cuéntanos qué has visto
            </label>
            <textarea
              id="sug-mensaje"
              required
              minLength={5}
              maxLength={2000}
              rows={4}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              placeholder="Por ejemplo: el consultorio de mi pueblo no aparece."
            />
          </div>
          <div>
            <label htmlFor="sug-contacto" className="text-sm font-medium">
              Email de contacto <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="sug-contacto"
              type="email"
              maxLength={200}
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={estado === "enviando"}
              className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {estado === "enviando" ? "Enviando…" : "Enviar sugerencia"}
            </button>
            <p aria-live="polite" className="text-sm">
              {estado === "hecho" && (
                <span className="inline-flex items-center gap-1.5 text-[var(--nivel-alto,#2f9e5e)]">
                  <Check className="size-4" aria-hidden /> Gracias, la revisaremos.
                </span>
              )}
              {estado === "error" && (
                <span className="text-destructive">No se ha podido enviar. Inténtalo de nuevo.</span>
              )}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}