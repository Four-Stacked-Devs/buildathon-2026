import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// getUserMedia (mic) works on plain http://localhost, but any other origin
// (e.g. opening the dev server from a phone via LAN IP) requires HTTPS.
// Set DEV_HTTPS=1 to enable the self-signed certificate for LAN testing.
const useHttps = Boolean(process.env.DEV_HTTPS);

// Defaults to the local API server; set VITE_PROXY_TARGET to point elsewhere
// (e.g. https://buildathon-2026.onrender.com for the deployed API).
const proxyTarget = process.env.VITE_PROXY_TARGET ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": proxyTarget,
      "/health": proxyTarget,
    },
  },
});
