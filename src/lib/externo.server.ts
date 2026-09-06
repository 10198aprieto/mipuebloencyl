// Importación complementaria desde fuentes externas al portal de la Junta de CyL.
// Correspondencia de campos confirmada contra las APIs reales el 2026-09-05:
//
//  INE Tempus3 · Censo Agrario (operación 90, tabla 29006 "Resultados municipales", datos 2009)
//    GRUPOS_TABLA/29006           -> grupo 89620 "Municipios" (8.181 valores; Codigo = cod_ine de 5 dígitos)
//    DATOS_TABLA/29006?tv=19:{Id} -> 3 series por municipio: "SAU (ha.)", "Unidades ganaderas totales", "Explotaciones"
//    (ni ?nult=1 ni ?g1=… devuelven datos en esta tabla; el único filtro que funciona es tv=19:{Id})
//
//  IGN/CNIG API-Features · colección "nuc" (Núcleos de población, act. 2025-10)
//    /collections/nuc/items?cpro={provincia} -> codine (11 dígitos, los 5 primeros = cod_ine), nombre,
//                                               latitud, longitud, altitud (m), habitantes, capital
//    (se descartó "administrativeunit": trae el límite municipal pero ni altitud ni superficie)
//
//  Wikidata SPARQL (P772 = código INE de municipio)
//    P2046 superficie (km²) · P2044 altitud · P18 imagen · P94 escudo · P1082 población con fecha P585
//
//  Wikimedia Commons · action=query&prop=imageinfo&iiprop=url|extmetadata
//    -> url original, miniatura, LicenseShortName, LicenseUrl, Artist y página de descripción
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logSync, upsertChunks, type SyncResult } from "@/lib/jcyl.server";

const UA = "MiPuebloEnCyL/1.0 (https://mipuebloencyl.lovable.app)";

export type OpcionesImportacion = {
  /** Importar solo este municipio (prueba de mapeo de campos). */
  codIne?: number;
  /** Punto de partida dentro de la lista de municipios, para importar por tandas. */
  desde?: number;
  /** Número máximo de municipios a procesar en esta ejecución. */
  limite?: number;
};

type Muni = { id: string; cod_ine: number; nombre: string; provincia: string };

async function cargarMunicipios(op: OpcionesImportacion = {}): Promise<Muni[]> {
  const filas: Muni[] = [];
  for (let from = 0; ; from += 1000) {
    let q = supabaseAdmin.from("municipios").select("id, cod_ine, nombre, provincia").order("cod_ine");
    if (op.codIne) q = q.eq("cod_ine", op.codIne);
    const { data, error } = await q.range(from, from + 999);
    if (error) throw error;
    filas.push(...((data ?? []) as Muni[]));
    if (!data || data.length < 1000) break;
  }
  const desde = op.desde ?? 0;
  const limite = op.limite ?? filas.length;
  return filas.slice(desde, desde + limite);
}

/** Tolerante a fallos: un error de red en una fuente no interrumpe el resto de municipios. */
async function getJSON<T>(url: string, intentos = 2): Promise<T | null> {
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      if (i === intentos - 1) {
        console.warn(`[externo] fallo en ${url}: ${e instanceof Error ? e.message : String(e)}`);
        return null;
      }
    }
  }
  return null;
}

function lotes<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

const ahora = () => new Date().toISOString();

/* ------------------------------------------------------------------ *
 * 1. IGN / CNIG — coordenadas y altitud oficiales
 * ------------------------------------------------------------------ */

const PROVINCIAS_CYL = [5, 9, 24, 34, 37, 40, 42, 47, 49];

type NucProps = {
  codine: string;
  nombre: string;
  latitud: number;
  longitud: number;
  altitud: number | null;
  habitantes: number | null;
  capital: string | null;
};

