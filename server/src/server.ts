import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { jobsRouter } from './routes/jobs';
import { scrapeRouter } from './routes/scrape';
import { statsRouter } from './routes/stats';
import { ScraperManager } from './services/scraperManager';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend static build if exists
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.use((_req, res, next) => {
  if (_req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('JobFlow API Server running.');
    }
  });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for real-time progress and logs
const wss = new WebSocketServer({ server, path: '/ws' });
const scraperManager = ScraperManager.getInstance();

wss.on('connection', (ws: WebSocket) => {
  scraperManager.registerWsClient(ws);

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {}
  });

  ws.on('close', () => {
    scraperManager.unregisterWsClient(ws);
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] JobFlow backend listening on http://localhost:${PORT}`);
  console.log(`[SERVER] WebSocket available on ws://localhost:${PORT}/ws`);
});
