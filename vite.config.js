import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    modulePreload: {
      resolveDependencies(_url, deps) {
        return deps.filter((dep) => (
          !dep.includes('streaming-') &&
          !dep.includes('three-addons-')
        ));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules/gsap')) return 'gsap';
          if (normalized.includes('node_modules/three/examples')) return 'three-addons';
          if (normalized.includes('node_modules/three')) return 'three';
          if (normalized.includes('/src/streaming/streamOverlay.js') || normalized.includes('/src/streaming/pixelStream.js')) return 'streaming';
        },
      },
    },
  },
})
