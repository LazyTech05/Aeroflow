import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase the limit to 2 MB (2000 KB) – adjust as you like
    chunkSizeWarningLimit: 2000,
  },
});
