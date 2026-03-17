import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    // 生产 sourcemap：用于错误定位；不在浏览器 DevTools 直接暴露源码
    sourcemap: 'hidden',
  },
});
