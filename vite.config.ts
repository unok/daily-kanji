import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const allowedHosts = env.VITE_ALLOWED_HOST ? [env.VITE_ALLOWED_HOST] : []

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts,
      hmr: {
        overlay: false,
      },
    },
  }
})
