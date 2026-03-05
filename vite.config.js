import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Note: API Proxies (Noon Scraper & SerpAPI) have been moved to Vercel Serverless Functions 
// in the `/api` directory to ensure they work in production environments.

export default defineConfig({
  plugins: [react()],
})
