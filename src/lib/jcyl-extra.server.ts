// Ampliación de fuentes de la Junta de Castilla y León (Opendatasoft).
// Correspondencia de campos confirmada contra /catalog/datasets/{id} el 2026-08-03:
//
//  municipio-limites-categorias-est            -> cod_ine, municipio, provincia, geo_shape (Polygon) · 2.248 recintos · act. 2023-12
//    (elegido frente a limites-municipales-...-recintos: 2.298 recintos de 2021 y sin cod_ine)
//  bibliotecas-bibliobuses-...-geolocalizados  -> nombre_entidad, provincia, localidad, tipo, posicion · mensual
//  museos                                      -> nombreentidad, localidad, posicion
//  fiestas-locales-...-caracter-local          -> provincia, municipio, fecha_fiesta, nombre_fiesta, ine · anual
//  establecimientos-comerciales                -> municipio, provincia, cod_prov, cod_mun, localizacion · mensual
//  servicios-proximidad                        -> municipio, provincia, cod_prov, cod_mun · mensual
//  colaboradores-carnet-joven                  -> colaborador, actividad · SIN campo de municipio: no georreferenciable
//  paro-provincias                             -> fecha, provincia (sigla), nombre_territorio, total, mujer, varon · mensual
//  colegios-profesionales                      -> municipio_sede, provincia_sede, cod_municipio_sede
//  centros-de-caracter-social                  -> codigo_municipioine, provincia, localidad, latitud/longitud
//  servicios-de-caracter-social                -> codigo_municipio_ine, provincia, localidad
//  puntos-fijos-donacion                       -> localidad, geolocalizacion (10 registros)
//  registro-de-establecimientos-farmaceuticos  -> municipio, provincia, localidad (1.590 farmacias)
//  dependencia-entre-consultorios-y-centros-de-salud -> centro (centro de salud), consultorio
//  mapas-de-areas-de-salud-de-castilla-y-leon  -> municipio, d_zbs (zona básica de salud), provincia, geo_shape
//  centros-de-inspeccion-tecnica-de-vehiculos  -> nombre, localidad, provincia (41 ITV)
//  puntos-de-recarga-del-vehiculo-electrico    -> nombre, direccion, dd {lat,lon} (197 puntos, sin municipio: se asigna por PostGIS)
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  fetchAll,
  indexMunicipios,
  loadMunicipios,
  logSync,
  norm,
  upsertChunks,
  type SyncResult,
} from "@/lib/jcyl.server";

type Punto = { lat: number; lon: number } | null;

const BASE = "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets";

/** Descarga completa (la paginación con offset está limitada a 10.000 registros). */
async function fetchExport<T>(dataset: string, select: string): Promise<T[]> {
  const res = await fetch(`${BASE}/${dataset}/exports/json?${new URLSearchParams({ select })}`);
  if (!res.ok) throw new Error(`${dataset} (export): HTTP ${res.status}`);
  return (await res.json()) as T[];
}

async function contexto() {
  const municipios = await loadMunicipios();
  const porNombre = indexMunicipios(municipios);
  const porIne = new Map<number, string>();
  for (const m of municipios) porIne.set(m.cod_ine, m.id);
  const ine = (v: string | number | null | undefined) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : parseInt(String(v).replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? (porIne.get(n) ?? null) : null;
  };
  return { porNombre, ine };
}

