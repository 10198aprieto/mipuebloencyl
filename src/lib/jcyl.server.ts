// Sincronización con la API pública de la Junta de Castilla y León (Opendatasoft).
// Correspondencia de campos confirmada contra /catalog/datasets/{id} el 2026-08-02:
//
//  registro-de-municipios-de-castilla-y-leon  -> municipio, cod_ine, cod_municipio, provincia, latitud, longitud, poblacion
//  directorio-de-centros-docentes             -> municipio, provincia, situacion
//  centros-de-salud-municipios                -> municipio, nombre_centro_salud   (único con municipio explícito)
//  registro-de-centros-sanitarios…            -> localidad + provincia (SIN municipio) + tipo_de_centro
//  estaciones-de-autobuses                    -> municipios, provincia, geolocalizacion {lat,lon}
//  estaciones-de-control-de-la-calidad-del-aire -> estacion, provincia, lat, long, operativa
//  calidad-del-aire-datos-historicos-diarios  -> estacion, fecha, pm10_ug_m3, no2_ug_m3 …
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE = "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets";

export type SyncResult = { fuente: string; registros: number };

/** Pagina con limit=100 / offset hasta agotar el dataset. */
export async function fetchAll<T>(
  dataset: string,
  params: Record<string, string> = {},
  maxRecords = 20000,
): Promise<T[]> {
  const out: T[] = [];
  let offset = 0;
  for (;;) {
    const qs = new URLSearchParams({ ...params, limit: "100", offset: String(offset) });
    const res = await fetch(`${BASE}/${dataset}/records?${qs.toString()}`);
    if (!res.ok) throw new Error(`${dataset}: HTTP ${res.status}`);
    const json = (await res.json()) as { total_count: number; results: T[] };
    out.push(...json.results);
    offset += 100;
    if (json.results.length < 100 || offset >= json.total_count || out.length >= maxRecords) break;
  }
  return out;
}

