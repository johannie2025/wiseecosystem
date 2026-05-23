// ============================================================
// src/core/sessionManager.js — Gestionnaire multi-sessions Baileys
// ============================================================
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { toDataURL } from 'qrcode';
import pino from 'pino';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Map principale: tenantId → { socket, status, qrDataUrl, io, phone }
const sessions = new Map();

/**
 * Initialise ou relance une session WhatsApp Baileys pour un tenant.
 * @param {string} tenantId - Identifiant unique du tenant
 * @param {object} io - Instance Socket.IO pour les événements temps réel
 * @param {object} logger - Logger Pino
 */
export async function initSession(tenantId, io, logger) {
  // Évite les doublons
  if (sessions.has(tenantId)) {
    const existing = sessions.get(tenantId);
    if (existing.status === 'connected') {
      logger.info(`[Session:${tenantId}] Déjà connecté.`);
      return;
    }
    // Nettoyage si session orpheline
    await destroySession(tenantId, logger);
  }

  // Répertoire de stockage des credentials par tenant
  const authDir = `./sessions/${tenantId}`;
  if (!existsSync(authDir)) await mkdir(authDir, { recursive: true });

  // État initial en mémoire
  sessions.set(tenantId, {
    socket: null,
    status: 'initializing',
    qrDataUrl: null,
    phone: null,
    retryCount: 0,
  });

  _emitStatus(io, tenantId, 'initializing', null);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    logger.info(`[Session:${tenantId}] Démarrage Baileys v${version.join('.')}`);

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      // Logger muet dédié — évite les I/O massives qui ralentissent Baileys
      logger: pino({ level: 'silent' }),
      // Pas de store messages en mémoire
      getMessage: async () => undefined,
      // Connexion rapide : pas d'aller-retour de présence inutile
      markOnlineOnConnect: true,
      // Timeout généreux pour les init queries (évite le Timed Out à 60s)
      connectTimeoutMs: 30_000,
      // Désactive la synchro d'historique complète (économise du temps)
      syncFullHistory: false,
      // Pas de prévisualisation de liens (économise des requêtes réseau)
      generateHighQualityLinkPreview: false,
    });

    // Mise à jour de la session avec le socket
    sessions.get(tenantId).socket = sock;

    // ── Événement: QR Code généré ──────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await toDataURL(qr, { width: 256, margin: 2 });
        const session = sessions.get(tenantId);
        if (session) {
          session.qrDataUrl = qrDataUrl;
          session.status = 'qr_ready';
        }
        _emitStatus(io, tenantId, 'qr_ready', qrDataUrl);
        logger.info(`[Session:${tenantId}] QR Code prêt — en attente du scan.`);
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        logger.warn(`[Session:${tenantId}] Connexion fermée — raison: ${reason} | reconnect: ${shouldReconnect}`);

        const session = sessions.get(tenantId);
        if (session) {
          session.status = 'disconnected';
          session.qrDataUrl = null;
        }
        _emitStatus(io, tenantId, 'disconnected', null);

        // Reconnexion automatique si non déconnecté volontairement
        if (shouldReconnect && session && session.retryCount < 3) {
          session.retryCount++;
          logger.info(`[Session:${tenantId}] Tentative de reconnexion #${session.retryCount}...`);
          setTimeout(() => initSession(tenantId, io, logger), 5000);
        }
      }

      if (connection === 'open') {
        const session = sessions.get(tenantId);
        const phone = sock.user?.id?.split(':')[0] || 'inconnu';
        if (session) {
          session.status = 'connected';
          session.qrDataUrl = null;
          session.phone = phone;
          session.retryCount = 0;
        }
        _emitStatus(io, tenantId, 'connected', null, phone);
        logger.info(`[Session:${tenantId}] ✓ WhatsApp connecté — Téléphone: ${phone}`);
      }
    });

    // ── Sauvegarde des credentials ─────────────────────────────────
    sock.ev.on('creds.update', saveCreds);

    // ── Réception des messages entrants ────────────────────────────
    sock.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (msg.key.fromMe) continue; // Ignorer ses propres messages
        const from = msg.key.remoteJid;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        logger.info(`[Session:${tenantId}] Message reçu de ${from}: ${text}`);

        // Émettre vers le dashboard en temps réel
        io.to(`dashboard:${tenantId}`).emit('new_message', {
          tenantId,
          from,
          text,
          timestamp: Date.now(),
        });
      }
    });

  } catch (err) {
    logger.error(`[Session:${tenantId}] Erreur init Baileys: ${err.message}`);
    const session = sessions.get(tenantId);
    if (session) session.status = 'error';
    _emitStatus(io, tenantId, 'error', null);
  }
}

/**
 * Envoie un message WhatsApp via la session d'un tenant.
 * @param {string} tenantId
 * @param {string} to - Numéro JID WhatsApp (ex: "2420000000@s.whatsapp.net")
 * @param {string} text - Message texte
 */
export async function sendMessage(tenantId, to, text) {
  const session = sessions.get(tenantId);
  if (!session || session.status !== 'connected' || !session.socket) {
    throw new Error(`Session [${tenantId}] non disponible ou non connectée.`);
  }

  // Normalisation du JID WhatsApp
  const jid = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

  await session.socket.sendMessage(jid, { text });
}

/**
 * Détruit une session et déconnecte le socket Baileys.
 * @param {string} tenantId
 */
export async function destroySession(tenantId, logger) {
  const session = sessions.get(tenantId);
  if (session?.socket) {
    try {
      await session.socket.logout();
    } catch (_) {}
  }
  sessions.delete(tenantId);
  if (logger) logger.info(`[Session:${tenantId}] Session détruite.`);
}

/**
 * Retourne le statut et le QR d'une session.
 * @param {string} tenantId
 */
export function getSessionStatus(tenantId) {
  const session = sessions.get(tenantId);
  if (!session) return { status: 'not_initialized', qrDataUrl: null, phone: null };
  return {
    status: session.status,
    qrDataUrl: session.qrDataUrl,
    phone: session.phone,
  };
}

/**
 * Retourne toutes les sessions actives (pour le SuperAdmin).
 */
export function getAllSessions() {
  const result = {};
  for (const [id, session] of sessions.entries()) {
    result[id] = { status: session.status, phone: session.phone };
  }
  return result;
}

// ── Helpers privés ─────────────────────────────────────────────────────────
function _emitStatus(io, tenantId, status, qrDataUrl, phone = null) {
  io.to(`dashboard:${tenantId}`).emit('session_status', { tenantId, status, qrDataUrl, phone });
  io.to('superadmin').emit('tenant_status_update', { tenantId, status, phone });
}
