import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractClientIp(req: express.Request): { ipRaw: string; ipKey: string } {
  const forwarded = req.headers['x-forwarded-for'];
  let raw = '';

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    raw = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    raw = forwarded[0].split(',')[0].trim();
  } else {
    raw = req.ip || req.socket.remoteAddress || '127.0.0.1';
  }

  raw = raw.replace(/^::ffff:/, '').trim() || '127.0.0.1';
  if (raw === '::1') raw = '127.0.0.1';
  raw = raw.slice(0, 64);

  const ipKey = raw.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 64) || 'unknown_ip';
  return { ipRaw: raw, ipKey };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', true);
  app.use(express.json());

  app.get('/api/client-ip', (req, res) => {
    const info = extractClientIp(req);
    res.json(info);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Uçan Fil server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
