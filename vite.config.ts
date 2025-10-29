import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/vrt-the-painter-community-dashboard/',
  plugins: [react()],
})
