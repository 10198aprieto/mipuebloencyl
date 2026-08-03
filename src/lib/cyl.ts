import { supabase } from "@/integrations/supabase/client";

export type MunicipioFicha = {
  id: string;
  cod_ine: number;
  nombre: string;
  provincia: string;
  latitud: number | null;
  longitud: number | null;
  poblacion: number | null;
  num_centros_educativos: number;
  num_centros_salud: number;
  num_hospitales_consultorios: number;
  num_farmacias: number;
  area_salud: string | null;
  centro_salud_referencia: string | null;
  estacion_autobus_mas_cercana: string | null;
  distancia_bus_km: number | null;
  estacion_aire: string | null;
  distancia_aire_km: number | null;
  aire_ultimo_valor: number | null;
  aire_contaminante: string | null;
  aire_fecha_dato: string | null;
  num_bibliotecas_bibliobuses: number;
  num_museos: number;
  tiene_fiestas_registradas: boolean;
  proxima_fiesta: string | null;
  nombre_proxima_fiesta: string | null;
  num_establecimientos_comerciales: number;
  num_servicios_proximidad: number;
  num_colegios_profesionales: number;
  num_centros_caracter_social: number;
  num_servicios_caracter_social: number;
  num_puntos_donacion: number;
  num_centros_itv: number;
  num_puntos_recarga_electrica: number;
  indice_calculado: number | null;
} & Subindices;

export type Subindices = {
  sub_educacion: number | null;
  sub_salud: number | null;
  sub_movilidad: number | null;
  sub_social: number | null;
  sub_cultura: number | null;
  sub_comercio: number | null;
  sub_transporte: number | null;
  sub_aire: number | null;
};

export type PuntoMapa = {
  id: string;
  nombre: string;
  provincia: string;
  latitud: number;
  longitud: number;
  indice_calculado: number | null;
} & Subindices;

export type Medias = {
  indice_medio: number | null;
  media_educacion: number | null;
  media_salud: number | null;
  media_farmacias: number | null;
  media_distancia_bus_km: number | null;
  media_aire: number | null;
  media_cultura: number | null;
  media_comercio: number | null;
  media_social: number | null;
  media_movilidad: number | null;
  media_sub_educacion: number | null;
  media_sub_salud: number | null;
  media_sub_movilidad: number | null;
  media_sub_social: number | null;
  media_sub_cultura: number | null;
  media_sub_comercio: number | null;
  media_sub_aire: number | null;
  num_municipios: number;
};

export type ParoProvincia = {
  provincia: string;
  paro_registrado: number | null;
  tasa_paro_estimada: number | null;
  periodo: string | null;
};

/** Categorías del índice ponderable desde el frontend. */
export const CATEGORIAS = [
  { clave: "sub_educacion", etiqueta: "Educación", pesoBase: 22 },
  { clave: "sub_salud", etiqueta: "Salud", pesoBase: 26 },
  { clave: "sub_movilidad", etiqueta: "Movilidad", pesoBase: 16 },
  { clave: "sub_social", etiqueta: "Social", pesoBase: 14 },
  { clave: "sub_cultura", etiqueta: "Cultura y ocio", pesoBase: 12 },
  { clave: "sub_comercio", etiqueta: "Comercio", pesoBase: 10 },
] as const;

export type ClaveCategoria = (typeof CATEGORIAS)[number]["clave"];
export type Pesos = Record<ClaveCategoria, number>;

export const PESOS_POR_DEFECTO: Pesos = Object.fromEntries(
  CATEGORIAS.map((c) => [c.clave, c.pesoBase]),
) as Pesos;

/** Recalcula el índice 0-100 en cliente con los pesos elegidos por la persona usuaria. */
export function indiceConPesos(sub: Partial<Subindices>, pesos: Pesos): number | null {
  let suma = 0;
  let total = 0;
  for (const c of CATEGORIAS) {
    const peso = pesos[c.clave] ?? 0;
    const valor = sub[c.clave];
    if (peso <= 0 || valor === null || valor === undefined) continue;
    suma += peso * valor;
    total += peso;
  }
  if (total === 0) return null;
  return Math.round((suma / total) * 10) / 10;
}

export function sonPesosPorDefecto(pesos: Pesos) {
  return CATEGORIAS.every((c) => pesos[c.clave] === c.pesoBase);
}

const SUB_COLS =
  "sub_educacion, sub_salud, sub_movilidad, sub_social, sub_cultura, sub_comercio, sub_transporte, sub_aire";

