import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { initDatabase } from './src/server/db.js';
import { seedDatabase } from './src/server/seed.js';
import { authMiddleware } from './src/server/auth.js';
import { apiRouter } from './src/server/routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize DB and Seed Data
initDatabase();
seedDatabase();

app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware);

// Mount API routes
app.use('/api', apiRouter);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SkillPath AI', time: new Date().toISOString() });
});

async function startServer() {
  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.warn('Production build directory "dist" not found. Please run "npm run build".');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SkillPath AI] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
