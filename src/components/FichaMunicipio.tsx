import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bus,
  GraduationCap,
  Stethoscope,
  Wind,
  Users,
  MapPin,
  Library,
  Landmark,
  PartyPopper,
  Store,
  ShoppingBasket,
  Briefcase,
  HeartHandshake,
  HandHeart,
  Car,
  Plug,
  Pill,
  TrendingDown,
} from "lucide-react";
import {
  CATEGORIAS,
  fetchFicha,
  fetchMediasComunidad,
  fetchMediasProvincia,
  fetchParoProvincia,
  fmtFecha,
  fmtNum,
  indiceConPesos,
  nivelIndice,
  PESOS_POR_DEFECTO,
  type MunicipioFicha,
  type Pesos,
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

const PESTANAS = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "educacion", etiqueta: "Educación" },
  { id: "salud", etiqueta: "Salud" },
  { id: "movilidad", etiqueta: "Movilidad" },
  { id: "social", etiqueta: "Social" },
  { id: "cultura", etiqueta: "Cultura y ocio" },
  { id: "comercio", etiqueta: "Comercio" },
] as const;

type PestanaId = (typeof PESTANAS)[number]["id"];

function BarraSub({ etiqueta, valor, media }: { etiqueta: string; valor: number | null; media: number | null }) {
  const v = valor ?? 0;
  const nivel = nivelIndice(v);
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span>{etiqueta}</span>
        <span className="font-medium" style={{ color: nivel.color }}>
          {valor === null ? "s/d" : fmtNum(v, "/100", 1)}
        </span>
      </div>
      <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, v)}%`, backgroundColor: nivel.color }} />
        {media !== null && (
          <span
            className="absolute top-0 h-full w-0.5 bg-foreground/60"
            style={{ left: `${Math.min(100, media)}%` }}
            aria-hidden
          />
        )}
      </div>
      {media !== null && (
        <p className="mt-0.5 text-[0.7rem] text-muted-foreground">Media de la comunidad: {fmtNum(media, "", 1)}</p>
      )}
    </div>
  );
}

export function FichaMunicipio({
  municipioId,
  pesos = PESOS_POR_DEFECTO,
}: {
  municipioId: string;
  pesos?: Pesos;
}) {
  const [pestana, setPestana] = useState<PestanaId>("resumen");
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
  const paro = useQuery({
    queryKey: ["paro-provincia", provincia],
    queryFn: () => fetchParoProvincia(provincia!),
    enabled: !!provincia,
  });

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
  const indice = indiceConPesos(m, pesos);
  const nivel = nivelIndice(indice);
  const totalSalud = m.num_centros_salud + m.num_hospitales_consultorios;
  const prov = mediasProv.data ?? null;
  const cyl = mediasCyL.data ?? null;

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
              {indice ?? "s/d"}
              <span className="text-xl text-muted-foreground">/100</span>
            </p>
            <p className="text-sm font-medium" style={{ color: nivel.color }}>
              Cobertura {nivel.etiqueta.toLowerCase()}
            </p>
          </div>
        </div>
      </header>

      <div role="tablist" aria-label="Secciones de la ficha" className="flex flex-wrap gap-1 border-b border-border px-4 pt-3">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            type="button"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`rounded-t-lg px-3 py-2 text-sm transition-colors ${
              pestana === p.id
                ? "border-b-2 border-primary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      <div className="p-6">
        {pestana === "resumen" && (
          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h3 className="text-lg">Subíndices por categoría</h3>
              <p className="mb-2 text-xs text-muted-foreground">
                Cada categoría se normaliza de 0 a 100 frente al resto de la comunidad. La marca vertical señala la
                media regional.
              </p>
              {CATEGORIAS.map((c) => (
                <BarraSub
                  key={c.clave}
                  etiqueta={c.etiqueta}
                  valor={m[c.clave]}
                  media={
                    (cyl?.[`media_${c.clave.replace("sub_", "sub_")}` as keyof typeof cyl] as number | null) ?? null
                  }
                />
              ))}
            </section>
            <section>
              <h3 className="text-lg">Comparado con {m.provincia} y con la comunidad</h3>
              <p className="mb-2 text-xs text-muted-foreground">
                Medias de los {prov?.num_municipios ?? "…"} municipios de la provincia y los{" "}
                {cyl?.num_municipios ?? "…"} de Castilla y León.
              </p>
              <Comparativa etiqueta="Índice global (provincia)" valor={indice} media={prov?.indice_medio ?? null} />
              <Comparativa etiqueta="Índice global (comunidad)" valor={indice} media={cyl?.indice_medio ?? null} />
              <Comparativa etiqueta="Centros educativos (provincia)" valor={m.num_centros_educativos} media={prov?.media_educacion ?? null} decimales={2} />
              <Comparativa etiqueta="Centros sanitarios (provincia)" valor={totalSalud} media={prov?.media_salud ?? null} decimales={2} />
              <Comparativa etiqueta="Farmacias (provincia)" valor={m.num_farmacias} media={prov?.media_farmacias ?? null} decimales={2} />
              <Comparativa etiqueta="Distancia a estación de bus (provincia)" valor={m.distancia_bus_km} media={prov?.media_distancia_bus_km ?? null} sufijo=" km" mejorSiMenor />
              <Comparativa etiqueta="Equipamientos culturales (comunidad)" valor={m.num_bibliotecas_bibliobuses + m.num_museos} media={cyl?.media_cultura ?? null} decimales={2} />
              <Comparativa etiqueta="Establecimientos comerciales (comunidad)" valor={m.num_establecimientos_comerciales} media={cyl?.media_comercio ?? null} decimales={2} />
            </section>
          </div>
        )}

        {pestana === "educacion" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Indicador
              icono={<GraduationCap className="size-4" aria-hidden />}
              titulo="Centros docentes"
              valor={fmtNum(m.num_centros_educativos)}
              detalle="Centros no universitarios en alta en el municipio"
            />
            <Indicador
              icono={<Briefcase className="size-4" aria-hidden />}
              titulo="Colegios profesionales"
              valor={fmtNum(m.num_colegios_profesionales)}
              detalle="Sedes de colegios profesionales registradas en el municipio"
            />
          </div>
        )}

        {pestana === "salud" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Indicador
              icono={<Stethoscope className="size-4" aria-hidden />}
              titulo="Centros y consultorios"
              valor={fmtNum(totalSalud)}
              detalle={`${m.num_centros_salud} centro(s) de salud y ${m.num_hospitales_consultorios} hospital(es)/consultorio(s)`}
            />
            <Indicador
              icono={<Pill className="size-4" aria-hidden />}
              titulo="Farmacias"
              valor={fmtNum(m.num_farmacias)}
              detalle="Oficinas de farmacia abiertas en el municipio"
            />
            <Indicador
              icono={<MapPin className="size-4" aria-hidden />}
              titulo="Área de salud"
              valor={m.area_salud ?? "Sin dato"}
              detalle={
                m.centro_salud_referencia
                  ? `Centro de salud de referencia: ${m.centro_salud_referencia}`
                  : "Sin centro de referencia asignado en el registro"
              }
            />
            <Indicador
              icono={<Wind className="size-4" aria-hidden />}
              titulo="Calidad del aire"
              valor={m.aire_ultimo_valor !== null ? fmtNum(m.aire_ultimo_valor, "", 1) : "Sin dato"}
              detalle={`${m.aire_contaminante ?? "Sin contaminante"} · estación ${m.estacion_aire ?? "—"} a ${fmtNum(m.distancia_aire_km, " km", 1)} · dato del ${fmtFecha(m.aire_fecha_dato)}`}
            />
          </div>
        )}

        {pestana === "movilidad" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Indicador
              icono={<Bus className="size-4" aria-hidden />}
              titulo="Estación de autobuses"
              valor={m.distancia_bus_km !== null ? fmtNum(m.distancia_bus_km, " km", 1) : "Sin dato"}
              detalle={
                m.estacion_autobus_mas_cercana
                  ? `Distancia hasta la estación de ${m.estacion_autobus_mas_cercana}`
                  : "Sin estación de referencia"
              }
            />
            <Indicador
              icono={<Car className="size-4" aria-hidden />}
              titulo="Estaciones de ITV"
              valor={fmtNum(m.num_centros_itv)}
              detalle="Centros de inspección técnica de vehículos en el municipio"
            />
            <Indicador
              icono={<Plug className="size-4" aria-hidden />}
              titulo="Recarga eléctrica"
              valor={fmtNum(m.num_puntos_recarga_electrica)}
              detalle="Puntos de recarga de vehículo eléctrico localizados en el término municipal"
            />
          </div>
        )}

        {pestana === "social" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Indicador
              icono={<HeartHandshake className="size-4" aria-hidden />}
              titulo="Centros de carácter social"
              valor={fmtNum(m.num_centros_caracter_social)}
              detalle="Residencias, centros de día y otros centros del registro autonómico"
            />
            <Indicador
              icono={<HandHeart className="size-4" aria-hidden />}
              titulo="Servicios sociales"
              valor={fmtNum(m.num_servicios_caracter_social)}
              detalle="Servicios de carácter social prestados en el municipio"
            />
            <Indicador
              icono={<HandHeart className="size-4" aria-hidden />}
              titulo="Puntos de donación"
              valor={fmtNum(m.num_puntos_donacion)}
              detalle="Puntos de donación de sangre localizados en el término municipal"
            />
          </div>
        )}

        {pestana === "cultura" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Indicador
              icono={<Library className="size-4" aria-hidden />}
              titulo="Bibliotecas y bibliobuses"
              valor={fmtNum(m.num_bibliotecas_bibliobuses)}
              detalle="Puntos de servicio bibliotecario que atienden al municipio"
            />
            <Indicador
              icono={<Landmark className="size-4" aria-hidden />}
              titulo="Museos"
              valor={fmtNum(m.num_museos)}
              detalle="Museos y colecciones museográficas registrados"
            />
            <Indicador
              icono={<PartyPopper className="size-4" aria-hidden />}
              titulo="Fiestas de interés"
              valor={m.tiene_fiestas_registradas ? "Sí" : "No consta"}
              detalle={
                m.proxima_fiesta
                  ? `Próxima: ${m.nombre_proxima_fiesta ?? "fiesta declarada"} · ${fmtFecha(m.proxima_fiesta)}`
                  : "Sin fiestas declaradas en el registro autonómico"
              }
            />
          </div>
        )}

        {pestana === "comercio" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Indicador
              icono={<Store className="size-4" aria-hidden />}
              titulo="Establecimientos comerciales"
              valor={fmtNum(m.num_establecimientos_comerciales)}
              detalle="Establecimientos del censo comercial de Castilla y León"
            />
            <Indicador
              icono={<ShoppingBasket className="size-4" aria-hidden />}
              titulo="Comercio de proximidad"
              valor={fmtNum(m.num_servicios_proximidad)}
              detalle="Servicios de proximidad en zonas rurales o despobladas"
            />
            <Indicador
              icono={<TrendingDown className="size-4" aria-hidden />}
              titulo={`Paro en ${m.provincia}`}
              valor={paro.data?.tasa_paro !== null && paro.data ? fmtNum(paro.data.tasa_paro, " %", 1) : "Sin dato"}
              detalle={`${fmtNum(paro.data?.parados_total ?? null)} personas paradas registradas · dato provincial de ${fmtFecha(paro.data?.fecha ?? null)}`}
            />
          </div>
        )}
      </div>
    </article>
  );
}