/** Núcleo de referencia por municipio: la capital si está marcada, si no el más poblado. */
async function nucleosIGN(): Promise<Map<number, NucProps>> {
  const mejor = new Map<number, NucProps>();
  for (const cpro of PROVINCIAS_CYL) {
    for (let offset = 0; offset < 5000; offset += 500) {
      const url = `https://api-features.ign.es/collections/nuc/items?f=json&limit=500&offset=${offset}&cpro=${cpro}`;
      const json = await getJSON<{ features?: Array<{ properties: NucProps }> }>(url);
      const feats = json?.features ?? [];
      for (const f of feats) {
        const p = f.properties;
        const cod = Number(String(p.codine ?? "").slice(0, 5));
        if (!cod) continue;
        const actual = mejor.get(cod);
        const esCapital = (p.capital ?? "000000") !== "000000";
        const eraCapital = actual ? (actual.capital ?? "000000") !== "000000" : false;
        if (
          !actual ||
          (esCapital && !eraCapital) ||
          (esCapital === eraCapital && (p.habitantes ?? 0) > (actual.habitantes ?? 0))
        ) {
          mejor.set(cod, p);
        }
      }
      if (feats.length < 500) break;
    }
  }
  return mejor;
}

export async function importarGeografiaIGN(op: OpcionesImportacion = {}): Promise<SyncResult> {
  const municipios = await cargarMunicipios(op);
  const nucleos = await nucleosIGN();
  const filas = municipios.flatMap((m) => {
    const n = nucleos.get(m.cod_ine);
    if (!n) return [];
    return [
      {
        municipio_id: m.id,
        cod_ine: m.cod_ine,
        latitud: n.latitud ?? null,
        longitud: n.longitud ?? null,
        altitud_m: n.altitud ?? null,
        nucleo_referencia: n.nombre ?? null,
        fuente_coordenadas: "IGN/CNIG · API-Features (nuc)",
        fuente_altitud: "IGN/CNIG · API-Features (nuc)",
        updated_at: ahora(),
      },
    ];
  });
  await upsertChunks("municipio_geografia", filas, "municipio_id");
  await logSync("geografia_ign", filas.length);
  return { fuente: "geografia_ign", registros: filas.length };
}

/* ------------------------------------------------------------------ *
 * 2. Wikidata — superficie (y altitud de respaldo)
 * ------------------------------------------------------------------ */

type Binding = Record<string, { value: string } | undefined>;

