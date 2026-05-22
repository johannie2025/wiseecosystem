// ============================================================
// src/domains/hotel/routes.js — Routes du domaine Hôtel/Conciergerie
// ============================================================
import { Router } from 'express';
import * as repo from '../shared/repository.js';
import { initSession, getSessionStatus, destroySession, sendMessage } from '../../core/sessionManager.js';
import { renderDashboard, renderRoom, renderSuperAdmin } from './views.js';

export function hotelRouter(io, logger) {
  const router = Router();

  // ── SuperAdmin: Liste tous les tenants ─────────────────────────────────
  router.get('/admin', (req, res) => {
    const secret = req.query.secret || req.headers['x-admin-secret'];
    if (secret !== process.env.SUPERADMIN_SECRET) {
      return res.status(401).send('<h1>401 — Accès non autorisé</h1>');
    }
    const tenants = repo.getAllTenants();
    res.send(renderSuperAdmin(tenants));
  });

  // ── SuperAdmin: Créer un nouveau tenant ────────────────────────────────
  router.post('/admin/tenants', (req, res) => {
    const secret = req.headers['x-admin-secret'] || req.body?.adminSecret;
    if (secret !== process.env.SUPERADMIN_SECRET) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
    const { name, address, staffPhone, primaryColor } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const tenant = repo.createTenant({ name, address, staffPhone, primaryColor });
    logger.info(`[Admin] Nouveau tenant créé: ${tenant.tenantId} — ${tenant.name}`);
    res.json({ success: true, tenant });
  });

  // ── Dashboard Hôtel (par tenant) ───────────────────────────────────────
  router.get('/dashboard/:tenantId', (req, res) => {
    const tenant = repo.getTenant(req.params.tenantId);
    if (!tenant) return res.status(404).send('<h1>Tenant introuvable</h1>');
    const sessionStatus = getSessionStatus(req.params.tenantId);
    const orders = repo.getOrdersByTenant(req.params.tenantId);
    res.send(renderDashboard(tenant, sessionStatus, orders));
  });

  // ── API: Lancer/relancer la session WhatsApp d'un tenant ───────────────
  router.post('/dashboard/:tenantId/connect', async (req, res) => {
    const { tenantId } = req.params;
    const tenant = repo.getTenant(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant introuvable' });
    try {
      await initSession(tenantId, io, logger);
      res.json({ success: true, message: 'Initialisation WhatsApp lancée...' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── API: Déconnecter la session WhatsApp ───────────────────────────────
  router.post('/dashboard/:tenantId/disconnect', async (req, res) => {
    const { tenantId } = req.params;
    await destroySession(tenantId, logger);
    res.json({ success: true, message: 'Session WhatsApp déconnectée.' });
  });

  // ── API: Statut de session (polling fallback) ──────────────────────────
  router.get('/dashboard/:tenantId/status', (req, res) => {
    const status = getSessionStatus(req.params.tenantId);
    res.json(status);
  });

  // ── API: Liste des commandes ───────────────────────────────────────────
  router.get('/dashboard/:tenantId/orders', (req, res) => {
    const orders = repo.getOrdersByTenant(req.params.tenantId);
    res.json(orders);
  });

  // ── API: Mettre à jour le statut d'une commande ────────────────────────
  router.patch('/orders/:orderId/status', (req, res) => {
    const { status } = req.body;
    const order = repo.updateOrderStatus(req.params.orderId, status);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    // Notification temps réel au dashboard
    io.to(`dashboard:${order.tenantId}`).emit('order_updated', order);
    res.json({ success: true, order });
  });

  // ── Vue Client: Interface chambre ──────────────────────────────────────
  router.get('/room/:tenantId/:roomNumber', (req, res) => {
    const tenant = repo.getTenant(req.params.tenantId);
    if (!tenant) return res.status(404).send('<h1>Hôtel introuvable</h1>');
    const menu = repo.getMenu(req.params.tenantId);
    res.send(renderRoom(tenant, req.params.roomNumber, menu));
  });

  // ── API: Soumettre une commande depuis la chambre ──────────────────────
  router.post('/room/:tenantId/:roomNumber/order', async (req, res) => {
    const { tenantId, roomNumber } = req.params;
    const { items, clientPhone, note } = req.body;

    const tenant = repo.getTenant(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant introuvable' });
    if (!items || !items.length) return res.status(400).json({ error: 'Commande vide' });

    // Enregistrement de la commande en mémoire
    const order = repo.createOrder({ tenantId, roomNumber, clientPhone, items, note });

    // Notification temps réel au dashboard hôtel
    io.to(`dashboard:${tenantId}`).emit('new_order', order);

    // ── Envoi WhatsApp ──────────────────────────────────────────────────
    const session = getSessionStatus(tenantId);
    const itemsList = items.map(i => `  • ${i.name} ×${i.qty}`).join('\n');
    const totalStr = order.total > 0 ? `\n💰 *Total: ${order.total.toLocaleString()} XAF*` : '';

    const staffMsg = `🏨 *${tenant.name}*\n📋 *Nouvelle Commande #${order.orderId.slice(-6).toUpperCase()}*\n🚪 Chambre: *${roomNumber}*\n\n${itemsList}${totalStr}\n${note ? `📝 Note: ${note}` : ''}\n⏰ ${new Date().toLocaleTimeString('fr-FR')}`;

    const clientMsg = `✅ *Votre commande est confirmée!*\n\nHôtel: ${tenant.name}\nChambre: ${roomNumber}\n\n${itemsList}${totalStr}\n\nNous vous apportons ça dans les plus brefs délais. Merci! 🙏`;

    const whatsappResults = { staff: false, client: false, error: null };

    if (session.status === 'connected') {
      // Message au staff de l'hôtel
      if (tenant.staffPhone) {
        try {
          await sendMessage(tenantId, tenant.staffPhone, staffMsg);
          whatsappResults.staff = true;
        } catch (e) {
          logger.warn(`[Order] Envoi staff échoué: ${e.message}`);
        }
      }
      // Message de confirmation au client
      if (clientPhone) {
        try {
          await sendMessage(tenantId, clientPhone, clientMsg);
          whatsappResults.client = true;
        } catch (e) {
          logger.warn(`[Order] Envoi client échoué: ${e.message}`);
        }
      }
    } else {
      whatsappResults.error = 'WhatsApp non connecté — commande enregistrée uniquement';
    }

    logger.info(`[Order] ${order.orderId} — Chambre ${roomNumber} — WhatsApp: ${JSON.stringify(whatsappResults)}`);

    res.json({
      success: true,
      order,
      whatsapp: whatsappResults,
      message: session.status === 'connected'
        ? 'Commande envoyée! Notification WhatsApp transmise.'
        : 'Commande enregistrée. WhatsApp non connecté.',
    });
  });

  // ── API: Menu d'un tenant ──────────────────────────────────────────────
  router.get('/menu/:tenantId', (req, res) => {
    const menu = repo.getMenu(req.params.tenantId);
    res.json(menu);
  });

  return router;
}
