import { useQuery } from "@tanstack/react-query";
import { Bus, GraduationCap, Stethoscope, Wind, Users, MapPin } from "lucide-react";
import {
  fetchFicha,
  fetchMediasComunidad,
  fetchMediasProvincia,
  fmtFecha,
  fmtNum,
  nivelIndice,
  type MunicipioFicha,
} from "@/lib/cyl";

function Comparativa({
  etiqueta,
  valor,
  media,
  sufijo = "",
  decimales = 1,
  mejorSiMenor = false,
}: {
  etiqueta: string;
  valor: number | null;
  media: number | null;
  sufijo?: string;
  decimales?: number;
  mejorSiMenor?: boolean;
}) {
  let veredicto = "Sin comparación";
  if (valor !== null && media !== null) {
    const dif = valor - media;
    const mejor = mejorSiMenor ? dif < 0 : dif > 0;
    veredicto =
      Math.abs(dif) < 0.05
        ? "En la media"
        : `${mejor ? "Mejor" : "Peor"} que la media (${dif > 0 ? "+" : ""}${dif.toLocaleString("es-ES", { maximumFractionDigits: decimales })}${sufijo})`;
  }
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-border py-1.5 text-sm">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span>
        <span className="font-medium">{fmtNum(media, sufijo, decimales)}</span>{" "}
        <span className="text-xs text-muted-foreground">· {veredicto}</span>
      </span>
    </div>
  );
}

function Indicador({
  icono,
  titulo,
  valor,
  detalle,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  detalle: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icono}
        <h3 className="text-sm font-medium tracking-wide">{titulo}</h3>
      </div>
      <p className="mt-2 font-display text-3xl leading-none">{valor}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detalle}</p>
    </div>
  );
}

export function FichaMunicipio({ municipioId }: { municipioId: string }) {
  const ficha = useQuery<MunicipioFicha>({
    queryKey: ["ficha", municipioId],
    queryFn: () => fetchFicha(municipioId),
  });
  const provincia = ficha.data?.provincia;
  const mediasProv = useQuery({
    queryKey: ["medias-provincia", provincia],
    queryFn: () => fetchMediasProvincia(provincia!),
    enabled: !!provincia,
  });
  const mediasCyL = useQuery({ queryKey: ["medias-comunidad"], queryFn: fetchMediasComunidad });

  if (ficha.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-secondary" />;
  }
  if (ficha.error || !ficha.data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No se han podido cargar los datos de este municipio.
      </div>
    );
  }

  const m = ficha.data;
  const nivel = nivelIndice(m.indice_calculado);
  const totalSalud = m.num_centros_salud + m.num_hospitales_consultorios;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-ficha)]">
      <header className="border-b border-border bg-secondary/60 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden /> Provincia de {m.provincia}
            </p>
            <h2 className="mt-1 text-4xl">{m.nombre}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" aria-hidden /> {fmtNum(m.poblacion)} habitantes · INE {m.cod_ine}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Índice de servicios</p>
            <p className="font-display text-5xl leading-none" style={{ color: nivel.color }}>
              {m.indice_calculado ?? "s/d"}
              <span className="text-xl text-muted-foreground">/100</span>
            </p>
            <p className="text-sm font-medium" style={{ color: nivel.color }}>
              Cobertura {nivel.etiqueta.toLowerCase()}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          icono={<GraduationCap className="size-4" aria-hidden />}
          titulo="Educación"
          valor={fmtNum(m.num_centros_educativos)}
          detalle="Centros docentes no universitarios en el municipio"
        />
        <Indicador
          icono={<Stethoscope className="size-4" aria-hidden />}
          titulo="Salud"
          valor={fmtNum(totalSalud)}
          detalle={`${m.num_centros_salud} centro(s) de salud de referencia y ${m.num_hospitales_consultorios} hospital(es)/consultorio(s) registrados`}
        />
        <Indicador
          icono={<Bus className="size-4" aria-hidden />}
          titulo="Transporte"
          valor={m.distancia_bus_km !== null ? `${fmtNum(m.distancia_bus_km, " km", 1)}` : "Sin dato"}
          detalle={
            m.estacion_autobus_mas_cercana
              ? `Hasta la estación de autobuses de ${m.estacion_autobus_mas_cercana}`
              : "Sin estación de referencia"
          }
        />
        <Indicador
          icono={<Wind className="size-4" aria-hidden />}
          titulo="Calidad del aire"
          valor={m.aire_ultimo_valor !== null ? fmtNum(m.aire_ultimo_valor, "", 1) : "Sin dato"}
          detalle={`${m.aire_contaminante ?? "Sin contaminante"} · estación ${m.estacion_aire ?? "—"} a ${fmtNum(m.distancia_aire_km, " km", 1)} · dato del ${fmtFecha(m.aire_fecha_dato)}`}
        />
      </div>

      <div className="grid gap-6 border-t border-border p-6 md:grid-cols-2">
        <section>
          <h3 className="text-lg">Comparado con {m.provincia}</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Media de los {mediasProv.data?.num_municipios ?? "…"} municipios de la provincia
          </p>
          <Comparativa etiqueta="Índice global" valor={m.indice_calculado} media={mediasProv.data?.indice_medio ?? null} />
          <Comparativa etiqueta="Centros educativos" valor={m.num_centros_educativos} media={mediasProv.data?.media_educacion ?? null} decimales={2} />
          <Comparativa etiqueta="Centros sanitarios" valor={totalSalud} media={mediasProv.data?.media_salud ?? null} decimales={2} />
          <Comparativa etiqueta="Distancia a estación de bus" valor={m.distancia_bus_km} media={mediasProv.data?.media_distancia_bus_km ?? null} sufijo=" km" mejorSiMenor />
        </section>
        <section>
          <h3 className="text-lg">Comparado con Castilla y León</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Media de los {mediasCyL.data?.num_municipios ?? "…"} municipios de la comunidad
          </p>
          <Comparativa etiqueta="Índice global" valor={m.indice_calculado} media={mediasCyL.data?.indice_medio ?? null} />
          <Comparativa etiqueta="Centros educativos" valor={m.num_centros_educativos} media={mediasCyL.data?.media_educacion ?? null} decimales={2} />
          <Comparativa etiqueta="Centros sanitarios" valor={totalSalud} media={mediasCyL.data?.media_salud ?? null} decimales={2} />
          <Comparativa etiqueta="Distancia a estación de bus" valor={m.distancia_bus_km} media={mediasCyL.data?.media_distancia_bus_km ?? null} sufijo=" km" mejorSiMenor />
        </section>
      </div>
    </article>
  );
}