const cachePuntos = new Map<string, string | null>();
async function municipioPorPunto(p: Punto): Promise<string | null> {
  if (!p) return null;
  const key = `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
  if (cachePuntos.has(key)) return cachePuntos.get(key)!;
  const { data } = await supabaseAdmin.rpc("municipio_por_punto", { _lat: p.lat, _lon: p.lon });
  const id = (data as string | null) ?? null;
  cachePuntos.set(key, id);
  return id;
}

const now = () => new Date().toISOString();
const inc = (m: Map<string, number>, id: string | null) => {
  if (id) m.set(id, (m.get(id) ?? 0) + 1);
};

/* ---------------- Límites municipales (choropleth) ---------------- */

export async function syncLimites(): Promise<SyncResult> {
  type R = { cod_ine: string; geo_shape: { geometry: unknown } | null };
  const recs = await fetchAll<R>("municipio-limites-categorias-est", { select: "cod_ine,geo_shape" }, 3000);
  let total = 0;
  const lote: { cod_ine: number; geojson: string }[] = [];
  const enviar = async () => {
    if (!lote.length) return;
    const { data, error } = await supabaseAdmin.rpc("set_municipios_geom", { _rows: lote });
    if (error) throw error;
    total += (data as number) ?? 0;
    lote.length = 0;
  };
  for (const r of recs) {
    if (!r.geo_shape?.geometry || !r.cod_ine) continue;
    lote.push({ cod_ine: parseInt(r.cod_ine, 10), geojson: JSON.stringify(r.geo_shape.geometry) });
    if (lote.length >= 50) await enviar();
  }
  await enviar();
  await logSync("limites_municipales", total);
  return { fuente: "limites_municipales", registros: total };
}

/* ---------------- Cultura y ocio ---------------- */

export async function syncCultura(): Promise<SyncResult> {
  const { porNombre, ine } = await contexto();
  const bibliotecas = new Map<string, number>();
  const museos = new Map<string, number>();

  type B = { localidad: string; provincia: string };
  for (const r of await fetchAll<B>("bibliotecas-bibliobuses-y-puntos-de-servicio-movil-geolocalizados", {
    select: "localidad,provincia",
  })) {
    inc(bibliotecas, porNombre(r.localidad, r.provincia));
  }

  type M = { localidad: string; posicion: Punto };
  for (const r of await fetchAll<M>("museos", { select: "localidad,posicion" })) {
    inc(museos, porNombre(r.localidad) ?? (await municipioPorPunto(r.posicion)));
  }

  type F = { ine: number | null; municipio: string; provincia: string; fecha_fiesta: string; nombre_fiesta: string };
  const hoy = new Date().toISOString().slice(0, 10);
  const fiestas = new Map<string, { fecha: string; nombre: string }>();
  const conFiestas = new Set<string>();
  const listaFiestas = await fetchExport<F>(
    "fiestas-locales-calendario-de-fiestas-de-caracter-local",
    "ine,municipio,provincia,fecha_fiesta,nombre_fiesta",
  );
  listaFiestas.sort((a, b) => (a.fecha_fiesta ?? "").localeCompare(b.fecha_fiesta ?? ""));
  for (const r of listaFiestas) {
    const id = ine(r.ine) ?? porNombre(r.municipio, r.provincia);
    if (!id) continue;
    conFiestas.add(id);
    if (r.fecha_fiesta >= hoy && !fiestas.has(id)) fiestas.set(id, { fecha: r.fecha_fiesta, nombre: r.nombre_fiesta });
  }

  const ids = new Set([...bibliotecas.keys(), ...museos.keys(), ...conFiestas]);
  const ts = now();
  const rows = [...ids].map((municipio_id) => ({
    municipio_id,
    num_bibliotecas_bibliobuses: bibliotecas.get(municipio_id) ?? 0,
    num_museos: museos.get(municipio_id) ?? 0,
    tiene_fiestas_registradas: conFiestas.has(municipio_id),
    proxima_fiesta: fiestas.get(municipio_id)?.fecha ?? null,
    nombre_proxima_fiesta: fiestas.get(municipio_id)?.nombre ?? null,
    updated_at: ts,
  }));
  await upsertChunks("servicios_cultura_ocio", rows, "municipio_id");
  await logSync("cultura_ocio", rows.length);
  return { fuente: "cultura_ocio", registros: rows.length };
}

/* ---------------- Comercio ---------------- */

export async function syncComercio(): Promise<SyncResult> {
  const { porNombre, ine } = await contexto();
  const clave = (cod_prov: number | string | null, cod_mun: number | string | null) => {
    const p = parseInt(String(cod_prov ?? ""), 10);
    const m = parseInt(String(cod_mun ?? ""), 10);
    if (!Number.isFinite(m)) return null;
    // En algunos datasets cod_mun ya incluye la provincia (p. ej. 5019 = Ávila 5 + 019).
    if (m >= 1000) return m;
    return Number.isFinite(p) ? p * 1000 + m : null;
  };
  type C = { municipio: string; provincia: string; cod_prov: number | null; cod_mun: number | null };
  const comercios = new Map<string, number>();
  for (const r of await fetchExport<C>("establecimientos-comerciales", "municipio,provincia,cod_prov,cod_mun")) {
    inc(comercios, ine(clave(r.cod_prov, r.cod_mun)) ?? porNombre(r.municipio, r.provincia));
  }
  const proximidad = new Map<string, number>();
  for (const r of await fetchAll<C>("servicios-proximidad", {
    select: "municipio,provincia,cod_prov,cod_mun",
  }, 10000)) {
    inc(proximidad, ine(clave(r.cod_prov, r.cod_mun)) ?? porNombre(r.municipio, r.provincia));
  }

  const ts = now();
  const ids = new Set([...comercios.keys(), ...proximidad.keys()]);
  const rows = [...ids].map((municipio_id) => ({
    municipio_id,
    num_establecimientos_comerciales: comercios.get(municipio_id) ?? 0,
    num_servicios_proximidad: proximidad.get(municipio_id) ?? 0,
    // colaboradores-carnet-joven no incluye municipio ni geolocalización: no es asignable.
    num_colaboradores_carnet_joven: 0,
    updated_at: ts,
  }));
  await upsertChunks("servicios_comercio", rows, "municipio_id");
  await logSync("comercio", rows.length);
  return { fuente: "comercio", registros: rows.length };
}

/* ---------------- Paro provincial ---------------- */

export async function syncParoProvincias(): Promise<SyncResult> {
  type P = { fecha: string; nombre_territorio: string; total: number; mujer: number; varon: number };
  const recs = await fetchAll<P>("paro-provincias", {
    select: "fecha,nombre_territorio,total,mujer,varon",
    order_by: "fecha desc",
  }, 200);
  const ultimo = new Map<string, P>();
  for (const r of recs) if (!ultimo.has(norm(r.nombre_territorio))) ultimo.set(norm(r.nombre_territorio), r);

  const { data: pobl } = await supabaseAdmin.from("municipios").select("provincia_norm, poblacion");
  const poblacion = new Map<string, number>();
  for (const m of (pobl ?? []) as { provincia_norm: string; poblacion: number | null }[]) {
    poblacion.set(m.provincia_norm, (poblacion.get(m.provincia_norm) ?? 0) + (m.poblacion ?? 0));
  }

  const ts = now();
  const rows = [...ultimo].map(([prov, r]) => {
    const hab = poblacion.get(prov) ?? 0;
    return {
      provincia: r.nombre_territorio,
      provincia_norm: prov,
      fecha: r.fecha,
      parados_total: r.total,
      parados_mujer: r.mujer,
      parados_varon: r.varon,
      // Paro registrado sobre población total de la provincia (no es la EPA).
      tasa_paro: hab ? Math.round((r.total / hab) * 1000) / 10 : null,
      updated_at: ts,
    };
  });
  await upsertChunks("contexto_economico_provincia", rows, "provincia");
  await logSync("paro_provincias", rows.length);
  return { fuente: "paro_provincias", registros: rows.length };
}

/* ---------------- Colegios profesionales ---------------- */

export async function syncColegios(): Promise<SyncResult> {
  const { porNombre } = await contexto();
  type C = { municipio_sede: string; provincia_sede: string };
  const recs = await fetchAll<C>("colegios-profesionales", { select: "municipio_sede,provincia_sede" }, 1000);
  const counts = new Map<string, number>();
  for (const r of recs) inc(counts, porNombre(r.municipio_sede, r.provincia_sede));
  const ts = now();
  const rows = [...counts].map(([municipio_id, num_colegios_profesionales]) => ({
    municipio_id,
    num_colegios_profesionales,
    updated_at: ts,
  }));
  await upsertChunks("colegios_profesionales_municipio", rows, "municipio_id");
  await logSync("colegios_profesionales", rows.length);
  return { fuente: "colegios_profesionales", registros: rows.length };
}

/* ---------------- Servicios sociales ---------------- */

export async function syncSociales(): Promise<SyncResult> {
  const { porNombre, ine } = await contexto();
  const centros = new Map<string, number>();
  const servicios = new Map<string, number>();
  const proximidad = new Map<string, number>();
  const donacion = new Map<string, number>();

  type A = { codigo_municipioine: string | null; localidad: string; provincia: string };
  for (const r of await fetchAll<A>("centros-de-caracter-social", {
    select: "codigo_municipioine,localidad,provincia",
  }, 5000)) {
    inc(centros, ine(r.codigo_municipioine) ?? porNombre(r.localidad, r.provincia));
  }

  type B = { codigo_municipio_ine: string | null; localidad: string; provincia: string };
  for (const r of await fetchAll<B>("servicios-de-caracter-social", {
    select: "codigo_municipio_ine,localidad,provincia",
  }, 12000)) {
    inc(servicios, ine(r.codigo_municipio_ine) ?? porNombre(r.localidad, r.provincia));
  }

  type P = { municipio: string; provincia: string };
  for (const r of await fetchAll<P>("servicios-proximidad", { select: "municipio,provincia" }, 10000)) {
    inc(proximidad, porNombre(r.municipio, r.provincia));
  }

  type D = { localidad: string; geolocalizacion: Punto };
  for (const r of await fetchAll<D>("puntos-fijos-donacion", { select: "localidad,geolocalizacion" }, 100)) {
    inc(donacion, porNombre(r.localidad) ?? (await municipioPorPunto(r.geolocalizacion)));
  }

  const ts = now();
  const ids = new Set([...centros.keys(), ...servicios.keys(), ...proximidad.keys(), ...donacion.keys()]);
  const rows = [...ids].map((municipio_id) => ({
    municipio_id,
    num_centros_caracter_social: centros.get(municipio_id) ?? 0,
    num_servicios_caracter_social: servicios.get(municipio_id) ?? 0,
    num_servicios_proximidad: proximidad.get(municipio_id) ?? 0,
    num_puntos_donacion: donacion.get(municipio_id) ?? 0,
    updated_at: ts,
  }));
  await upsertChunks("servicios_sociales", rows, "municipio_id");
  await logSync("servicios_sociales", rows.length);
  return { fuente: "servicios_sociales", registros: rows.length };
}

/* ---------------- Movilidad y vehículos ---------------- */

export async function syncMovilidad(): Promise<SyncResult> {
  const { porNombre } = await contexto();
  const itv = new Map<string, number>();
  const recarga = new Map<string, number>();

  type I = { localidad: string; provincia: string };
  for (const r of await fetchAll<I>("centros-de-inspeccion-tecnica-de-vehiculos-en-castilla-y-leon", {
    select: "localidad,provincia",
  }, 200)) {
    inc(itv, porNombre(r.localidad, r.provincia));
  }

  type R = { dd: Punto };
  for (const r of await fetchAll<R>("puntos-de-recarga-del-vehiculo-electrico", { select: "dd" }, 500)) {
    inc(recarga, await municipioPorPunto(r.dd));
  }

  const ts = now();
  const ids = new Set([...itv.keys(), ...recarga.keys()]);
  const rows = [...ids].map((municipio_id) => ({
    municipio_id,
    num_centros_itv: itv.get(municipio_id) ?? 0,
    num_puntos_recarga_electrica: recarga.get(municipio_id) ?? 0,
    updated_at: ts,
  }));
  await upsertChunks("servicios_movilidad_vehiculos", rows, "municipio_id");
  await logSync("movilidad_vehiculos", rows.length);
  return { fuente: "movilidad_vehiculos", registros: rows.length };
}

/* ---------------- Ampliación de salud: farmacias, zona básica y centro de referencia ---------------- */

export async function syncSaludAmpliada(): Promise<SyncResult> {
  const { porNombre } = await contexto();

  type F = { municipio: string; provincia: string; localidad: string };
  const farmacias = new Map<string, number>();
  for (const r of await fetchAll<F>("registro-de-establecimientos-farmaceuticos-de-castilla-y-leon", {
    select: "municipio,provincia,localidad",
  }, 3000)) {
    inc(farmacias, porNombre(r.municipio, r.provincia) ?? porNombre(r.localidad, r.provincia));
  }

  type Z = { municipio: string; provincia: string; d_zbs: string };
  const zona = new Map<string, string>();
  for (const r of await fetchAll<Z>("mapas-de-areas-de-salud-de-castilla-y-leon", {
    select: "municipio,provincia,d_zbs",
  }, 500)) {
    const id = porNombre(r.municipio, r.provincia);
    if (id && r.d_zbs && !zona.has(id)) zona.set(id, r.d_zbs);
  }

  type C = { centro: string; consultorio: string };
  const referencia = new Map<string, string>();
  for (const r of await fetchAll<C>("dependencia-entre-consultorios-y-centros-de-salud", {
    select: "centro,consultorio",
  }, 5000)) {
    const id = porNombre(r.consultorio);
    if (id && r.centro && !referencia.has(id)) referencia.set(id, r.centro);
  }

  // Enriquecer sin destruir los contadores ya sincronizados de servicios_salud.
  const { data: existentes } = await supabaseAdmin
    .from("servicios_salud")
    .select("municipio_id, num_centros_salud, num_hospitales_consultorios");
  const previos = new Map(
    ((existentes ?? []) as { municipio_id: string; num_centros_salud: number; num_hospitales_consultorios: number }[]).map(
      (r) => [r.municipio_id, r],
    ),
  );

  const ts = now();
  const ids = new Set([...farmacias.keys(), ...zona.keys(), ...referencia.keys(), ...previos.keys()]);
  const rows = [...ids].map((municipio_id) => ({
    municipio_id,
    num_centros_salud: previos.get(municipio_id)?.num_centros_salud ?? 0,
    num_hospitales_consultorios: previos.get(municipio_id)?.num_hospitales_consultorios ?? 0,
    num_farmacias: farmacias.get(municipio_id) ?? 0,
    area_salud: zona.get(municipio_id) ?? null,
    centro_salud_referencia: referencia.get(municipio_id) ?? null,
    updated_at: ts,
  }));
  await upsertChunks("servicios_salud", rows, "municipio_id");
  await logSync("salud_ampliada", rows.length);
  return { fuente: "salud_ampliada", registros: rows.length };
}

export const SYNC_TASKS_EXTRA: Record<string, () => Promise<SyncResult>> = {
  limites: syncLimites,
  cultura: syncCultura,
  comercio: syncComercio,
  paro: syncParoProvincias,
  colegios: syncColegios,
  sociales: syncSociales,
  movilidad: syncMovilidad,
  "salud-ampliada": syncSaludAmpliada,
};