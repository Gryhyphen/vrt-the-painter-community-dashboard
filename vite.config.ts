import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/vrt-the-painter-community-dashboard/',
  plugins: [react()],
  assetsInclude: ['**/*.md'],
  build: {
    rollupOptions: {
      input: {
        // main entry
        main: resolve(__dirname, 'index.html'),
        // secondary entry
        mapcontribute: resolve(__dirname, 'tools/mapcontribute/index.html'),
      },
    },
  },
});