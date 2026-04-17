import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@arbiter/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url))
    }
  },
  clearScreen: false,
  server: {
    strictPort: true,
    port: 1420
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'es2022',
    minify: false
  }
});
