import { createFileRoute } from "@tanstack/react-router";

function escapar(t: string) {
  return t.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c);
}

type Fila = {
  nombre: string;
  provincia: string;
  poblacion: number | null;
  indice_calculado: number | null;
  num_farmacias: number | null;
  distancia_bus_km: number | null;
  num_museos: number | null;
  num_bibliotecas_bibliobuses: number | null;
};

// Tarjeta "wrapped" para compartir en redes: /api/og/wrapped/{cod_ine}
export const Route = createFileRoute("/api/og/wrapped/$codIne")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const codIne = Number(params.codIne);
        if (!Number.isFinite(codIne)) return new Response("Código INE no válido", { status: 400 });

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return new Response("Configuración no disponible", { status: 500 });

        const cols =
          "nombre,provincia,poblacion,indice_calculado,num_farmacias,distancia_bus_km,num_museos,num_bibliotecas_bibliobuses";
        const res = await fetch(`${url}/rest/v1/vista_municipios?select=${cols}&cod_ine=eq.${codIne}&limit=1`, {
          headers: { apikey: key },
        });
        const m = ((await res.json()) as Fila[])[0];
        if (!m) return new Response("Municipio no encontrado", { status: 404 });

        const num = (n: number | null | undefined, d = 0) =>
          n === null || n === undefined ? "s/d" : n.toLocaleString("es-ES", { maximumFractionDigits: d });

        const frases: string[] = [
          `Índice de servicios: ${num(m.indice_calculado, 1)}/100`,
          m.num_farmacias && m.num_farmacias > 0
            ? `${num(m.num_farmacias)} farmacia${m.num_farmacias === 1 ? "" : "s"} en el municipio`
            : "Sin farmacia dentro del municipio",
          `Estación de autobuses a ${num(m.distancia_bus_km, 1)} km`,
          `${num((m.num_museos ?? 0) + (m.num_bibliotecas_bibliobuses ?? 0))} museos y bibliotecas`,
        ];

        const tarjetas = frases
          .map(
            (f) =>
              `<div style="display:flex;background:#ffffff22;border-radius:22px;padding:20px 26px;font-size:34px;color:#fdfaf4;margin-bottom:14px;">${escapar(f)}</div>`,
          )
          .join("");

        const html = `
          <div style="display:flex;flex-direction:column;width:1200px;height:630px;padding:60px;background:#2f5d3a;font-family:sans-serif;">
            <div style="display:flex;font-size:24px;letter-spacing:7px;color:#cfe3d3;text-transform:uppercase;">Tu pueblo en 4 datos · Provincia de ${escapar(m.provincia)}</div>
            <div style="display:flex;font-size:78px;color:#fdfaf4;margin:8px 0 24px 0;">${escapar(m.nombre)}</div>
            <div style="display:flex;flex-direction:column;">${tarjetas}</div>
            <div style="display:flex;justify-content:space-between;font-size:24px;color:#cfe3d3;">
              <div style="display:flex;">MiPuebloEnCyL</div>
              <div style="display:flex;">Datos abiertos de la Junta de Castilla y León</div>
            </div>
          </div>`;

        const cache = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";
        try {
          const { ImageResponse } = await import("workers-og");
          return new ImageResponse(html, { width: 1200, height: 630, headers: { "cache-control": cache } });
        } catch (e) {
          console.error("[og-wrapped] generación PNG no disponible, se sirve SVG:", e);
          const lineas = frases
            .map(
              (f, i) =>
                `<text x="64" y="${300 + i * 70}" font-family="sans-serif" font-size="38" fill="#fdfaf4">${escapar(f)}</text>`,
            )
            .join("");
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
            <rect width="1200" height="630" fill="#2f5d3a"/>
            <text x="64" y="110" font-family="sans-serif" font-size="24" letter-spacing="7" fill="#cfe3d3">TU PUEBLO EN 4 DATOS · ${escapar(m.provincia.toUpperCase())}</text>
            <text x="64" y="210" font-family="sans-serif" font-size="80" fill="#fdfaf4">${escapar(m.nombre)}</text>
            ${lineas}
            <text x="64" y="590" font-family="sans-serif" font-size="24" fill="#cfe3d3">MiPuebloEnCyL · datosabiertos.jcyl.es</text>
          </svg>`;
          return new Response(svg, {
            headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": cache },
          });
        }
      },
    },
  },
});
