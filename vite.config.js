import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import geminiHandler from './api/gemini.js'
import dotenv from 'dotenv'

// Load .env.local for local development testing of the Serverless Function
dotenv.config({ path: '.env.local' });

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vercel-api-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Intercept calls to the Vercel Serverless Function path
          if (req.url === '/api/gemini' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                req.body = body ? JSON.parse(body) : {};
              } catch (e) {
                req.body = {};
              }
              // Call the Vercel function directly
              geminiHandler(req, res);
            });
            return;
          }
          next();
        });
      }
    }
  ],
})
