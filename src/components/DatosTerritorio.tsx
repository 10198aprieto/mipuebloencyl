import { useQuery } from "@tanstack/react-query";
import { Mountain, Ruler, Tractor, Wheat, Beef, LineChart as LineChartIcon } from "lucide-react";
import { fetchDatosExternos, fmtNum, type DatosExternos, type PoblacionAnyo } from "@/lib/cyl";

export function useDatosExternos(municipioId: string) {
  return useQuery<DatosExternos>({
    queryKey: ["datos-externos", municipioId],
    queryFn: () => fetchDatosExternos(municipioId),
    staleTime: 1000 * 60 * 30,
  });
}

/** Foto y escudo del municipio (Wikidata + Wikimedia Commons). */
export function GaleriaMunicipio({ municipioId, nombre }: { municipioId: string; nombre: string }) {
  const { data } = useDatosExternos(municipioId);
  const foto = data?.imagenes.find((i) => i.tipo === "imagen");
  const escudo = data?.imagenes.find((i) => i.tipo === "escudo");
  if (!foto && !escudo) return null;
  return (
    <div className="flex items-center gap-3">
      {foto && (
        <figure className="m-0">
          <img
            src={foto.url_thumb ?? foto.url}
            alt={`Vista de ${nombre}`}
            loading="lazy"
            className="h-24 w-36 rounded-xl border border-border object-cover"
          />
          <figcaption className="mt-1 max-w-36 truncate text-[0.65rem] text-muted-foreground">
            {foto.autor ?? "Autoría desconocida"} · {foto.licencia ?? "Ver licencia"}
          </figcaption>
        </figure>
      )}
      {escudo && (
        <img
          src={escudo.url_thumb ?? escudo.url}
          alt={`Escudo de ${nombre}`}
          loading="lazy"
          className="h-24 w-auto object-contain"
        />
      )}
    </div>
  );
}

