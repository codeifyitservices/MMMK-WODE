import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('react-redux') || id.includes('@reduxjs')) return 'redux';
          if (id.includes('antd') || id.includes('@mui')) return 'ui';
          if (id.includes('swiper')) return 'swiper';
          if (id.includes('chart') || id.includes('recharts') || id.includes('apexcharts')) return 'charts';
          if (id.includes('framer-motion')) return 'motion';
          return 'vendor';
        },
      },
    },
  },
});
