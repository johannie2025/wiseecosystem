// ============================================================
// src/domains/hotel/routes.js — Routes du domaine Hôtel PMS
// ============================================================
import { Router } from 'express';
import * as repo from '../shared/repository.js';
import { initSession, getSessionStatus, destroySession, sendMessage } from '../../core/sessionManager.js';
import { renderDashboard, renderRoom, renderSuperAdmin, renderConfig } from './views.js';

export function hotelRouter(io, logger) {
  const router = Router();

  // ══════════════════════════════════════════════════════════
  // SUPERADMIN
  // ══════════════════════════════════════════════════════════

  router.get('/admin', (req, res) => {
    const secret = req.query.secret || req.headers['x-admin-secret'];
    if (secret !== process.env.SUPERADMIN_SECRET) return res.status(401).send('<h1>401 — Accès non autorisé</h1>');
    res.send(renderSuperAdmin(repo.getAllTenants()));
  });

  router.post('/admin/tenants', (req, res) => {
    const secret = req.headers['x-admin-secret'] || req.body?.adminSecret;
    if (secret !== process.env.SUPERADMIN_SECRET) return res.status(401).json({ error: 'Non autorisé' });
    const { name, address, staffPhone, primaryColor } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const tenant = repo.createTenant({ name, address, staffPhone, primaryColor });
    logger.info(`[Admin] Tenant créé: ${tenant.tenantId}`);
    res.json({ success: true, tenant });
  });

  // ══════════════════════════════════════════════════════════
  // DASHBOARD HÔTEL
  // ══════════════════════════════════════════════════════════

  router.get('/dashboard/:tenantId', (req, res) => {
    const tenant = repo.getTenant(req.params.tenantId);
    if (!tenant) return res.status(404).send('<h1>Tenant introuvable</h1>');
    const sessionStatus = getSessionStatus(req.params.tenantId);
    const orders  = repo.getOrdersByTenant(req.params.tenantId);
    const rooms   = repo.getRoomsByTenant(req.params.tenantId);
    const stays   = repo.getStaysByTenant(req.params.tenantId);
    const stats   = repo.getStats(req.params.tenantId);
    res.send(renderDashboard(tenant, sessionStatus, orders, rooms, stays, stats));
  });

  // ── WhatsApp connexion ──────────────────────────────────────────────────
  router.post('/dashboard/:tenantId/connect', async (req, res) => {
    const { tenantId } = req.params;
    if (!repo.getTenant(tenantId)) return res.status(404).json({ error: 'Tenant introuvable' });
    try {
      await initSession(tenantId, io, logger);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/dashboard/:tenantId/disconnect', async (req, res) => {
    await destroySession(req.params.tenantId, logger);
    res.json({ success: true });
  });

  router.get('/dashboard/:tenantId/status', (req, res) => {
    res.json(getSessionStatus(req.params.tenantId));
  });

  // ── API données dashboard ───────────────────────────────────────────────
  router.get('/dashboard/:tenantId/orders', (req, res) => {
    res.json(repo.getOrdersByTenant(req.params.tenantId));
  });

  router.get('/dashboard/:tenantId/rooms', (req, res) => {
    res.json(repo.getRoomsByTenant(req.params.tenantId));
  });

  router.get('/dashboard/:tenantId/stays', (req, res) => {
    res.json(repo.getStaysByTenant(req.params.tenantId));
  });

  router.get('/dashboard/:tenantId/stats', (req, res) => {
    res.json(repo.getStats(req.params.tenantId));
  });

  router.patch('/orders/:orderId/status', (req, res) => {
    const order = repo.updateOrderStatus(req.params.orderId, req.body.status);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    io.to(`dashboard:${order.tenantId}`).emit('order_updated', order);
    res.json({ success: true, order });
  });

  // ══════════════════════════════════════════════════════════
  // CONFIGURATION BACKOFFICE (CRUD Chambres + Menu)
  // ══════════════════════════════════════════════════════════

  router.get('/config/:tenantId', (req, res) => {
    const tenant = repo.getTenant(req.params.tenantId);
    if (!tenant) return res.status(404).send('<h1>Tenant introuvable</h1>');
    const rooms = repo.getRoomsByTenant(req.params.tenantId);
    const menu  = repo.getMenu(req.params.tenantId);
    res.send(renderConfig(tenant, rooms, menu));
  });

  // ── CRUD Chambres ───────────────────────────────────────────────────────
  router.post('/config/:tenantId/rooms', (req, res) => {
    const { number, type, pricePerNight, pricePerHour, floor, description } = req.body;
    if (!number) return res.status(400).json({ error: 'Numéro requis' });
    const room = repo.addRoom(req.params.tenantId, { number, type, pricePerNight, pricePerHour, floor, description });
    io.to(`dashboard:${req.params.tenantId}`).emit('room_updated', { rooms: repo.getRoomsByTenant(req.params.tenantId) });
    res.json({ success: true, room });
  });

  router.patch('/config/:tenantId/rooms/:roomId', (req, res) => {
    const room = repo.updateRoom(req.params.roomId, req.body);
    if (!room) return res.status(404).json({ error: 'Chambre introuvable' });
    io.to(`dashboard:${req.params.tenantId}`).emit('room_updated', { rooms: repo.getRoomsByTenant(req.params.tenantId) });
    res.json({ success: true, room });
  });

  router.patch('/config/:tenantId/rooms/:roomId/status', (req, res) => {
    const room = repo.updateRoom(req.params.roomId, { status: req.body.status });
    if (!room) return res.status(404).json({ error: 'Chambre introuvable' });
    io.to(`dashboard:${req.params.tenantId}`).emit('room_updated', { rooms: repo.getRoomsByTenant(req.params.tenantId) });
    res.json({ success: true, room });
  });

  router.delete('/config/:tenantId/rooms/:roomId', (req, res) => {
    const ok = repo.deleteRoom(req.params.roomId);
    if (!ok) return res.status(404).json({ error: 'Chambre introuvable' });
    io.to(`dashboard:${req.params.tenantId}`).emit('room_updated', { rooms: repo.getRoomsByTenant(req.params.tenantId) });
    res.json({ success: true });
  });

  // ── CRUD Menu ───────────────────────────────────────────────────────────
  router.post('/config/:tenantId/menu', (req, res) => {
    const { name, price, category, emoji } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const item = repo.addMenuItem(req.params.tenantId, { name, price, category, emoji });
    res.json({ success: true, item });
  });

  router.patch('/config/:tenantId/menu/:itemId', (req, res) => {
    const item = repo.updateMenuItem(req.params.tenantId, req.params.itemId, req.body);
    if (!item) return res.status(404).json({ error: 'Article introuvable' });
    res.json({ success: true, item });
  });

  router.delete('/config/:tenantId/menu/:itemId', (req, res) => {
    const ok = repo.deleteMenuItem(req.params.tenantId, req.params.itemId);
    if (!ok) return res.status(404).json({ error: 'Article introuvable' });
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════════════
  // CHECK-IN MANUEL (depuis dashboard)
  // ══════════════════════════════════════════════════════════

  router.post('/dashboard/:tenantId/checkin', async (req, res) => {
    const { tenantId } = req.params;
    const { roomNumber, guestName, guestId, guestPhone, durationDays, durationHours } = req.body;

    if (!roomNumber || !guestName) return res.status(400).json({ error: 'Chambre et nom requis' });

    const room = repo.getRoomByNumber(tenantId, roomNumber);
    if (!room) return res.status(404).json({ error: 'Chambre introuvable' });
    if (room.status === 'occupied') return res.status(409).json({ error: 'Chambre déjà occupée' });

    const stay = repo.createStay({ tenantId, roomNumber, guestName, guestId, guestPhone, durationDays, durationHours });
    io.to(`dashboard:${tenantId}`).emit('room_updated',  { rooms: repo.getRoomsByTenant(tenantId) });
    io.to(`dashboard:${tenantId}`).emit('stay_created',  stay);

    // Message WhatsApp de bienvenue
    const session = getSessionStatus(tenantId);
    const tenant  = repo.getTenant(tenantId);
    if (session.status === 'connected' && guestPhone && tenant.staffPhone) {
      const checkOutDate = new Date(stay.checkOutAt).toLocaleString('fr-FR');
      const welcomeMsg = `🏨 *${tenant.name}*\n\n✅ *Bienvenue, ${guestName}!*\n🚪 Chambre: *${roomNumber}*\n📅 Départ prévu: *${checkOutDate}*\n\nPour le Room Service, scannez le QR Code sur votre table de chevet ou accédez à:\n${process.env.RENDER_URL}/room/${tenantId}/${roomNumber}\n\nBon séjour! 🙏`;
      try { await sendMessage(tenantId, guestPhone.replace(/\D/g, ''), welcomeMsg); } catch (e) { logger.warn(`[CheckIn] WA échoué: ${e.message}`); }
    }

    logger.info(`[CheckIn] ${stay.stayId} — ${guestName} — Chambre ${roomNumber}`);
    res.json({ success: true, stay });
  });

  // ══════════════════════════════════════════════════════════
  // CHECK-IN AUTOMATIQUE VIA WHATSAPP (parser de messages)
  // ══════════════════════════════════════════════════════════

  // Endpoint appelé par sessionManager quand un message entrant arrive
  router.post('/webhook/message/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    const { from, body } = req.body;  // from = JID ex: 240555123456@s.whatsapp.net

    const tenant = repo.getTenant(tenantId);
    if (!tenant) return res.status(404).json({ ok: false });

    const text = (body || '').trim();
    const phone = from.split('@')[0].replace(/\D/g, '');

    // ── Déclencheur check-in ────────────────────────────────────────────
    const isCheckInTrigger = /enregistr|check.?in|checkin|bonjour.*chambre|je veux m.enregistrer/i.test(text);

    if (isCheckInTrigger) {
      const session = getSessionStatus(tenantId);
      if (session.status === 'connected') {
        const formMsg = `🏨 *${tenant.name} — Formulaire d'Enregistrement*\n\nMerci de répondre avec le format suivant :\n\n` +
          `Nom complet : \nNuméro CNI / Passeport : \nNuméro de chambre : \nDurée en jours : \nDurée en heures (optionnel) : \n\n` +
          `_Exemple:_\nNom complet : Marie Dupont\nNuméro CNI / Passeport : CNI-2024-001\nNuméro de chambre : 101\nDurée en jours : 2\nDurée en heures :`;
        try { await sendMessage(tenantId, phone, formMsg); } catch (e) {}
      }
      return res.json({ ok: true, action: 'form_sent' });
    }

    // ── Parser de formulaire rempli ─────────────────────────────────────
    const hasName  = /nom complet\s*:/i.test(text);
    const hasCni   = /cni|passeport|identit/i.test(text);
    const hasRoom  = /chambre\s*:/i.test(text);

    if (hasName && hasCni && hasRoom) {
      const extract = (label, str) => {
        const match = str.match(new RegExp(`${label}\\s*:\\s*(.+)`, 'i'));
        return match ? match[1].trim() : '';
      };

      const guestName    = extract('nom complet', text);
      const guestId      = extract('(cni|passeport|num.ro)', text);
      const roomNumber   = extract('(chambre|n.?chambre)', text).replace(/\D/g, '');
      const durationDays = Number(extract('(jours|durée en jours)', text).replace(/\D/g, '')) || 1;
      const durationHours= Number(extract('heures', text).replace(/\D/g, '')) || 0;

      if (!guestName || !roomNumber) return res.json({ ok: false, action: 'parse_failed' });

      const room = repo.getRoomByNumber(tenantId, roomNumber);
      const session = getSessionStatus(tenantId);

      if (!room) {
        if (session.status === 'connected') {
          try { await sendMessage(tenantId, phone, `❌ La chambre *${roomNumber}* n'existe pas. Veuillez vérifier le numéro.`); } catch (e) {}
        }
        return res.json({ ok: false, action: 'room_not_found' });
      }

      if (room.status === 'occupied') {
        if (session.status === 'connected') {
          try { await sendMessage(tenantId, phone, `❌ La chambre *${roomNumber}* est actuellement occupée. Veuillez contacter la réception.`); } catch (e) {}
        }
        return res.json({ ok: false, action: 'room_occupied' });
      }

      const stay = repo.createStay({ tenantId, roomNumber, guestName, guestId, guestPhone: phone, durationDays, durationHours });

      // Notification dashboard temps réel
      io.to(`dashboard:${tenantId}`).emit('room_updated', { rooms: repo.getRoomsByTenant(tenantId) });
      io.to(`dashboard:${tenantId}`).emit('stay_created', stay);

      logger.info(`[WhatsApp CheckIn] ${guestName} — Chambre ${roomNumber} — Stay ${stay.stayId}`);

      // Confirmation WhatsApp
      if (session.status === 'connected') {
        const checkOut = new Date(stay.checkOutAt).toLocaleString('fr-FR');
        const confirmMsg = `✅ *Enregistrement confirmé!*\n\n🏨 ${tenant.name}\n👤 *${guestName}*\n🚪 Chambre: *${roomNumber}*\n📅 Check-out: *${checkOut}*\n\n*Room Service disponible 24h/24:*\n${process.env.RENDER_URL}/room/${tenantId}/${roomNumber}\n\nBon séjour! 🙏`;
        try { await sendMessage(tenantId, phone, confirmMsg); } catch (e) {}
      }
      return res.json({ ok: true, action: 'checkin_done', stay });
    }

    // ── Demande de checkout via WhatsApp ────────────────────────────────
    const isCheckoutRequest = /checkout|check.?out|partir|quitter|r.?gler|ma facture/i.test(text);
    if (isCheckoutRequest) {
      // Chercher séjour actif par téléphone
      const allStays = repo.getStaysByTenant(tenantId);
      const activeStay = allStays.find(s => s.guestPhone === phone && s.status === 'active');
      if (activeStay) {
        repo.requestCheckout(activeStay.stayId);
        io.to(`dashboard:${tenantId}`).emit('checkout_requested', activeStay);
        const session = getSessionStatus(tenantId);
        if (session.status === 'connected') {
          const billMsg = `📋 *Votre demande de check-out a été transmise.*\n\nChambre: *${activeStay.roomNumber}*\nLa réception prépare votre facture et vous contactera très bientôt.`;
          try { await sendMessage(tenantId, phone, billMsg); } catch (e) {}
        }
      }
    }

    res.json({ ok: true, action: 'ignored' });
  });

  // ══════════════════════════════════════════════════════════
  // CHECK-OUT ET FACTURATION
  // ══════════════════════════════════════════════════════════

  // Demande de checkout depuis l'interface client
  router.post('/room/:tenantId/:roomNumber/checkout-request', async (req, res) => {
    const { tenantId, roomNumber } = req.params;
    const stay = repo.getActiveStay(tenantId, roomNumber);
    if (!stay) return res.status(404).json({ error: 'Aucun séjour actif' });

    repo.requestCheckout(stay.stayId);
    io.to(`dashboard:${tenantId}`).emit('checkout_requested', stay);

    const session = getSessionStatus(tenantId);
    const tenant  = repo.getTenant(tenantId);
    if (session.status === 'connected' && stay.guestPhone) {
      const msg = `📋 *Votre demande de check-out a été transmise.*\nLa réception vous contactera pour finaliser votre facture.`;
      try { await sendMessage(tenantId, stay.guestPhone, msg); } catch (e) {}
    }
    res.json({ success: true });
  });

  // Manager confirme le paiement et clôture le séjour
  router.post('/dashboard/:tenantId/stays/:stayId/checkout', async (req, res) => {
    const { tenantId, stayId } = req.params;
    const { paymentMethod } = req.body;

    const stay = repo.closeStay(stayId, paymentMethod || 'cash');
    if (!stay) return res.status(404).json({ error: 'Séjour introuvable' });

    const tenant  = repo.getTenant(tenantId);
    const orders  = repo.getOrdersByStay(tenantId, stay.roomNumber);

    // Notification dashboard
    io.to(`dashboard:${tenantId}`).emit('room_updated',   { rooms: repo.getRoomsByTenant(tenantId) });
    io.to(`dashboard:${tenantId}`).emit('stay_closed',    stay);

    // Facture WhatsApp automatique
    const session = getSessionStatus(tenantId);
    if (session.status === 'connected' && stay.guestPhone && tenant) {
      const dur = stay.durationHours > 0 ? `${stay.durationHours}h` : `${stay.durationDays} nuit(s)`;
      const orderLines = orders.filter(o => o.status !== 'cancelled').map(o =>
        `  ${o.items.map(i => `${i.name} ×${i.qty} = ${(i.price*i.qty).toLocaleString()} XAF`).join('\n  ')}`
      ).join('\n');

      const invoice = `🧾 *FACTURE — ${tenant.name}*\n${'─'.repeat(30)}\n👤 *${stay.guestName}*\n🚪 Chambre: *${stay.roomNumber}*\n📅 Check-in : ${new Date(stay.checkInAt).toLocaleString('fr-FR')}\n📅 Check-out: ${new Date(stay.closedAt).toLocaleString('fr-FR')}\n${'─'.repeat(30)}\n\n🏠 *Hébergement (${dur})*\n   ${stay.priceBase.toLocaleString()} XAF\n\n🍽️ *Room Service*\n${orderLines || '   Aucune consommation'}\n\n${'─'.repeat(30)}\n💰 *TOTAL: ${stay.totalDue.toLocaleString()} XAF*\n💳 Paiement: ${paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Espèces'}\n${'─'.repeat(30)}\n\nMerci pour votre confiance! 🙏\n_${tenant.name} — ${tenant.address}_`;

      try { await sendMessage(tenantId, stay.guestPhone, invoice); } catch (e) { logger.warn(`[Checkout] WA facture échoué: ${e.message}`); }
    }

    logger.info(`[Checkout] ${stayId} — ${stay.guestName} — Total: ${stay.totalDue} XAF`);
    res.json({ success: true, stay });
  });

  // Récupère la facture d'un séjour actif (pour page room service)
  router.get('/room/:tenantId/:roomNumber/bill', (req, res) => {
    const stay   = repo.getActiveStay(req.params.tenantId, req.params.roomNumber);
    const orders = repo.getOrdersByStay(req.params.tenantId, req.params.roomNumber);
    res.json({ stay, orders });
  });

  // ══════════════════════════════════════════════════════════
  // VUE CLIENT — ROOM SERVICE
  // ══════════════════════════════════════════════════════════

  router.get('/room/:tenantId/:roomNumber', (req, res) => {
    const { tenantId, roomNumber } = req.params;
    const tenant = repo.getTenant(tenantId);
    if (!tenant) return res.status(404).send('<h1>Hôtel introuvable</h1>');
    const menu       = repo.getMenu(tenantId);
    const activeStay = repo.getActiveStay(tenantId, roomNumber);
    const orders     = repo.getOrdersByStay(tenantId, roomNumber);
    res.send(renderRoom(tenant, roomNumber, menu, activeStay, orders));
  });

  router.post('/room/:tenantId/:roomNumber/order', async (req, res) => {
    const { tenantId, roomNumber } = req.params;
    const { items, note } = req.body;
    const tenant = repo.getTenant(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant introuvable' });
    if (!items || !items.length) return res.status(400).json({ error: 'Commande vide' });

    const stay  = repo.getActiveStay(tenantId, roomNumber);
    const order = repo.createOrder({ tenantId, roomNumber, clientPhone: stay?.guestPhone, items, note });

    io.to(`dashboard:${tenantId}`).emit('new_order', order);

    const session   = getSessionStatus(tenantId);
    const itemsList = items.map(i => `• ${i.name} ×${i.qty}${i.price > 0 ? ` — ${(i.price*i.qty).toLocaleString()} XAF` : ''}`).join('\n');
    const totalStr  = order.total > 0 ? `\n💰 *Sous-total: ${order.total.toLocaleString()} XAF*` : '';
    const guestLabel = stay ? `*${stay.guestName}* — ` : '';

    if (session.status === 'connected') {
      const staffMsg = `🏨 *${tenant.name}*\n📋 *Commande #${order.orderId.slice(-6).toUpperCase()}*\n🚪 ${guestLabel}Chambre *${roomNumber}*\n\n${itemsList}${totalStr}\n${note ? `📝 ${note}` : ''}\n⏰ ${new Date().toLocaleTimeString('fr-FR')}`;
      if (tenant.staffPhone) try { await sendMessage(tenantId, tenant.staffPhone, staffMsg); } catch (e) {}
    }

    res.json({ success: true, order });
  });

  // ── API Menu public ───────────────────────────────────────────────────
  router.get('/menu/:tenantId', (req, res) => res.json(repo.getMenu(req.params.tenantId)));

  return router;
}
