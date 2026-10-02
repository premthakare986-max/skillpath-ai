import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import { authMiddleware } from './auth.js';
import { apiRouter } from './routes.js';

dotenv.config();

const app = express();

// Track database initialization state
let isDbInitialized = false;
export function ensureDbInitialized() {
  if (!isDbInitialized) {
    try {
      initDatabase();
      seedDatabase();
      isDbInitialized = true;
    } catch (err: any) {
      console.warn('[SkillPath AI] Initial database bootstrap note:', err?.message || err);
      try {
        initDatabase();
        seedDatabase();
        isDbInitialized = true;
      } catch (retryErr: any) {
        console.error('[SkillPath AI] Database initialization error:', retryErr?.message || retryErr);
      }
    }
  }
}

// Initialize on server start
ensureDbInitialized();

// Production CORS & Origin Headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const configuredAppUrl = process.env.APP_URL?.replace(/\/$/, '');

  const allowedOrigins = [
    'https://skillpath-ai-steel.vercel.app',
    configuredAppUrl,
    'http://localhost:3000',
    'http://localhost:5173'
  ].filter(Boolean) as string[];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Re-ensure DB is initialized before API requests (handles cold starts in serverless)
app.use((req, res, next) => {
  ensureDbInitialized();
  next();
});

app.use(authMiddleware);

// Health check endpoint
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    app: 'SkillPath AI',
    environment: process.env.VERCEL ? 'vercel-serverless' : (process.env.NODE_ENV || 'development'),
    time: new Date().toISOString()
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount API routes at both '/api' and '/'
// This guarantees routes resolve regardless of whether Vercel rewrites strip '/api' or preserve it
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
