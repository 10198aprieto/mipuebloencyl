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
  estacion_autobus_mas_cercana: string | null;
  distancia_bus_km: number | null;
  estacion_aire: string | null;
  distancia_aire_km: number | null;
  aire_ultimo_valor: number | null;
  aire_contaminante: string | null;
  aire_fecha_dato: string | null;
  indice_calculado: number | null;
};

export type PuntoMapa = {
  id: string;
  nombre: string;
  provincia: string;
  latitud: number;
  longitud: number;
  indice_calculado: number | null;
};

export type Medias = {
  indice_medio: number | null;
  media_educacion: number | null;
  media_salud: number | null;
  media_distancia_bus_km: number | null;
  media_aire: number | null;
  num_municipios: number;
};

const FICHA_COLS =
  "id, cod_ine, nombre, provincia, latitud, longitud, poblacion, num_centros_educativos, num_centros_salud, num_hospitales_consultorios, estacion_autobus_mas_cercana, distancia_bus_km, estacion_aire, distancia_aire_km, aire_ultimo_valor, aire_contaminante, aire_fecha_dato, indice_calculado";

/** El API limita a 1.000 filas por petición: paginamos para cubrir los ~2.200 municipios. */
export async function fetchPuntosMapa(): Promise<PuntoMapa[]> {
  const out: PuntoMapa[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("vista_municipios")
      .select("id, nombre, provincia, latitud, longitud, indice_calculado")
      .not("latitud", "is", null)
      .order("nombre")
      .range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as PuntoMapa[]));
    if (!data || data.length < 1000) break;
  }
  return out;
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
    .select("indice_medio, media_educacion, media_salud, media_distancia_bus_km, media_aire, num_municipios")
    .eq("provincia", provincia)
    .maybeSingle();
  if (error) throw error;
  return (data as Medias) ?? null;
}

export async function fetchMediasComunidad(): Promise<Medias | null> {
  const { data, error } = await supabase
    .from("medias_comunidad")
    .select("indice_medio, media_educacion, media_salud, media_distancia_bus_km, media_aire, num_municipios")
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