import { createFileRoute } from "@tanstack/react-router";

const NIVELES: Array<{ min: number; etiqueta: string; color: string }> = [
  { min: 65, etiqueta: "Muy buena", color: "#2f9e5e" },
  { min: 50, etiqueta: "Buena", color: "#7fbe3f" },
  { min: 38, etiqueta: "Intermedia", color: "#e0a72a" },
  { min: 28, etiqueta: "Limitada", color: "#e07a2a" },
  { min: -1, etiqueta: "Muy limitada", color: "#cf4a2c" },
];

function escapar(t: string) {
  return t.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c);
}

export const Route = createFileRoute("/api/og/$codIne")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const codIne = Number(params.codIne);
        if (!Number.isFinite(codIne)) return new Response("Código INE no válido", { status: 400 });

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return new Response("Configuración no disponible", { status: 500 });

        const res = await fetch(
          `${url}/rest/v1/vista_municipios?select=nombre,provincia,indice_calculado,updated_at&cod_ine=eq.${codIne}&limit=1`,
          { headers: { apikey: key } },
        );
        const filas = (await res.json()) as Array<{
          nombre: string;
          provincia: string;
          indice_calculado: number | null;
          updated_at?: string | null;
        }>;
        const m = filas[0];
        if (!m) return new Response("Municipio no encontrado", { status: 404 });

        const indice = m.indice_calculado ?? 0;
        const nivel = NIVELES.find((n) => indice >= n.min)!;

        const html = `
          <div style="display:flex;flex-direction:column;justify-content:space-between;width:1200px;height:630px;padding:72px;background:#fbf9f5;font-family:sans-serif;">
            <div style="display:flex;flex-direction:column;">
              <div style="display:flex;font-size:26px;letter-spacing:6px;color:#6b6357;text-transform:uppercase;">Provincia de ${escapar(m.provincia)}</div>
              <div style="display:flex;font-size:96px;color:#1f1b16;margin-top:12px;">${escapar(m.nombre)}</div>
            </div>
            <div style="display:flex;align-items:flex-end;justify-content:space-between;">
              <div style="display:flex;flex-direction:column;">
                <div style="display:flex;font-size:28px;color:#6b6357;">Índice de servicios públicos</div>
                <div style="display:flex;align-items:flex-end;">
                  <div style="display:flex;font-size:150px;color:${nivel.color};line-height:1;">${indice.toLocaleString("es-ES", { maximumFractionDigits: 1 })}</div>
                  <div style="display:flex;font-size:44px;color:#6b6357;margin-left:10px;margin-bottom:16px;">/100</div>
                </div>
                <div style="display:flex;font-size:40px;color:${nivel.color};">Cobertura ${nivel.etiqueta.toLowerCase()}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;">
                <div style="display:flex;font-size:38px;color:#1f1b16;">MiPuebloEnCyL</div>
                <div style="display:flex;font-size:24px;color:#6b6357;">datosabiertos.jcyl.es</div>
              </div>
            </div>
          </div>`;

        // La sincronización es mensual: cacheamos la imagen un día en CDN.
        const cache = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";
        try {
          const { ImageResponse } = await import("workers-og");
          return new ImageResponse(html, { width: 1200, height: 630, headers: { "cache-control": cache } });
        } catch (e) {
          console.error("[og] generación PNG no disponible, se sirve SVG:", e);
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
            <rect width="1200" height="630" fill="#fbf9f5"/>
            <text x="72" y="140" font-family="sans-serif" font-size="26" letter-spacing="6" fill="#6b6357">PROVINCIA DE ${escapar(m.provincia.toUpperCase())}</text>
            <text x="72" y="240" font-family="sans-serif" font-size="90" fill="#1f1b16">${escapar(m.nombre)}</text>
            <text x="72" y="420" font-family="sans-serif" font-size="28" fill="#6b6357">Índice de servicios públicos</text>
            <text x="72" y="540" font-family="sans-serif" font-size="140" fill="${nivel.color}">${indice.toLocaleString("es-ES", { maximumFractionDigits: 1 })}<tspan font-size="44" fill="#6b6357">/100 · Cobertura ${nivel.etiqueta.toLowerCase()}</tspan></text>
            <text x="1128" y="560" text-anchor="end" font-family="sans-serif" font-size="34" fill="#1f1b16">MiPuebloEnCyL · datosabiertos.jcyl.es</text>
          </svg>`;
          return new Response(svg, {
            headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": cache },
          });
        }
      },
    },
  },
});