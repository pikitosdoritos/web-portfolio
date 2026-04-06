import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    open: true,
    port: 3000
  },
  optimizeDeps: {
    include: ['phaser']
  }
});
