import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/pages/nabe7/sleep-app/' : '/',
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.MODE === 'production'
        ? 'https://your-fly-app.fly.dev/api'
        : 'http://localhost:3001/api'
    )
  }
})
