import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { initDatabase } from './server/db.js';
import { getUserByToken } from './server/auth.js';
import { addClientConnection, removeClientConnection } from './server/sse.js';
import { authRouter } from './server/routes/authRoutes.js';
import { termsRouter } from './server/routes/termsRoutes.js';
import { creatorRouter } from './server/routes/creatorRoutes.js';
import { agencyRouter } from './server/routes/agencyRoutes.js';
import { discoveryRouter } from './server/routes/discoveryRoutes.js';
import { invitationRouter } from './server/routes/invitationRoutes.js';
import { projectRouter } from './server/routes/projectRoutes.js';
import { paymentRouter } from './server/routes/paymentRoutes.js';
import { reviewRouter } from './server/routes/reviewRoutes.js';
import { notificationRouter } from './server/routes/notificationRoutes.js';
import { uploadRouter } from './server/routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database schema
initDatabase();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded media
const uploadsPath = path.resolve(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Real-time Server-Sent Events (SSE) Endpoint
app.get('/api/events', (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(401).end();
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ userId: user.id, connectedAt: new Date().toISOString() })}\n\n`);

  addClientConnection(user.id, res);

  req.on('close', () => {
    removeClientConnection(user.id, res);
  });
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/terms', termsRouter);
app.use('/api/creator', creatorRouter);
app.use('/api/agency', agencyRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/invitations', invitationRouter);
app.use('/api/projects', projectRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CreatorBridge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
