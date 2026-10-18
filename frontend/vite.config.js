import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` is set from BASE_PATH so the same source can be served from a domain
// root (local dev, Netlify/Vercel) or from a GitHub Pages subpath.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
