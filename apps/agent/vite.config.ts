import { defineConfig } from "vite";

// Frontend do agente (webview do Tauri). Porta fixa para o tauri dev.
export default defineConfig({
  clearScreen: false,
  server: { port: 1421, strictPort: true },
  build: { outDir: "dist", target: "chrome105" },
});
