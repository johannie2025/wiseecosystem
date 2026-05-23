// ============================================================
// server.js — Point d'entrée principal
// Wise Design Smart Ecosystem — Multi-tenant WhatsApp SaaS
// Modules: Hôtel PMS · Restaurant
// ============================================================
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pino from 'pino';

import { CONFIG } from './src/config/index.js';
import { startAutoPing } from './src/core/autoPing.js';
import { hotelRouter } from './src/domains/hotel/routes.js';
import { restaurantRouter } from './src/domains/restaurant/routes.js';

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

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    ecosystem: CONFIG.ECOSYSTEM_NAME,
    env: CONFIG.NODE_ENV,
    modules: ['hotel', 'restaurant'],
    timestamp: new Date().toISOString(),
  });
});

// ── Page d'accueil — Sélecteur de module ─────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${CONFIG.ECOSYSTEM_NAME}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        :root{--gold:#c9a84c;--gold-light:#e8c97a;--ebony:#0a0a0f;--ebony-2:#111118;--ebony-3:#1a1a25;--cream:#f5efe6;--muted:#5a5a70;}
        body{font-family:'DM Sans',sans-serif;background:var(--ebony);color:var(--cream);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;}
        .container{max-width:860px;width:100%;text-align:center;}
        .logo-title{font-family:'Cormorant Garamond',serif;font-size:3rem;color:var(--gold);margin-bottom:.5rem;font-weight:300;letter-spacing:.05em;}
        .subtitle{color:var(--muted);font-size:.9rem;margin-bottom:3.5rem;}
        .badge-live{display:inline-block;background:#22c55e;color:#000;font-weight:700;font-size:.7rem;padding:.25rem .75rem;border-radius:999px;margin-bottom:1.5rem;letter-spacing:.08em;}
        .modules-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:3rem;}
        .module-card{background:var(--ebony-2);border:1px solid rgba(201,168,76,.15);border-radius:18px;padding:2.5rem 2rem;text-align:left;transition:all .3s;cursor:pointer;text-decoration:none;display:block;}
        .module-card:hover{border-color:rgba(201,168,76,.5);transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.4);}
        .module-icon{font-size:3rem;margin-bottom:1rem;display:block;}
        .module-title{font-family:'Cormorant Garamond',serif;font-size:1.7rem;color:var(--gold);margin-bottom:.5rem;}
        .module-desc{color:var(--muted);font-size:.83rem;line-height:1.6;}
        .module-features{margin-top:1.2rem;display:flex;flex-wrap:wrap;gap:.4rem;}
        .feature-tag{background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.15);color:rgba(201,168,76,.8);font-size:.68rem;padding:.2rem .6rem;border-radius:6px;font-weight:500;}
        .admin-links{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;}
        .btn{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:9px;font-size:.83rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .25s;}
        .btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold-light));color:#0a0a0f;}
        .btn-gold:hover{opacity:.9;box-shadow:0 6px 18px rgba(201,168,76,.3);}
        .btn-ghost{background:var(--ebony-3);color:var(--muted);border:1px solid rgba(201,168,76,.1);}
        .btn-ghost:hover{color:var(--cream);border-color:rgba(201,168,76,.3);}
        .divider{border:none;border-top:1px solid rgba(201,168,76,.08);margin:2rem 0;}
        .env-info{color:var(--muted);font-size:.72rem;opacity:.6;}
        @media(max-width:600px){.modules-grid{grid-template-columns:1fr;}.logo-title{font-size:2rem;}}
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge-live">⚡ LIVE</span>
        <div class="logo-title">${CONFIG.ECOSYSTEM_NAME}</div>
        <p class="subtitle">Plateforme SaaS multi-tenant WhatsApp — Hôtellerie & Restauration en Afrique Centrale</p>

        <div class="modules-grid">
          <!-- Module Hôtel -->
          <a href="/admin?secret=${CONFIG.SUPERADMIN_SECRET}" class="module-card">
            <span class="module-icon">🏨</span>
            <div class="module-title">Module Hôtel PMS</div>
            <p class="module-desc">Gestion complète hôtelière via WhatsApp. Check-in/out automatisé, room service, facturation, séjours.</p>
            <div class="module-features">
              <span class="feature-tag">Check-in WA</span>
              <span class="feature-tag">Room Service</span>
              <span class="feature-tag">Facturation</span>
              <span class="feature-tag">Multi-hôtel</span>
            </div>
          </a>

          <!-- Module Restaurant -->
          <a href="/restaurant/admin?secret=${CONFIG.SUPERADMIN_SECRET}" class="module-card">
            <span class="module-icon">🍽️</span>
            <div class="module-title">Module Restaurant</div>
            <p class="module-desc">Bot de commande WhatsApp intelligent, réservations de tables, fidélité, promotions et statistiques.</p>
            <div class="module-features">
              <span class="feature-tag">Commandes WA</span>
              <span class="feature-tag">Réservations</span>
              <span class="feature-tag">Fidélité</span>
              <span class="feature-tag">Promotions</span>
            </div>
          </a>
        </div>

        <hr class="divider">

        <div class="admin-links">
          <a class="btn btn-gold" href="/admin?secret=${CONFIG.SUPERADMIN_SECRET}">🏨 Admin Hôtels</a>
          <a class="btn btn-gold" href="/restaurant/admin?secret=${CONFIG.SUPERADMIN_SECRET}">🍽️ Admin Restaurants</a>
          <a class="btn btn-ghost" href="/health">❤️ Health Check</a>
        </div>

        <div class="env-info" style="margin-top:2rem">
          v2.0.0 · ${CONFIG.NODE_ENV} · Port ${CONFIG.PORT} · 2 modules actifs
        </div>
      </div>
    </body>
    </html>
  `);
});

// ── Domaine Hôtel ──────────────────────────────────────────────────────────
app.use('/', hotelRouter(io, logger));

// ── Domaine Restaurant ─────────────────────────────────────────────────────
app.use('/', restaurantRouter(io, logger));

// ── Socket.IO — connexions temps réel ─────────────────────────────────────
io.on('connection', (socket) => {
  logger.debug(`[Socket.IO] Client connecté: ${socket.id}`);

  socket.on('join_dashboard', (tenantId) => {
    socket.join(`dashboard:${tenantId}`);
    logger.debug(`[Socket.IO] ${socket.id} → room dashboard:${tenantId}`);
  });

  socket.on('subscribe', (tenantId) => {
    socket.join(`dashboard:${tenantId}`);
    logger.debug(`[Socket.IO] ${socket.id} → room dashboard:${tenantId} (via subscribe)`);
  });

  // SuperAdmin reçoit tous les events
  socket.on('join_superadmin', () => {
    socket.join('superadmin');
    logger.debug(`[Socket.IO] ${socket.id} → room superadmin`);
  });

  socket.on('disconnect', () => {
    logger.debug(`[Socket.IO] Client déconnecté: ${socket.id}`);
  });
});

// ── Démarrage serveur ──────────────────────────────────────────────────────
httpServer.listen(CONFIG.PORT, () => {
  logger.info(`✅ ${CONFIG.ECOSYSTEM_NAME} démarré sur le port ${CONFIG.PORT}`);
  logger.info(`🌍 Environnement: ${CONFIG.NODE_ENV}`);
  logger.info(`🏨 Module Hôtel  → /admin?secret=***`);
  logger.info(`🍽️  Module Restaurant → /restaurant/admin?secret=***`);
  logger.info(`🔗 http://localhost:${CONFIG.PORT}`);
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