async function sparql(query: string): Promise<Binding[]> {
  try {
    const res = await fetch("https://query.wikidata.org/sparql", {
      method: "POST",
      headers: {
        "User-Agent": UA,
        Accept: "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ query }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { results?: { bindings?: Binding[] } };
    return json.results?.bindings ?? [];
  } catch (e) {
    console.warn(`[externo] Wikidata: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

function valoresINE(municipios: Muni[]) {
  return municipios.map((m) => `"${String(m.cod_ine).padStart(5, "0")}"`).join(" ");
}

export async function importarGeografiaWikidata(op: OpcionesImportacion = {}): Promise<SyncResult> {
  const municipios = await cargarMunicipios(op);
  const porCod = new Map(municipios.map((m) => [m.cod_ine, m]));

  // Altitudes ya obtenidas del IGN: Wikidata solo rellena los huecos.
  const { data: existentes } = await supabaseAdmin
    .from("municipio_geografia")
    .select("cod_ine, altitud_m")
    .in("cod_ine", municipios.map((m) => m.cod_ine));
  const conAltitud = new Set(
    ((existentes ?? []) as Array<{ cod_ine: number; altitud_m: number | null }>)
      .filter((r) => r.altitud_m !== null)
      .map((r) => r.cod_ine),
  );

  let total = 0;
  for (const lote of lotes(municipios, 150)) {
    const bindings = await sparql(`
      SELECT ?ine ?area ?alt WHERE {
        ?m wdt:P772 ?ine . VALUES ?ine { ${valoresINE(lote)} }
        OPTIONAL { ?m wdt:P2046 ?area }
        OPTIONAL { ?m wdt:P2044 ?alt }
      }`);
    const filas: Record<string, unknown>[] = [];
    for (const b of bindings) {
      const cod = Number(b["ine"]?.value);
      const m = porCod.get(cod);
      if (!m) continue;
      const superficie = b["area"]?.value ? Number(b["area"].value) : null;
      const altitud = b["alt"]?.value ? Number(b["alt"].value) : null;
      const rellenarAltitud = altitud !== null && !conAltitud.has(cod);
      if (superficie === null && !rellenarAltitud) continue;
      filas.push({
        municipio_id: m.id,
        cod_ine: cod,
        ...(superficie !== null
          ? { superficie_km2: superficie, fuente_superficie: "Wikidata (P2046)" }
          : {}),
        ...(rellenarAltitud ? { altitud_m: altitud, fuente_altitud: "Wikidata (P2044)" } : {}),
        updated_at: ahora(),
      });
    }
    await upsertChunks("municipio_geografia", filas, "municipio_id");
    total += filas.length;
  }
  await logSync("geografia_wikidata", total);
  return { fuente: "geografia_wikidata", registros: total };
}

/* ------------------------------------------------------------------ *
 * 3. Población histórica — Wikidata (serie P1082 fechada con P585)
 * ------------------------------------------------------------------ */

export async function importarPoblacionHistorica(op: OpcionesImportacion = {}): Promise<SyncResult> {
  const municipios = await cargarMunicipios(op);
  const porCod = new Map(municipios.map((m) => [m.cod_ine, m]));
  let total = 0;
  for (const lote of lotes(municipios, 60)) {
    const bindings = await sparql(`
      SELECT ?ine ?pop ?fecha WHERE {
        ?m wdt:P772 ?ine . VALUES ?ine { ${valoresINE(lote)} }
        ?m p:P1082 ?st . ?st ps:P1082 ?pop ; pq:P585 ?fecha .
      }`);
    const porClave = new Map<string, Record<string, unknown>>();
    for (const b of bindings) {
      const cod = Number(b["ine"]?.value);
      const m = porCod.get(cod);
      const anyo = Number(String(b["fecha"]?.value ?? "").slice(0, 4));
      const poblacion = Number(b["pop"]?.value);
      if (!m || !anyo || !Number.isFinite(poblacion)) continue;
      porClave.set(`${m.id}|${anyo}`, {
        municipio_id: m.id,
        cod_ine: cod,
        anyo,
        poblacion: Math.round(poblacion),
        fuente: "Wikidata (P1082, series censales del INE)",
        updated_at: ahora(),
      });
    }
    const filas = [...porClave.values()];
    await upsertChunks("municipio_poblacion_historica", filas, "municipio_id,anyo");
    total += filas.length;
  }
  await logSync("poblacion_historica", total);
  return { fuente: "poblacion_historica", registros: total };
}

/* ------------------------------------------------------------------ *
 * 4. Imágenes y escudos — Wikidata (P18/P94) + licencias de Wikimedia Commons
 * ------------------------------------------------------------------ */

function nombreArchivo(url: string): string | null {
  const i = url.indexOf("Special:FilePath/");
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + "Special:FilePath/".length)).replace(/_/g, " ");
}

type ImageInfo = {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string }>;
};

function limpiarHtml(v: string | undefined | null) {
  if (!v) return null;
  const texto = v.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return texto || null;
}

/** Metadatos de licencia y autoría de hasta 50 archivos por petición. */
async function metadatosCommons(archivos: string[]): Promise<Map<string, ImageInfo>> {
  const out = new Map<string, ImageInfo>();
  for (const lote of lotes(archivos, 40)) {
    const qs = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "800",
      titles: lote.map((a) => `File:${a}`).join("|"),
    });
    const json = await getJSON<{
      query?: { pages?: Record<string, { title?: string; imageinfo?: ImageInfo[] }> };
    }>(`https://commons.wikimedia.org/w/api.php?${qs.toString()}`);
    for (const page of Object.values(json?.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      const titulo = (page.title ?? "").replace(/^File:/, "");
      if (info && titulo) out.set(titulo, info);
    }
  }
  return out;
}

export async function importarImagenesCommons(op: OpcionesImportacion = {}): Promise<SyncResult> {
  const municipios = await cargarMunicipios(op);
  const porCod = new Map(municipios.map((m) => [m.cod_ine, m]));
  let total = 0;

  for (const lote of lotes(municipios, 150)) {
    const bindings = await sparql(`
      SELECT ?ine ?img ?escudo WHERE {
        ?m wdt:P772 ?ine . VALUES ?ine { ${valoresINE(lote)} }
        OPTIONAL { ?m wdt:P18 ?img }
        OPTIONAL { ?m wdt:P94 ?escudo }
      }`);

    type Pendiente = { cod: number; tipo: "imagen" | "escudo"; archivo: string };
    const pendientes: Pendiente[] = [];
    for (const b of bindings) {
      const cod = Number(b["ine"]?.value);
      if (!porCod.has(cod)) continue;
      for (const [clave, tipo] of [
        ["img", "imagen"],
        ["escudo", "escudo"],
      ] as const) {
        const url = b[clave]?.value;
        const archivo = url ? nombreArchivo(url) : null;
        if (archivo) pendientes.push({ cod, tipo, archivo });
      }
    }

    const meta = await metadatosCommons([...new Set(pendientes.map((p) => p.archivo))]);
    const filas = new Map<string, Record<string, unknown>>();
    for (const p of pendientes) {
      const m = porCod.get(p.cod)!;
      const info = meta.get(p.archivo);
      if (!info?.url) continue;
      const em = info.extmetadata ?? {};
      filas.set(`${m.id}|${p.tipo}`, {
        municipio_id: m.id,
        cod_ine: p.cod,
        tipo: p.tipo,
        url: info.url.split("?")[0],
        url_thumb: info.thumburl ? info.thumburl.split("?")[0] : null,
        archivo: p.archivo,
        pagina_descripcion: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.archivo)}`,
        licencia: limpiarHtml(em["LicenseShortName"]?.value),
        licencia_url: em["LicenseUrl"]?.value ?? null,
        autor: limpiarHtml(em["Artist"]?.value),
        fuente: "Wikidata + Wikimedia Commons",
        updated_at: ahora(),
      });
    }
    const arr = [...filas.values()];
    await upsertChunks("municipio_imagenes", arr, "municipio_id,tipo");
    total += arr.length;
  }
  await logSync("imagenes_commons", total);
  return { fuente: "imagenes_commons", registros: total };
}

/* ------------------------------------------------------------------ *
 * 5. Censo Agrario del INE — explotaciones, SAU y unidades ganaderas
 * ------------------------------------------------------------------ */

type ValorGrupo = { Id: number; Codigo: string };
type SerieINE = { Nombre: string; Data?: Array<{ Anyo: number; Valor: number | null }> };

let cacheIdsINE: Map<string, number> | null = null;

async function idsMunicipioINE(): Promise<Map<string, number>> {
  if (cacheIdsINE) return cacheIdsINE;
  const json = await getJSON<ValorGrupo[]>(
    "https://servicios.ine.es/wstempus/js/ES/VALORES_GRUPOSTABLA/29006/89620",
  );
  const mapa = new Map<string, number>();
  for (const v of json ?? []) if (v.Codigo?.length === 5) mapa.set(v.Codigo, v.Id);
  cacheIdsINE = mapa;
  return mapa;
}

export async function importarAgroINE(op: OpcionesImportacion = {}): Promise<SyncResult> {
  // Por defecto, tandas de 250 municipios: el INE exige una petición por municipio.
  const municipios = await cargarMunicipios({ ...op, limite: op.limite ?? (op.codIne ? undefined : 250) });
  const ids = await idsMunicipioINE();
  const filas: Record<string, unknown>[] = [];

  for (const m of municipios) {
    const idINE = ids.get(String(m.cod_ine).padStart(5, "0"));
    if (!idINE) continue;
    const series = await getJSON<SerieINE[]>(
      `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/29006?tv=19:${idINE}`,
    );
    if (!series?.length) continue;
    let anyo: number | null = null;
    const valor = (prefijo: string) => {
      const s = series.find((x) => x.Nombre?.startsWith(prefijo));
      const d = s?.Data?.[0];
      if (!d || d.Valor === null || d.Valor === undefined) return null;
      anyo = d.Anyo ?? anyo;
      return d.Valor;
    };
    const sau = valor("SAU");
    const ug = valor("Unidades ganaderas");
    const expl = valor("Explotaciones");
    if (sau === null && ug === null && expl === null) continue;
    filas.push({
      municipio_id: m.id,
      cod_ine: m.cod_ine,
      anyo,
      explotaciones: expl,
      sau_hectareas: sau,
      unidades_ganaderas: ug,
      fuente: "INE · Censo Agrario (tabla 29006)",
      updated_at: ahora(),
    });
  }

  await upsertChunks("municipio_agro", filas, "municipio_id");
  await logSync("agro_ine", filas.length);
  return { fuente: "agro_ine", registros: filas.length };
}

/* ------------------------------------------------------------------ */

export const SYNC_TASKS_EXTERNO: Record<string, (op?: OpcionesImportacion) => Promise<SyncResult>> = {
  geografia_ign: importarGeografiaIGN,
  geografia_wikidata: importarGeografiaWikidata,
  poblacion_historica: importarPoblacionHistorica,
  imagenes_commons: importarImagenesCommons,
  agro_ine: importarAgroINE,
};
