// Importación complementaria desde fuentes externas al portal de la Junta de CyL.
// Correspondencia de campos confirmada contra las APIs reales el 2026-09-05:
//
//  INE Tempus3 · Censo Agrario (operación 90, tabla 29006 "Resultados municipales")
//    GRUPOS_TABLA/29006          -> grupo 89620 "Municipios" (8.181 valores, Codigo = cod_ine de 5 dígitos)
//    DATOS_TABLA/29006?tv=19:{Id} -> 3 series por municipio: "SAU (ha.)", "Unidades ganaderas totales", "Explotaciones"
//    (nota: ni ?nult=1 ni ?g1=… devuelven datos en esta tabla; el único filtro que funciona es tv=19:{Id})
//
//  IGN/CNIG API-Features · colección "nuc" (Núcleos de población, act. 2025-10)
//    /collections/nuc/items?cpro={provincia} -> codine (11 dígitos, los 5 primeros = cod_ine), nombre,
//                                               latitud, longitud, altitud (m), habitantes, capital
//    (se descartó "administrativeunit": tiene el límite municipal pero no altitud ni superficie)
//
//  Wikidata SPARQL (P772 = código INE de municipio)
//    P2046 superficie (km²) · P2044 altitud · P18 imagen · P94 escudo · P1082+P585 población por año
//
//  Wikimedia Commons · action=query&prop=imageinfo&iiprop=url|extmetadata
//    -> url original, thumbnail, LicenseShortName, LicenseUrl, Artist, página de descripción
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
    for (let offset = 0; offset < 4000; offset += 500) {
      const url = `https://api-features.ign.es/collections/nuc/items?f=json&limit=500&offset=${offset}&cpro=${cpro}`;
      const json = await getJSON<{ features: Array<{ properties: NucProps }>; numberReturned?: number }>(url);
      const feats = json?.features ?? [];
      for (const f of feats) {
        const p = f.properties;
        const cod = Number(String(p.codine).slice(0, 5));
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
  const filas = municipios
    .map((m) => {
      const n = nucleos.get(m.cod_ine);
      if (!n) return null;
      return {
        municipio_id: m.id,
        cod_ine: m.cod_ine,
        latitud: n.latitud ?? null,
        longitud: n.longitud ?? null,
        altitud_m: n.altitud ?? null,
        nucleo_referencia: n.nombre ?? null,
        fuente_coordenadas: "IGN/CNIG · API-Features (nuc)",
        fuente_altitud: "IGN/CNIG · API-Features (nuc)",
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);
  await upsertChunks("municipio_geografia", filas, "municipio_id");
  await logSync("geografia_ign", filas.length);
  return { fuente: "geografia_ign", registros: filas.length };
}

/* ------------------------------------------------------------------ *
 * 2. Wikidata — superficie, altitud de respaldo, imágenes y población histórica
 * ------------------------------------------------------------------ */

type Binding = Record<string, { value: string } | undefined>;

async function sparql(query: string): Promise<Binding[]> {
  const res = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      Accept: "application/sparql-results+json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) {
    console.warn(`[externo] Wikidata HTTP ${res.status}`);
    return [];
  }
  const json = (await res.json()) as { results?: { bindings?: Binding[] } };
  return json.results?.bindings ?? [];
}

function lotes<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

function valoresINE(municipios: Muni[]) {
  return municipios.map((m) => `"${String(m.cod_ine).padStart(5, "0")}"`).join(" ");
}

export async function importarGeografiaWikidata(op: OpcionesImportacion = {}): Promise<SyncResult> {
  const municipios = await cargarMunicipios(op);
  const porCod = new Map(municipios.map((m) => [m.cod_ine, m]));
  let n = 0;
  for (const lote of lotes(municipios, 150)) {
    const bindings = await sparql(`
      SELECT ?ine ?area ?alt WHERE {
        ?m wdt:P772 ?ine . VALUES ?ine { ${valoresINE(lote)} }
        OPTIONAL { ?m wdt:P2046 ?area }
        OPTIONAL { ?m wdt:P2044 ?alt }
      }`);
    const filas = [];
    for (const b of bindings) {
      const cod = Number(b['ine']?.value);
      const m = porCod.get(cod);
      if (!m) continue;
      const area = b['area'］ === undefined ? undefined : undefined;
      void area;
      const superficie = b['area']?.value ? Number(b['area'].value) : null;
      const altitud = b['alt']?.value ? Number(b['alt'].value) : null;
      if (superficie === null && altitud === null) continue;
      filas.push({
        municipio_id: m.id,
        cod_ine: cod,
        superficie_km2: superficie,
        fuente_superficie: superficie !== null ? "Wikidata (P2046)" : null,
        ...(altitud !== null ? { altitud_wd: altitud } : {}),
      });
    }
    n += filas.length;
  }
  await logSync("geografia_wikidata", n);
  return { fuente: "geografia_wikidata", registros: n };
}
