import { defineConfig } from 'vite';

// base is set by the GitHub Pages workflow via VITE_BASE; locally it stays "/".
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  esbuild: { keepNames: true },
  server: { port: 5173, strictPort: false },
});
