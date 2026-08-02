import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { PuntoMapa } from "@/lib/cyl";
import { quitarAcentos } from "@/lib/cyl";

type Props = {
  municipios: PuntoMapa[];
  onSelect: (m: PuntoMapa) => void;
  seleccionado?: string | null;
};

export function BuscadorMunicipio({ municipios, onSelect, seleccionado }: Props) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const cierre = useRef<number | null>(null);

  const sugerencias = useMemo(() => {
    const q = quitarAcentos(texto.trim());
    if (q.length < 2) return [];
    return municipios
      .filter((m) => quitarAcentos(m.nombre).includes(q))
      .sort((a, b) => {
        const ai = quitarAcentos(a.nombre).startsWith(q) ? 0 : 1;
        const bi = quitarAcentos(b.nombre).startsWith(q) ? 0 : 1;
        return ai - bi || a.nombre.localeCompare(b.nombre, "es");
      })
      .slice(0, 8);
  }, [texto, municipios]);

  function elegir(m: PuntoMapa) {
    onSelect(m);
    setTexto("");
    setAbierto(false);
  }

  return (
    <div className="relative w-full">
      <label htmlFor="buscador-municipio" className="sr-only">
        Buscar municipio de Castilla y León
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-ficha)] focus-within:border-ring">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          id="buscador-municipio"
          type="search"
          role="combobox"
          aria-expanded={abierto && sugerencias.length > 0}
          aria-controls="lista-municipios"
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={seleccionado ? `Buscar otro municipio…` : "Escribe tu pueblo o ciudad…"}
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            setActivo(0);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => {
            cierre.current = window.setTimeout(() => setAbierto(false), 120);
          }}
          onKeyDown={(e) => {
            if (!sugerencias.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActivo((i) => (i + 1) % sugerencias.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActivo((i) => (i - 1 + sugerencias.length) % sugerencias.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              const m = sugerencias[activo];
              if (m) elegir(m);
            } else if (e.key === "Escape") {
              setAbierto(false);
            }
          }}
        />
      </div>

      {abierto && sugerencias.length > 0 && (
        <ul
          id="lista-municipios"
          role="listbox"
          className="absolute z-[1200] mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-[var(--shadow-ficha)]"
        >
          {sugerencias.map((m, i) => (
            <li key={m.id} role="option" aria-selected={i === activo}>
              <button
                type="button"
                onMouseEnter={() => setActivo(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (cierre.current) window.clearTimeout(cierre.current);
                }}
                onClick={() => elegir(m)}
                className={`flex w-full items-baseline justify-between gap-4 px-4 py-2.5 text-left text-sm ${
                  i === activo ? "bg-secondary" : "bg-transparent"
                }`}
              >
                <span className="font-medium">{m.nombre}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{m.provincia}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}