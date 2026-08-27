import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Live / Production Backend URL or local fallback
  const backendTarget =
    env.VITE_BACKEND_URL ||
    env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
    env.BACKEND_URL ||
    'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // Listen on all local IPs
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: true
        },
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: true
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000
    }
  };
});