const FICHA_COLS =
  `id, cod_ine, nombre, provincia, latitud, longitud, poblacion, num_centros_educativos, num_centros_salud, num_hospitales_consultorios, num_farmacias, area_salud, centro_salud_referencia, estacion_autobus_mas_cercana, distancia_bus_km, estacion_aire, distancia_aire_km, aire_ultimo_valor, aire_contaminante, aire_fecha_dato, num_bibliotecas_bibliobuses, num_museos, tiene_fiestas_registradas, proxima_fiesta, nombre_proxima_fiesta, num_establecimientos_comerciales, num_servicios_proximidad, num_colegios_profesionales, num_centros_caracter_social, num_servicios_caracter_social, num_puntos_donacion, num_centros_itv, num_puntos_recarga_electrica, indice_calculado, ${SUB_COLS}`;

const MEDIAS_COLS =
  "indice_medio, media_educacion, media_salud, media_farmacias, media_distancia_bus_km, media_aire, media_cultura, media_comercio, media_social, media_movilidad, media_sub_educacion, media_sub_salud, media_sub_movilidad, media_sub_social, media_sub_cultura, media_sub_comercio, media_sub_aire, num_municipios";

/** El API limita a 1.000 filas por petición: paginamos para cubrir los ~2.200 municipios. */
export async function fetchPuntosMapa(): Promise<PuntoMapa[]> {
  const out: PuntoMapa[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("vista_municipios")
      .select(`id, nombre, provincia, latitud, longitud, indice_calculado, ${SUB_COLS}`)
      .not("latitud", "is", null)
      .order("nombre")
      .range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as PuntoMapa[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export type GeoMunicipios = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { id: string; nombre: string; provincia: string };
    geometry: unknown;
  }>;
};

/** Geometrías municipales simplificadas para el mapa coroplético. */
export async function fetchGeoMunicipios(): Promise<GeoMunicipios> {
  const { data, error } = await supabase.rpc("municipios_geojson");
  if (error) throw error;
  return data as unknown as GeoMunicipios;
}

export async function fetchParoProvincia(provincia: string): Promise<ParoProvincia | null> {
  const { data, error } = await supabase
    .from("contexto_economico_provincia")
    .select("provincia, paro_registrado, tasa_paro_estimada, periodo")
    .eq("provincia", provincia)
    .maybeSingle();
  if (error) return null;
  return (data as ParoProvincia) ?? null;
}

export async function fetchFicha(id: string): Promise<MunicipioFicha> {
  const { data, error } = await supabase
    .from("vista_municipios")
    .select(FICHA_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Municipio no encontrado");
  return data as MunicipioFicha;
}

export async function fetchMediasProvincia(provincia: string): Promise<Medias | null> {
  const { data, error } = await supabase
    .from("medias_provincia")
    .select(MEDIAS_COLS)
    .eq("provincia", provincia)
    .maybeSingle();
  if (error) throw error;
  return (data as Medias) ?? null;
}

export async function fetchMediasComunidad(): Promise<Medias | null> {
  const { data, error } = await supabase
    .from("medias_comunidad")
    .select(MEDIAS_COLS)
    .maybeSingle();
  if (error) throw error;
  return (data as Medias) ?? null;
}

export async function fetchUltimaActualizacion(): Promise<string | null> {
  const { data, error } = await supabase
    .from("sync_log")
    .select("ejecutado_en")
    .order("ejecutado_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as { ejecutado_en: string } | null)?.ejecutado_en ?? null;
}

/** Escala tipo semáforo del índice de servicios (0-100). */
export function nivelIndice(indice: number | null | undefined) {
  const v = indice ?? 0;
  if (v >= 65) return { etiqueta: "Muy buena", token: "nivel-alto", color: "#2f9e5e" };
  if (v >= 50) return { etiqueta: "Buena", token: "nivel-medio-alto", color: "#7fbe3f" };
  if (v >= 38) return { etiqueta: "Intermedia", token: "nivel-medio", color: "#e0a72a" };
  if (v >= 28) return { etiqueta: "Limitada", token: "nivel-bajo", color: "#e07a2a" };
  return { etiqueta: "Muy limitada", token: "nivel-muy-bajo", color: "#cf4a2c" };
}

export function fmtNum(n: number | null | undefined, sufijo = "", decimales = 0) {
  if (n === null || n === undefined) return "Sin dato";
  return `${n.toLocaleString("es-ES", { maximumFractionDigits: decimales })}${sufijo}`;
}

export function fmtFecha(iso: string | null | undefined) {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export function quitarAcentos(t: string) {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}