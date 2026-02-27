// Load local .env into process.env (safe for development). Put this at the top so env vars are available.
import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRouter from './modules/auth/index.js';
import nutritionRouter from './modules/nutrition/index.js';
import fitnessRouter from './modules/fitness/index.js';
import productivityRouter from './modules/productivity/index.js';
import sleepRouter from './modules/sleep/index.js';
import { requireAuth } from './modules/auth/middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// Module routes (modular architecture)
app.use('/api/auth', authRouter);
app.use('/api/nutrition', requireAuth, nutritionRouter);
app.use('/api/fitness', requireAuth, fitnessRouter);
app.use('/api/productivity', requireAuth, productivityRouter);
app.use('/api/sleep', requireAuth, sleepRouter);

// Serve client build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
