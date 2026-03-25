// Load local .env into process.env (safe for development). Put this at the top so env vars are available.
import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pinoHttp from 'pino-http';
import logger from './logger.js';
import authRouter from './modules/auth/index.js';
import nutritionRouter from './modules/nutrition/index.js';
import fitnessRouter from './modules/fitness/index.js';
import productivityRouter from './modules/productivity/index.js';
import sleepRouter from './modules/sleep/index.js';
import notesRouter from './modules/notes/index.js';
import { requireAuth } from './modules/auth/middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const resolvedAllowedOrigins = allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 25 : 250,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(pinoHttp({
  logger,
  redact: ['req.headers.cookie', 'req.headers.authorization']
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || resolvedAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));
app.use(cookieParser() as unknown as express.RequestHandler);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// Module routes (modular architecture)
app.use('/api/auth', authLimiter as unknown as express.RequestHandler, authRouter);
app.use('/api/nutrition', apiLimiter as unknown as express.RequestHandler, requireAuth, nutritionRouter);
app.use('/api/fitness', apiLimiter as unknown as express.RequestHandler, requireAuth, fitnessRouter);
app.use('/api/productivity', apiLimiter as unknown as express.RequestHandler, requireAuth, productivityRouter);
app.use('/api/sleep', apiLimiter as unknown as express.RequestHandler, requireAuth, sleepRouter);
app.use('/api/notes', apiLimiter as unknown as express.RequestHandler, requireAuth, notesRouter);

// Serve client build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});
