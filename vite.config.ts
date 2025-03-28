import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  // console.log('Mode:', mode);
  return {
  plugins: [react()],
  base: mode === 'production' ? '/sleep-app/' : '/',
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      mode === 'production'
        ? 'https://sleep-app-backend.fly.dev/api'
        : 'http://localhost:3001/api'
    )
  }
}
})