function Grafica({ serie }: { serie: PoblacionAnyo[] }) {
  const puntos = serie.filter((p) => p.poblacion !== null) as Array<{ anyo: number; poblacion: number }>;
  if (puntos.length < 2) return null;
  const w = 320;
  const h = 90;
  const anyos = puntos.map((p) => p.anyo);
  const vals = puntos.map((p) => p.poblacion);
  const [x0, x1] = [Math.min(...anyos), Math.max(...anyos)];
  const [y0, y1] = [Math.min(...vals), Math.max(...vals)];
  const px = (a: number) => ((a - x0) / Math.max(1, x1 - x0)) * w;
  const py = (v: number) => h - ((v - y0) / Math.max(1, y1 - y0)) * h;
  const d = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.anyo).toFixed(1)},${py(p.poblacion).toFixed(1)}`).join(" ");
  const primero = puntos[0]!;
  const ultimo = puntos[puntos.length - 1]!;
  const variacion = primero.poblacion > 0 ? ((ultimo.poblacion - primero.poblacion) / primero.poblacion) * 100 : null;
  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-24 w-full"
        role="img"
        aria-label={`Población de ${primero.anyo} (${primero.poblacion} habitantes) a ${ultimo.anyo} (${ultimo.poblacion} habitantes)`}
      >
        <path d={`${d} L${w},${h} L0,${h} Z`} fill="hsl(var(--primary) / 0.12)" />
        <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">
        {primero.anyo}: {fmtNum(primero.poblacion)} hab. · {ultimo.anyo}: {fmtNum(ultimo.poblacion)} hab.
        {variacion !== null && ` · ${variacion > 0 ? "+" : ""}${variacion.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`}
      </p>
    </div>
  );
}

function Dato({ icono, titulo, valor, detalle }: { icono: React.ReactNode; titulo: string; valor: string; detalle: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icono}
        <h4 className="text-sm font-medium tracking-wide">{titulo}</h4>
      </div>
      <p className="mt-2 font-display text-3xl leading-none">{valor}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detalle}</p>
    </div>
  );
}

/** Sección con INE (agro y población histórica) e IGN/CNIG (altitud y superficie). */
export function DatosTerritorio({ municipioId }: { municipioId: string }) {
  const { data, isLoading } = useDatosExternos(municipioId);
  if (isLoading) return <div className="h-40 animate-pulse rounded-xl border border-border bg-secondary" />;
  const geo = data?.geografia ?? null;
  const agro = data?.agro ?? null;
  const poblacion = data?.poblacion ?? [];
  const foto = data?.imagenes.find((i) => i.tipo === "imagen");

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg">Territorio</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Altitud y coordenadas del IGN/CNIG; superficie y, cuando el IGN no la publica, altitud de Wikidata.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Dato
            icono={<Mountain className="size-4" aria-hidden />}
            titulo="Altitud"
            valor={geo?.altitud_m != null ? fmtNum(geo.altitud_m, " m", 0) : "Sin dato"}
            detalle={`${geo?.nucleo_referencia ? `Núcleo de referencia: ${geo.nucleo_referencia}. ` : ""}Fuente: ${geo?.fuente_altitud ?? "no disponible"}`}
          />
          <Dato
            icono={<Ruler className="size-4" aria-hidden />}
            titulo="Superficie"
            valor={geo?.superficie_km2 != null ? `${fmtNum(geo.superficie_km2, " km²", 2)}` : "Sin dato"}
            detalle={`Fuente: ${geo?.fuente_superficie ?? "no disponible"}`}
          />
          <Dato
            icono={<LineChartIcon className="size-4" aria-hidden />}
            titulo="Serie de población"
            valor={poblacion.length ? `${poblacion.length} años` : "Sin dato"}
            detalle="Series censales del INE recogidas en Wikidata"
          />
        </div>
      </section>

      {poblacion.length >= 2 && (
        <section>
          <h3 className="text-lg">Población a lo largo del tiempo</h3>
          <Grafica serie={poblacion} />
        </section>
      )}

      <section>
        <h3 className="text-lg">Agricultura y ganadería</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {agro?.anyo
            ? `Censo Agrario del INE, datos de ${agro.anyo} (última edición con desglose municipal publicado).`
            : "Censo Agrario del INE. Sin datos municipales publicados para este término."}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Dato
            icono={<Tractor className="size-4" aria-hidden />}
            titulo="Explotaciones"
            valor={agro?.explotaciones != null ? fmtNum(agro.explotaciones) : "Sin dato"}
            detalle="Explotaciones agrarias con tierras o ganado"
          />
          <Dato
            icono={<Wheat className="size-4" aria-hidden />}
            titulo="Superficie agrícola útil"
            valor={agro?.sau_hectareas != null ? fmtNum(agro.sau_hectareas, " ha", 0) : "Sin dato"}
            detalle="Tierras labradas y pastos permanentes"
          />
          <Dato
            icono={<Beef className="size-4" aria-hidden />}
            titulo="Unidades ganaderas"
            valor={agro?.unidades_ganaderas != null ? fmtNum(agro.unidades_ganaderas, "", 0) : "Sin dato"}
            detalle="Equivalencia estándar del ganado censado"
          />
        </div>
      </section>

      {foto && (
        <p className="text-xs text-muted-foreground">
          Imagen y escudo:{" "}
          <a href={foto.pagina_descripcion ?? foto.url} target="_blank" rel="noreferrer" className="underline">
            Wikimedia Commons
          </a>
          {foto.autor ? ` · ${foto.autor}` : ""}
          {foto.licencia ? (
            foto.licencia_url ? (
              <>
                {" · "}
                <a href={foto.licencia_url} target="_blank" rel="noreferrer" className="underline">
                  {foto.licencia}
                </a>
              </>
            ) : (
              ` · ${foto.licencia}`
            )
          ) : null}
        </p>
      )}
    </div>
  );
}
