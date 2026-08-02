import { createFileRoute } from "@tanstack/react-router";

// Endpoints de sincronización mensual (llamados por el planificador con la apikey pública).
// /api/public/sync/municipios | educacion | salud | transporte | aire | indice | todo
export const Route = createFileRoute("/api/public/sync/$fuente")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const fuente = params.fuente;
        const { SYNC_TASKS, syncTodo } = await import("@/lib/jcyl.server");
        if (fuente !== "todo" && !SYNC_TASKS[fuente]) {
          return Response.json({ error: `Fuente desconocida: ${fuente}` }, { status: 404 });
        }
        try {
          const resultado = fuente === "todo" ? await syncTodo() : [await SYNC_TASKS[fuente]!()];
          return Response.json({ ok: true, resultado });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error(`[sync:${fuente}]`, message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});