export function norm(t: string | null | undefined): string {
  return (t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export async function logSync(fuente: string, registros: number, ok = true, mensaje?: string) {
  await supabaseAdmin
    .from("sync_log")
    .upsert(
      { fuente, registros, ok, mensaje: mensaje ?? null, ejecutado_en: new Date().toISOString() },
      { onConflict: "fuente" },
    );
}

export type MunicipioRow = { id: string; cod_ine: number; nombre_norm: string; provincia_norm: string };

export async function loadMunicipios(): Promise<MunicipioRow[]> {
  const rows: MunicipioRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from("municipios")
      .select("id, cod_ine, nombre_norm, provincia_norm")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as MunicipioRow[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export function indexMunicipios(rows: MunicipioRow[]) {
  const byNameProv = new Map<string, string>();
  const byName = new Map<string, string | null>();
  for (const m of rows) {
    byNameProv.set(`${m.nombre_norm}|${m.provincia_norm}`, m.id);
    byName.set(m.nombre_norm, byName.has(m.nombre_norm) ? null : m.id);
  }
  return (nombre: string, provincia?: string) => {
    const n = norm(nombre);
    if (provincia) {
      const hit = byNameProv.get(`${n}|${norm(provincia)}`);
      if (hit) return hit;
    }
    return byName.get(n) ?? null;
  };
}

export async function upsertChunks(table: string, rows: unknown[], onConflict: string) {
  const client = supabaseAdmin as unknown as {
    from: (t: string) => {
      upsert: (r: unknown, o: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
    };
  };
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await client.from(table).upsert(rows.slice(i, i + 500), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

/* ------------------------------------------------------------------ */

export async function syncMunicipios(): Promise<SyncResult> {
  type R = {
    municipio: string; cod_municipio: string | null; provincia: string; cod_provincia: string | null;
    cod_ine: number | null; poblacion: number | null; latitud: number | null; longitud: number | null;
  };
  const recs = await fetchAll<R>("registro-de-municipios-de-castilla-y-leon");
  const rows = recs
    .filter((r) => r.cod_ine != null && r.municipio)
    .map((r) => ({
      cod_ine: r.cod_ine as number,
      cod_municipio: r.cod_municipio,
      nombre: r.municipio,
      provincia: r.provincia,
      cod_provincia: r.cod_provincia,
      latitud: r.latitud,
      longitud: r.longitud,
      poblacion: r.poblacion,
      updated_at: new Date().toISOString(),
    }));
  await upsertChunks("municipios", rows, "cod_ine");
  await logSync("municipios", rows.length);
  return { fuente: "municipios", registros: rows.length };
}

export async function syncEducacion(): Promise<SyncResult> {
  type R = { municipio: string; provincia: string; situacion: string | null };
  const recs = await fetchAll<R>("directorio-de-centros-docentes", {
    select: "municipio,provincia,situacion",
  });
  const lookup = indexMunicipios(await loadMunicipios());
  const counts = new Map<string, number>();
  for (const r of recs) {
    if (r.situacion && norm(r.situacion) !== "ALTA") continue;
    const id = lookup(r.municipio, r.provincia);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const now = new Date().toISOString();
  const rows = [...counts].map(([municipio_id, num_centros]) => ({ municipio_id, num_centros, updated_at: now }));
  await upsertChunks("servicios_educacion", rows, "municipio_id");
  await logSync("educacion", rows.length);
  return { fuente: "educacion", registros: rows.length };
}

export async function syncSalud(): Promise<SyncResult> {
  const lookup = indexMunicipios(await loadMunicipios());

  // Fuente A: centros-de-salud-municipios (municipio explícito) -> centros de salud
  type A = { municipio: string; nombre_centro_salud: string };
  const centros = await fetchAll<A>("centros-de-salud-municipios", {
    select: "municipio,nombre_centro_salud",
  });
  const salud = new Map<string, Set<string>>();
  for (const r of centros) {
    const id = lookup(r.municipio);
    if (!id) continue;
    if (!salud.has(id)) salud.set(id, new Set());
    salud.get(id)!.add(norm(r.nombre_centro_salud));
  }

  // Fuente B: registro de centros sanitarios (sin municipio; se cruza localidad+provincia)
  type B = { localidad: string; provincia: string; tipo_de_centro: string };
  const sanitarios = await fetchAll<B>("registro-de-centros-sanitarios-de-castilla-y-leon", {
    select: "localidad,provincia,tipo_de_centro",
    where:
      'startswith(tipo_de_centro,"CONSULTORIOS DE ATENCION PRIMARIA") or startswith(tipo_de_centro,"CENTROS DE ATENCION PRIMARIA") or startswith(tipo_de_centro,"HOSPITAL")',
  });
  const hosp = new Map<string, number>();
  for (const r of sanitarios) {
    const id = lookup(r.localidad, r.provincia);
    if (id) hosp.set(id, (hosp.get(id) ?? 0) + 1);
  }

  const now = new Date().toISOString();
  const ids = new Set([...salud.keys(), ...hosp.keys()]);
  const rows = [...ids].map((municipio_id) => ({
    municipio_id,
    num_centros_salud: salud.get(municipio_id)?.size ?? 0,
    num_hospitales_consultorios: hosp.get(municipio_id) ?? 0,
    updated_at: now,
  }));
  await upsertChunks("servicios_salud", rows, "municipio_id");
  await logSync("salud", rows.length);
  return { fuente: "salud", registros: rows.length };
}

export async function syncTransporte(): Promise<SyncResult> {
  type R = {
    municipios: string; provincia: string; direccion: string | null;
    geolocalizacion: { lat: number; lon: number } | null;
  };
  const recs = await fetchAll<R>("estaciones-de-autobuses");
  const now = new Date().toISOString();
  const rows = recs
    .filter((r) => r.geolocalizacion)
    .map((r) => ({
      nombre: r.municipios,
      provincia: r.provincia,
      direccion: r.direccion,
      latitud: r.geolocalizacion!.lat,
      longitud: r.geolocalizacion!.lon,
      updated_at: now,
    }));
  await upsertChunks("estaciones_autobus", rows, "nombre,provincia");
  // El dataset solo cubre municipios > 5.000 hab.: el indicador es la distancia
  // PostGIS a la estación más próxima, no la presencia en el propio municipio.
  const { data, error } = await supabaseAdmin.rpc("calcular_transporte");
  if (error) throw error;
  await logSync("transporte", (data as number) ?? 0);
  return { fuente: "transporte", registros: (data as number) ?? 0 };
}

export async function syncCalidadAire(): Promise<SyncResult> {
  type E = { estacion: string; provincia: string; localizacion: string | null; lat: number | null; long: number | null; operativa: string | null };
  const estaciones = await fetchAll<E>("estaciones-de-control-de-la-calidad-del-aire");

  // Último dato diario disponible por estación (PM10, con NO2 como alternativa).
  type D = { estacion: string; fecha: string; pm10_ug_m3: number | null; no2_ug_m3: number | null };
  const diarios = await fetchAll<D>(
    "calidad-del-aire-datos-historicos-diarios",
    { select: "estacion,fecha,pm10_ug_m3,no2_ug_m3", order_by: "fecha desc" },
    1500,
  );
  const ultimo = new Map<string, { valor: number; contaminante: string; fecha: string }>();
  for (const d of diarios) {
    const key = norm(d.estacion);
    if (ultimo.has(key)) continue;
    if (d.pm10_ug_m3 != null) ultimo.set(key, { valor: d.pm10_ug_m3, contaminante: "PM10 (µg/m³)", fecha: d.fecha });
    else if (d.no2_ug_m3 != null) ultimo.set(key, { valor: d.no2_ug_m3, contaminante: "NO₂ (µg/m³)", fecha: d.fecha });
  }

  const now = new Date().toISOString();
  const rows = estaciones
    .filter((e) => e.lat != null && e.long != null)
    .map((e) => {
      const u = ultimo.get(norm(e.estacion));
      return {
        nombre: e.estacion,
        provincia: e.provincia,
        localizacion: e.localizacion,
        operativa: norm(e.operativa) === "SI",
        latitud: e.lat as number,
        longitud: e.long as number,
        ultimo_valor: u?.valor ?? null,
        contaminante: u?.contaminante ?? null,
        fecha_dato: u?.fecha ?? null,
        updated_at: now,
      };
    });
  await upsertChunks("estaciones_aire", rows, "nombre");
  const { data, error } = await supabaseAdmin.rpc("calcular_calidad_aire");
  if (error) throw error;
  await logSync("calidad_aire", (data as number) ?? 0);
  return { fuente: "calidad_aire", registros: (data as number) ?? 0 };
}

export async function recalcularIndice(): Promise<SyncResult> {
  const { data, error } = await supabaseAdmin.rpc("recalcular_indice_servicios");
  if (error) throw error;
  await logSync("indice", (data as number) ?? 0);
  return { fuente: "indice", registros: (data as number) ?? 0 };
}

export const SYNC_TASKS: Record<string, () => Promise<SyncResult>> = {
  municipios: syncMunicipios,
  educacion: syncEducacion,
  salud: syncSalud,
  transporte: syncTransporte,
  aire: syncCalidadAire,
  indice: recalcularIndice,
};

export async function syncTodo(): Promise<SyncResult[]> {
  const out: SyncResult[] = [];
  for (const key of ["municipios", "educacion", "salud", "transporte", "aire", "indice"]) {
    out.push(await SYNC_TASKS[key]!());
  }
  return out;
}