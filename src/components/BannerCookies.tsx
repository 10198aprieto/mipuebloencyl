import { useEffect, useState } from "react";

const CLAVE = "mipuebloencyl:consentimiento-cookies";
const GA_ID = "G-S9XJ86DPCW";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function cargarAnalytics() {
  if (typeof document === "undefined") return;
  if (document.getElementById("ga-script")) return;
  const s = document.createElement("script");
  s.id = "ga-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_ID);
}

export function BannerCookies() {
  const [decidido, setDecidido] = useState(true);

  useEffect(() => {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "aceptado") {
      cargarAnalytics();
      return;
    }
    if (guardado !== "rechazado") setDecidido(false);
  }, []);

  if (decidido) return null;

  const decidir = (valor: "aceptado" | "rechazado") => {
    localStorage.setItem(CLAVE, valor);
    if (valor === "aceptado") cargarAnalytics();
    setDecidido(true);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentimiento de cookies"
      className="fixed inset-x-0 bottom-0 z-[2000] border-t border-border bg-card p-4 shadow-[var(--shadow-ficha)]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Usamos cookies de medición de audiencia (Google Analytics) solo si nos das tu permiso. Sin tu
          consentimiento, la web funciona igual y no se instala ninguna cookie analítica.{" "}
          <a href="/politica-cookies" className="font-medium text-primary underline underline-offset-4">
            Más información
          </a>
          .
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => decidir("rechazado")}
            className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => decidir("aceptado")}
            className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}