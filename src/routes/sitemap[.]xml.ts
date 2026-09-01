import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://mipuebloencyl.lovable.app";

const ESTATICAS = [
  { url: "/", prioridad: "1.0", frecuencia: "weekly" },
  { url: "/comparar", prioridad: "0.8", frecuencia: "monthly" },
  { url: "/metodologia", prioridad: "0.7", frecuencia: "monthly" },
  { url: "/aviso-legal", prioridad: "0.3", frecuencia: "yearly" },
  { url: "/politica-privacidad", prioridad: "0.3", frecuencia: "yearly" },
  { url: "/politica-cookies", prioridad: "0.3", frecuencia: "yearly" },
];

// Sitemap con las rutas públicas y una entrada por municipio (/wrapped/{cod_ine}).
export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const hoy = new Date().toISOString().slice(0, 10);
        const entradas = ESTATICAS.map(
          (e) =>
            `<url><loc>${BASE}${e.url}</loc><lastmod>${hoy}</lastmod><changefreq>${e.frecuencia}</changefreq><priority>${e.prioridad}</priority></url>`,
        );

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (url && key) {
          try {
            for (let from = 0; from < 4000; from += 1000) {
              const res = await fetch(`${url}/rest/v1/municipios?select=cod_ine&order=cod_ine`, {
                headers: { apikey: key, Range: `${from}-${from + 999}` },
              });
              const filas = (await res.json()) as Array<{ cod_ine: number }>;
              for (const f of filas) {
                entradas.push(
                  `<url><loc>${BASE}/wrapped/${f.cod_ine}</loc><lastmod>${hoy}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
                );
              }
              if (filas.length < 1000) break;
            }
          } catch (e) {
            console.error("[sitemap] no se pudieron listar los municipios:", e);
          }
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas.join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
