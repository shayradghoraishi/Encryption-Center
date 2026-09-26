import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import path from "path"

export default defineConfig({
  // Relative asset URLs keep the build portable across GitHub Pages project sites,
  // Cloudflare Pages/Workers, local file hosting, and sub-path deployments.
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 5173, host: true },
})
