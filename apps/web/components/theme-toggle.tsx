"use client";

import { useEffect, useState } from "react";

/**
 * Alterna entre tema escuro (padrão) e claro. Persiste em cookie (mila_theme)
 * para o SSR no próximo carregamento já vir certo (sem flash) — o <html> recebe
 * a classe .light no layout raiz. A troca em runtime só liga/desliga a classe.
 */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    document.cookie = `mila_theme=${next ? "light" : "dark"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Mudar para tema escuro" : "Mudar para tema claro"}
      title={light ? "Tema escuro" : "Tema claro"}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      {light ? (
        // Lua → clicar volta ao escuro
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
          <path
            d="M16 11.5A6 6 0 0 1 8.5 4a6 6 0 1 0 7.5 7.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // Sol → clicar vai para o claro
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
