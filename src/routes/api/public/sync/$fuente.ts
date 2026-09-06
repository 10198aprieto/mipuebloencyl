import { createFileRoute } from "@tanstack/react-router";

// Endpoints de sincronización mensual (llamados por el planificador con la apikey pública).
// /api/public/sync/municipios | educacion | salud | transporte | aire | indice | todo
// Fuentes externas complementarias (importación aparte, por tandas):
// /api/public/sync/geografia_ign | geografia_wikidata | poblacion_historica | imagenes_commons | agro_ine
//   admiten ?cod_ine=47010 (prueba de un municipio), ?desde=0&limite=250 (tandas)
export const Route = createFileRoute("/api/public/sync/$fuente")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const fuente = params.fuente;
        const { SYNC_TASKS, syncTodo } = await import("@/lib/jcyl.server");
        const { SYNC_TASKS_EXTRA } = await import("@/lib/jcyl-extra.server");
        const { SYNC_TASKS_EXTERNO } = await import("@/lib/externo.server");
        const url = new URL(request.url);
        const num = (k: string) => {
          const v = url.searchParams.get(k);
          return v === null || v === "" ? undefined : Number(v);
        };
        const opciones = { codIne: num("cod_ine"), desde: num("desde"), limite: num("limite") };

        if (SYNC_TASKS_EXTERNO[fuente]) {
          try {
            const resultado = [await SYNC_TASKS_EXTERNO[fuente]!(opciones)];
            return Response.json({ ok: true, resultado });
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`[sync:${fuente}]`, message);
            return Response.json({ ok: false, error: message }, { status: 500 });
          }
        }

        const TASKS = { ...SYNC_TASKS, ...SYNC_TASKS_EXTRA };
        if (fuente !== "todo" && !TASKS[fuente]) {
          return Response.json({ error: `Fuente desconocida: ${fuente}` }, { status: 404 });
        }

        try {
          const resultado =
            fuente === "todo"
              ? [
                  ...(await syncTodo()),
                  ...(await (async () => {
                    const out = [];
                    for (const key of Object.keys(SYNC_TASKS_EXTRA)) out.push(await SYNC_TASKS_EXTRA[key]!());
                    return out;
                  })()),
                ]
              : [await TASKS[fuente]!()];
          return Response.json({ ok: true, resultado });
        } catch (e) {
          const message =
            e instanceof Error ? e.message : typeof e === "object" ? JSON.stringify(e) : String(e);
          console.error(`[sync:${fuente}]`, message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});