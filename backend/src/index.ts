import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from './lib/prisma';

import authRoutes from './routes/auth';
import recipeRoutes from './routes/recipes';
import ingredientRoutes from './routes/ingredients';
import mealPlanRoutes from './routes/mealPlans';
import shoppingListRoutes from './routes/shoppingList';

const app = express();
const PORT = process.env.PORT || 4000;

// Build allowed origins list from env — supports comma-separated values
const allowedOrigins = (process.env['FRONTEND_URL'] || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Always allow localhost in dev
if (process.env['NODE_ENV'] !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no Origin header) and allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin} not in [${allowedOrigins.join(', ')}]`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env['NODE_ENV'],
      hasDbUrl: !!process.env['DATABASE_URL'],
      allowedOrigins,
    },
  });
});

// Deep health check — tests actual DB connectivity
app.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('DB health check failed:', message);
    res.status(503).json({ status: 'error', database: 'disconnected', detail: message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/shopping-list', shoppingListRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
