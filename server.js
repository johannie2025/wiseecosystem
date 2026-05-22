// ============================================================
// server.js — Point d'entrée principal
// Wise Design Smart Ecosystem — Multi-tenant WhatsApp SaaS
// ============================================================
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pino from 'pino';

import { CONFIG } from './src/config/index.js';
import { startAutoPing } from './src/core/autoPing.js';
import { hotelRouter } from './src/domains/hotel/routes.js';

// ── Logger Pino ────────────────────────────────────────────────────────────
const logger = pino({
  level: CONFIG.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: CONFIG.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

// ── Express + HTTP + Socket.IO ────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check (utilisé aussi par l'auto-ping) ───────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    ecosystem: CONFIG.ECOSYSTEM_NAME,
    env: CONFIG.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Page d'accueil ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${CONFIG.ECOSYSTEM_NAME}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', sans-serif;
          background: #0f0f1a;
          color: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }
        .card {
          background: #1a1a2e;
          border: 1px solid #2a2a4a;
          border-radius: 16px;
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #7c83fd; }
        p  { color: #888; margin-bottom: 2rem; }
        .badge {
          display: inline-block;
          background: #25d366;
          color: #000;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          margin-bottom: 2rem;
        }
        a.btn {
          display: inline-block;
          background: #7c83fd;
          color: #fff;
          text-decoration: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          margin: 0.5rem;
          transition: opacity .2s;
        }
        a.btn:hover { opacity: 0.85; }
        a.btn.secondary { background: #2a2a4a; }
        .env { margin-top: 2rem; font-size: 0.75rem; color: #555; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">⚡ LIVE</span>
        <h1>${CONFIG.ECOSYSTEM_NAME}</h1>
        <p>Plateforme SaaS multi-tenant WhatsApp pour l'hôtellerie en Afrique Centrale</p>
        <a class="btn" href="/admin?secret=${CONFIG.SUPERADMIN_SECRET}">🛡️ SuperAdmin</a>
        <a class="btn secondary" href="/health">❤️ Health</a>
        <div class="env">v1.0.0 — ${CONFIG.NODE_ENV} — Port ${CONFIG.PORT}</div>
      </div>
    </body>
    </html>
  `);
});

// ── Domaine Hôtel ──────────────────────────────────────────────────────────
app.use('/', hotelRouter(io, logger));

// ── Socket.IO — connexions temps réel ─────────────────────────────────────
io.on('connection', (socket) => {
  logger.debug(`[Socket.IO] Client connecté: ${socket.id}`);

  // Le dashboard émet 'join_dashboard' → on rejoint la room 'dashboard:tenantId'
  // C'est le nom de room utilisé dans routes.js : io.to(`dashboard:${tenantId}`)
  socket.on('join_dashboard', (tenantId) => {
    socket.join(`dashboard:${tenantId}`);
    logger.debug(`[Socket.IO] ${socket.id} → room dashboard:${tenantId}`);
  });

  // Alias pour compatibilité si d'autres clients utilisent 'subscribe'
  socket.on('subscribe', (tenantId) => {
    socket.join(`dashboard:${tenantId}`);
    logger.debug(`[Socket.IO] ${socket.id} → room dashboard:${tenantId} (via subscribe)`);
  });

  socket.on('disconnect', () => {
    logger.debug(`[Socket.IO] Client déconnecté: ${socket.id}`);
  });
});

// ── Démarrage serveur ──────────────────────────────────────────────────────
httpServer.listen(CONFIG.PORT, () => {
  logger.info(`✅ ${CONFIG.ECOSYSTEM_NAME} démarré sur le port ${CONFIG.PORT}`);
  logger.info(`🌍 Environnement: ${CONFIG.NODE_ENV}`);
  logger.info(`🔗 http://localhost:${CONFIG.PORT}`);

  // Auto-ping anti-sleep Render.com
  startAutoPing(logger);
});

// ── Gestion des erreurs non capturées ─────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error({ err }, '💥 uncaughtException');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, '💥 unhandledRejection');
  process.exit(1);
});
