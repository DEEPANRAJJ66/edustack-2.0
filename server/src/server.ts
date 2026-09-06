// ==============================================================================
// EDUSTACK 2.0 — NODE/EXPRESS BACKEND SERVER
// ==============================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// CORS configuration
app.use(
  cors({
    origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'EduStack 2.0 Backend Server',
    description: 'JEE Main CBT practice, server-authoritative scoring & error revision API',
    endpoints: {
      health: '/api/health',
      attempts: '/api/attempts',
    },
  });
});

app.listen(port, () => {
  console.log(`EduStack 2.0 Backend Server running on port ${port}`);
});
