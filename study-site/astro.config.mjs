import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  server: { port: 4788 },
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Dev-only fix: react-dom/client ships as CommonJS and was being served raw
      // from node_modules (never pre-bundled), so `import { createRoot }` failed in
      // every island. Forcing the optimizer to pre-bundle it yields correct ESM
      // interop in `astro dev`. The production build (Rollup) was never affected.
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
    },
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
});