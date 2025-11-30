// Load local .env into process.env (safe for development). Put this at the top so env vars are available.
import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import nutritionRouter from './modules/nutrition/index.js';
import fitnessRouter from './modules/fitness/index.js';
import productivityRouter from './modules/productivity/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// Module routes (modular architecture)
app.use('/api/nutrition', nutritionRouter);
app.use('/api/fitness', fitnessRouter);
app.use('/api/productivity', productivityRouter);

// Serve client build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
