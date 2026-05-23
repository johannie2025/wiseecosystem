// ============================================================
// src/domains/restaurant/routes.js — Domaine Restaurant
// Wise Design Smart Ecosystem — Multi-tenant WhatsApp SaaS
// Features: Commandes WA · Réservations · Menu · Fidélité · Promos
// ============================================================
import { Router } from 'express';
import * as repo from '../shared/repository.js';
import * as rRepo from './repository.js';
import { initSession, getSessionStatus, destroySession, sendMessage } from '../../core/sessionManager.js';
import { renderRestaurantDashboard, renderRestaurantConfig, renderRestaurantSuperAdmin } from './views.js';

// ── État de conversation WhatsApp (en mémoire, par restaurant) ────────────
// Map: `${tenantId}:${phone}` → { step, cart, lastActivity }
const conversations = new Map();

function getConv(tenantId, phone) {
  const key = `${tenantId}:${phone}`;
  if (!conversations.has(key)) {
    conversations.set(key, { step: 'idle', cart: [], lastActivity: Date.now(), lastOrderId: null });
  }
  const conv = conversations.get(key);
  conv.lastActivity = Date.now();
  return conv;
}

function resetConv(tenantId, phone) {
  const key = `${tenantId}:${phone}`;
  conversations.set(key, { step: 'idle', cart: [], lastActivity: Date.now(), lastOrderId: null });
}

// Nettoyage des conversations inactives (> 30 min)
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, conv] of conversations.entries()) {
    if (conv.lastActivity < cutoff) conversations.delete(key);
  }
}, 10 * 60 * 1000);

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = n => Number(n || 0).toLocaleString('fr-FR');

function buildMenuText(menu) {
  const categories = {};
  menu.filter(i => i.available !== false).forEach(item => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  });
  let text = '🍽️ *Notre Carte*\n' + '─'.repeat(28) + '\n\n';
  for (const [cat, items] of Object.entries(categories)) {
    text += `*${cat}*\n`;
    items.forEach(i => {
      text += `  ${i.emoji || '•'} ${i.name} — *${fmt(i.price)} XAF*\n`;
    });
    text += '\n';
  }
  text += '─'.repeat(28) + '\n';
  text += '📝 Pour commander, tapez ex:\n_commander poulet dg + riz + 2 bières_\n';
  text += '📅 Réserver: _réserver 2 places 19h30_\n';
  text += '💬 Aide: _aide_';
  return text;
}

function parseOrderFromText(text, menu) {
  const items = [];
  const availableMenu = menu.filter(i => i.available !== false);

  // Nettoyer et split par +, virgule, "et", "avec"
  const rawParts = text
    .replace(/^(commander|commande|je veux|je voudrais|donner moi|donnez moi|je prends?)\s*/i, '')
    .split(/[+,]|\bet\b|\bavec\b/i)
    .map(p => p.trim())
    .filter(Boolean);

  for (const part of rawParts) {
    // Extraire quantité (ex: "2 bières", "trois poulets")
    const qtyMatch = part.match(/^(\d+|une?|deux|trois|quatre|cinq)\s+/i);
    const qtyMap = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 };
    let qty = 1;
    let namePart = part;
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1]) || qtyMap[qtyMatch[1].toLowerCase()] || 1;
      namePart = part.slice(qtyMatch[0].length).trim();
    }

    // Trouver l'article le plus proche dans le menu (fuzzy match)
    const searchStr = namePart.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àâ]/g, 'a').replace(/[ùû]/g, 'u').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o');
    let bestMatch = null;
    let bestScore = 0;
    for (const item of availableMenu) {
      const itemName = item.name.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àâ]/g, 'a').replace(/[ùû]/g, 'u').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o');
      // Score simple : longueur du plus long préfixe/sous-chaîne commun
      const words = searchStr.split(/\s+/);
      let score = 0;
      for (const w of words) {
        if (w.length >= 3 && itemName.includes(w)) score += w.length;
      }
      if (score > bestScore) { bestScore = score; bestMatch = item; }
    }
    if (bestMatch && bestScore >= 3) {
      const existing = items.find(i => i.id === bestMatch.id);
      if (existing) existing.qty += qty;
      else items.push({ id: bestMatch.id, name: bestMatch.name, price: bestMatch.price, qty, emoji: bestMatch.emoji || '🍽️' });
    }
  }
  return items;
}

function buildCartText(cart, restaurantName) {
  if (!cart.length) return '🛒 Votre panier est vide.';
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let text = `🛒 *Votre panier — ${restaurantName}*\n` + '─'.repeat(28) + '\n\n';
  cart.forEach(i => {
    text += `${i.emoji} ${i.name} ×${i.qty} = *${fmt(i.price * i.qty)} XAF*\n`;
  });
  text += '\n' + '─'.repeat(28) + '\n';
  text += `💰 *Total: ${fmt(total)} XAF*\n\n`;
  text += '✅ Tapez *payer* pour passer commande\n';
  text += '❌ Tapez *annuler* pour vider le panier\n';
  text += '➕ Ou continuez à ajouter des articles';
  return text;
}

function buildPaymentText(cart, restaurantName, paymentMethods) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let text = `💳 *Choisissez votre mode de paiement*\n`;
  text += `💰 Total: *${fmt(total)} XAF*\n\n`;
  if (paymentMethods?.cash !== false) text += `1️⃣ *Cash* — À la livraison / sur place\n`;
  if (paymentMethods?.orangeMoney !== false) text += `2️⃣ *Orange Money* — Paiement mobile\n`;
  if (paymentMethods?.moMo !== false) text += `3️⃣ *MoMo MTN* — Paiement mobile\n`;
  text += `\nRépondez avec le numéro (1, 2 ou 3)`;
  return text;
}

// ── Router Export ──────────────────────────────────────────────────────────
export function restaurantRouter(io, logger) {
  const router = Router();

  // ══════════════════════════════════════════════════════════
  // SUPERADMIN RESTAURANT
  // ══════════════════════════════════════════════════════════

  router.get('/restaurant/admin', (req, res) => {
    const secret = req.query.secret || req.headers['x-admin-secret'];
    if (secret !== process.env.SUPERADMIN_SECRET) return res.status(401).send('<h1>401 — Accès non autorisé</h1>');
    res.send(renderRestaurantSuperAdmin(rRepo.getAllRestaurants()));
  });

  router.post('/restaurant/admin/create', (req, res) => {
    const secret = req.headers['x-admin-secret'] || req.body?.adminSecret;
    if (secret !== process.env.SUPERADMIN_SECRET) return res.status(401).json({ error: 'Non autorisé' });
    const { name, address, staffPhone, cuisineType, openingHours } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const restaurant = rRepo.createRestaurant({ name, address, staffPhone, cuisineType, openingHours });
    logger.info(`[RestauAdmin] Restaurant créé: ${restaurant.tenantId} — ${name}`);
    res.json({ success: true, restaurant });
  });

  // ══════════════════════════════════════════════════════════
  // DASHBOARD RESTAURANT
  // ══════════════════════════════════════════════════════════

  router.get('/restaurant/dashboard/:tenantId', (req, res) => {
    const { tenantId } = req.params;
    const restaurant = rRepo.getRestaurant(tenantId);
    if (!restaurant) return res.status(404).send('<h1>Restaurant introuvable</h1>');
    const sessionStatus  = getSessionStatus(tenantId);
    const orders         = rRepo.getRestaurantOrders(tenantId);
    const tables         = rRepo.getTables(tenantId);
    const reservations   = rRepo.getReservations(tenantId);
    const stats          = rRepo.getRestaurantStats(tenantId);
    const customers      = rRepo.getCustomers(tenantId);
    res.send(renderRestaurantDashboard(restaurant, sessionStatus, orders, tables, reservations, stats, customers));
  });

  // ── WhatsApp Session ────────────────────────────────────────────────────
  router.post('/restaurant/dashboard/:tenantId/connect', async (req, res) => {
    const { tenantId } = req.params;
    if (!rRepo.getRestaurant(tenantId)) return res.status(404).json({ error: 'Restaurant introuvable' });
    try {
      await initSession(tenantId, io, logger);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/restaurant/dashboard/:tenantId/disconnect', async (req, res) => {
    await destroySession(req.params.tenantId, logger);
    res.json({ success: true });
  });

  router.get('/restaurant/dashboard/:tenantId/status', (req, res) => {
    res.json(getSessionStatus(req.params.tenantId));
  });

  // ── API Données ─────────────────────────────────────────────────────────
  router.get('/restaurant/dashboard/:tenantId/orders', (req, res) => {
    res.json(rRepo.getRestaurantOrders(req.params.tenantId));
  });

  router.get('/restaurant/dashboard/:tenantId/tables', (req, res) => {
    res.json(rRepo.getTables(req.params.tenantId));
  });

  router.get('/restaurant/dashboard/:tenantId/reservations', (req, res) => {
    res.json(rRepo.getReservations(req.params.tenantId));
  });

  router.get('/restaurant/dashboard/:tenantId/stats', (req, res) => {
    res.json(rRepo.getRestaurantStats(req.params.tenantId));
  });

  router.get('/restaurant/dashboard/:tenantId/customers', (req, res) => {
    res.json(rRepo.getCustomers(req.params.tenantId));
  });

  // ── Gestion commandes ───────────────────────────────────────────────────
  router.patch('/restaurant/orders/:orderId/status', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = rRepo.updateRestaurantOrderStatus(orderId, status);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    io.to(`dashboard:${order.tenantId}`).emit('resto_order_updated', order);

    // Notification WhatsApp client si commande confirmée ou prête
    const restaurant = rRepo.getRestaurant(order.tenantId);
    const session = getSessionStatus(order.tenantId);
    if (session.status === 'connected' && order.clientPhone && restaurant) {
      let msg = null;
      if (status === 'confirmed') {
        msg = `✅ *${restaurant.name}*\nVotre commande #${order.orderId.slice(-6).toUpperCase()} est *confirmée* et en préparation ! 🍳\n⏱️ Temps estimé: 15-20 min`;
      } else if (status === 'ready') {
        msg = `🔔 *${restaurant.name}*\nVotre commande est *prête* ! 🍽️\n#${order.orderId.slice(-6).toUpperCase()} — Bonne dégustation !`;
      } else if (status === 'cancelled') {
        msg = `❌ *${restaurant.name}*\nDésolé, votre commande #${order.orderId.slice(-6).toUpperCase()} a été annulée.\nContactez-nous pour plus d'info.`;
      }
      if (msg) try { await sendMessage(order.tenantId, order.clientPhone, msg); } catch (e) {}
    }
    res.json({ success: true, order });
  });

  // ══════════════════════════════════════════════════════════
  // CONFIGURATION RESTAURANT (CRUD)
  // ══════════════════════════════════════════════════════════

  router.get('/restaurant/config/:tenantId', (req, res) => {
    const restaurant = rRepo.getRestaurant(req.params.tenantId);
    if (!restaurant) return res.status(404).send('<h1>Restaurant introuvable</h1>');
    const menu   = rRepo.getRestaurantMenu(req.params.tenantId);
    const tables = rRepo.getTables(req.params.tenantId);
    res.send(renderRestaurantConfig(restaurant, menu, tables));
  });

  router.patch('/restaurant/config/:tenantId/settings', (req, res) => {
    const r = rRepo.updateRestaurant(req.params.tenantId, req.body);
    if (!r) return res.status(404).json({ error: 'Restaurant introuvable' });
    res.json({ success: true, restaurant: r });
  });

  // ── CRUD Menu ───────────────────────────────────────────────────────────
  router.get('/restaurant/config/:tenantId/menu', (req, res) => {
    res.json(rRepo.getRestaurantMenu(req.params.tenantId));
  });

  router.post('/restaurant/config/:tenantId/menu', (req, res) => {
    const { name, price, category, emoji, description, photoUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const item = rRepo.addRestaurantMenuItem(req.params.tenantId, { name, price, category, emoji, description, photoUrl });
    res.json({ success: true, item });
  });

  router.patch('/restaurant/config/:tenantId/menu/:itemId', (req, res) => {
    const item = rRepo.updateRestaurantMenuItem(req.params.tenantId, req.params.itemId, req.body);
    if (!item) return res.status(404).json({ error: 'Article introuvable' });
    res.json({ success: true, item });
  });

  router.delete('/restaurant/config/:tenantId/menu/:itemId', (req, res) => {
    const ok = rRepo.deleteRestaurantMenuItem(req.params.tenantId, req.params.itemId);
    if (!ok) return res.status(404).json({ error: 'Article introuvable' });
    res.json({ success: true });
  });

  // ── CRUD Tables ─────────────────────────────────────────────────────────
  router.post('/restaurant/config/:tenantId/tables', (req, res) => {
    const { number, capacity, location } = req.body;
    if (!number) return res.status(400).json({ error: 'Numéro requis' });
    const table = rRepo.addTable(req.params.tenantId, { number, capacity, location });
    io.to(`dashboard:${req.params.tenantId}`).emit('resto_table_updated', { tables: rRepo.getTables(req.params.tenantId) });
    res.json({ success: true, table });
  });

  router.patch('/restaurant/config/:tenantId/tables/:tableId', (req, res) => {
    const table = rRepo.updateTable(req.params.tableId, req.body);
    if (!table) return res.status(404).json({ error: 'Table introuvable' });
    io.to(`dashboard:${req.params.tenantId}`).emit('resto_table_updated', { tables: rRepo.getTables(req.params.tenantId) });
    res.json({ success: true, table });
  });

  router.patch('/restaurant/config/:tenantId/tables/:tableId/status', (req, res) => {
    const table = rRepo.updateTable(req.params.tableId, { status: req.body.status });
    if (!table) return res.status(404).json({ error: 'Table introuvable' });
    io.to(`dashboard:${req.params.tenantId}`).emit('resto_table_updated', { tables: rRepo.getTables(req.params.tenantId) });
    res.json({ success: true, table });
  });

  router.delete('/restaurant/config/:tenantId/tables/:tableId', (req, res) => {
    const ok = rRepo.deleteTable(req.params.tableId);
    if (!ok) return res.status(404).json({ error: 'Table introuvable' });
    io.to(`dashboard:${req.params.tenantId}`).emit('resto_table_updated', { tables: rRepo.getTables(req.params.tenantId) });
    res.json({ success: true });
  });

  // ── Réservations ────────────────────────────────────────────────────────
  router.post('/restaurant/dashboard/:tenantId/reservations', async (req, res) => {
    const { tenantId } = req.params;
    const { clientName, clientPhone, partySize, date, time, tableId, note } = req.body;
    if (!clientName || !partySize || !date || !time) return res.status(400).json({ error: 'Données incomplètes' });
    const reservation = rRepo.createReservation({ tenantId, clientName, clientPhone, partySize, date, time, tableId, note });
    io.to(`dashboard:${tenantId}`).emit('resto_reservation_created', reservation);

    // Confirmation WA
    const session = getSessionStatus(tenantId);
    const restaurant = rRepo.getRestaurant(tenantId);
    if (session.status === 'connected' && clientPhone && restaurant) {
      const msg = `✅ *Réservation confirmée — ${restaurant.name}*\n\n👤 ${clientName}\n👥 ${partySize} personne(s)\n📅 ${date} à ${time}\n\nNous vous attendons ! 🍽️`;
      try { await sendMessage(tenantId, clientPhone, msg); } catch (e) {}
    }
    res.json({ success: true, reservation });
  });

  router.patch('/restaurant/dashboard/:tenantId/reservations/:reservationId/status', (req, res) => {
    const res2 = rRepo.updateReservationStatus(req.params.reservationId, req.body.status);
    if (!res2) return res.status(404).json({ error: 'Réservation introuvable' });
    io.to(`dashboard:${req.params.tenantId}`).emit('resto_reservation_updated', res2);
    res.json({ success: true, reservation: res2 });
  });

  // ── Promotions / Menu du jour ────────────────────────────────────────────
  router.post('/restaurant/dashboard/:tenantId/broadcast', async (req, res) => {
    const { tenantId } = req.params;
    const { message, targetAll } = req.body;
    if (!message) return res.status(400).json({ error: 'Message requis' });

    const session = getSessionStatus(tenantId);
    if (session.status !== 'connected') return res.status(400).json({ error: 'WhatsApp non connecté' });

    const customers = rRepo.getCustomers(tenantId);
    const targets = targetAll
      ? customers
      : customers.filter(c => c.orderCount >= 2); // clients récurrents

    let sent = 0;
    for (const customer of targets) {
      if (!customer.phone) continue;
      try {
        await sendMessage(tenantId, customer.phone, message);
        sent++;
        await new Promise(r => setTimeout(r, 800)); // anti-ban delay
      } catch (e) { logger.warn(`[Broadcast] Failed to send to ${customer.phone}: ${e.message}`); }
    }
    logger.info(`[Broadcast] ${tenantId} — ${sent}/${targets.length} messages envoyés`);
    res.json({ success: true, sent, total: targets.length });
  });

  // ══════════════════════════════════════════════════════════
  // WEBHOOK WHATSAPP — Bot de commande restaurant
  // ══════════════════════════════════════════════════════════

  router.post('/restaurant/webhook/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    const { from, body: rawBody } = req.body;

    const restaurant = rRepo.getRestaurant(tenantId);
    if (!restaurant) return res.status(404).json({ ok: false });

    const text = (rawBody || '').trim();
    const phone = from.split('@')[0].replace(/\D/g, '');
    const conv = getConv(tenantId, phone);
    const menu = rRepo.getRestaurantMenu(tenantId);

    const reply = async (msg) => {
      const session = getSessionStatus(tenantId);
      if (session.status === 'connected') {
        try { await sendMessage(tenantId, phone, msg); } catch (e) {
          logger.warn(`[RestoBot:${tenantId}] Envoi WA échoué: ${e.message}`);
        }
      }
    };

    const tl = text.toLowerCase();

    // ── Salutations & aide ──────────────────────────────────────────────
    if (/^(bonjour|salut|bonsoir|hello|hi|coucou|allo|aide|help|start|menu|carte|qu.est.ce|que proposez|info)/i.test(tl) && conv.step === 'idle') {
      const welcomeMsg = `🌟 *Bienvenue chez ${restaurant.name}* 🌟\n${restaurant.cuisineType ? `_${restaurant.cuisineType}_` : ''}\n\n` +
        `Que puis-je faire pour vous ?\n\n` +
        `🍽️ Taper *menu* — Voir notre carte\n` +
        `🛒 Taper *commander ...* — Passer commande\n` +
        `📅 Taper *réserver ...* — Réserver une table\n` +
        `🛒 Taper *panier* — Voir mon panier\n` +
        `❓ Taper *aide* — Ce message d'aide\n\n` +
        `_${restaurant.openingHours || 'Ouvert tous les jours'}_`;
      await reply(welcomeMsg);
      return res.json({ ok: true, action: 'welcome' });
    }

    // ── Afficher le menu ────────────────────────────────────────────────
    if (/^(menu|carte|la carte|voir le menu|carte du jour|qu.est.ce.*(vous avez|vous proposez|vous servez))/i.test(tl)) {
      await reply(buildMenuText(menu));
      conv.step = 'browsing';
      return res.json({ ok: true, action: 'menu_sent' });
    }

    // ── Voir panier ─────────────────────────────────────────────────────
    if (/^(panier|mon panier|ma commande en cours|basket)/i.test(tl)) {
      await reply(buildCartText(conv.cart, restaurant.name));
      return res.json({ ok: true, action: 'cart_shown' });
    }

    // ── Annuler panier ──────────────────────────────────────────────────
    if (/^(annuler|vider|effacer|cancel|reset|recommencer)/i.test(tl)) {
      resetConv(tenantId, phone);
      await reply(`❌ Votre panier a été vidé.\nTapez *menu* pour recommencer.`);
      return res.json({ ok: true, action: 'cart_cleared' });
    }

    // ── Réservation de table ────────────────────────────────────────────
    const reserveMatch = tl.match(/r[eé]server\s+(\d+)\s+(?:place|personne|couvert|adulte)s?\s+(?:à|a|pour)?\s*(\d{1,2}[h:]\d{0,2}|\d{1,2}h)/i) ||
                         tl.match(/(?:une |une\s+)?table\s+(?:pour\s+)?(\d+)\s+(?:à|a)\s*(\d{1,2}[h:]\d{0,2}|\d{1,2}h)/i);
    if (reserveMatch || /^r[eé]server/i.test(tl)) {
      if (reserveMatch) {
        const partySize = parseInt(reserveMatch[1]);
        const timeRaw = reserveMatch[2].replace('h', ':').replace(/:\s*$/, ':00');
        const today = new Date().toISOString().split('T')[0];

        // Chercher si mention "demain"
        const date = /demain/i.test(tl)
          ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
          : today;

        const reservation = rRepo.createReservation({
          tenantId,
          clientName: `Client WA ${phone.slice(-4)}`,
          clientPhone: phone,
          partySize,
          date,
          time: timeRaw,
          note: `Réservé via WhatsApp — "${text}"`,
        });

        io.to(`dashboard:${tenantId}`).emit('resto_reservation_created', reservation);

        const confirmMsg = `✅ *Réservation enregistrée !*\n\n🏠 ${restaurant.name}\n👥 ${partySize} personne(s)\n📅 ${date === today ? "Aujourd'hui" : 'Demain'} à ${timeRaw}\n\n_Référence: #${reservation.reservationId.slice(-6).toUpperCase()}_\n\nNous vous attendons ! 🙏\nPour annuler: tapez *annuler réservation*`;
        await reply(confirmMsg);

        // Notifier staff
        const staffMsg = `📅 *Nouvelle réservation !*\n👥 ${partySize} personnes\n📱 ${phone}\n⏰ ${date} à ${timeRaw}\n#${reservation.reservationId.slice(-6).toUpperCase()}`;
        if (restaurant.staffPhone) try { await sendMessage(tenantId, restaurant.staffPhone, staffMsg); } catch (e) {}

        return res.json({ ok: true, action: 'reservation_created', reservation });
      } else {
        // Demander les détails
        await reply(`📅 *Réservation de table*\n\nPour réserver, précisez:\n_réserver [nb personnes] places à [heure]_\n\nEx: _réserver 4 places à 20h00_\n\nVos disponibilités: ${restaurant.openingHours || 'Nous contacter'}`);
        conv.step = 'awaiting_reservation_details';
        return res.json({ ok: true, action: 'reservation_prompt' });
      }
    }

    // ── Commander des plats ─────────────────────────────────────────────
    const isOrderIntent = /^(commander|commande|je (veux|voudrais|prends?)|donner|servez|apporter|je (prendrai|peux avoir)|un |une |du |de la |des )/i.test(tl);
    if (isOrderIntent || conv.step === 'ordering') {
      const newItems = parseOrderFromText(text, menu);
      if (newItems.length > 0) {
        // Ajouter au panier existant
        for (const ni of newItems) {
          const existing = conv.cart.find(i => i.id === ni.id);
          if (existing) existing.qty += ni.qty;
          else conv.cart.push(ni);
        }
        conv.step = 'ordering';
        const cartText = buildCartText(conv.cart, restaurant.name);
        const addedText = newItems.map(i => `✅ ${i.emoji} ${i.name} ×${i.qty}`).join('\n');
        await reply(`*Ajouté à votre panier:*\n${addedText}\n\n${cartText}`);
        return res.json({ ok: true, action: 'items_added', newItems });
      } else {
        // Rien compris — envoyer menu
        await reply(`❓ Je n'ai pas reconnu les articles.\n\nVoici notre carte :\n\n${buildMenuText(menu)}`);
        return res.json({ ok: true, action: 'not_recognized' });
      }
    }

    // ── Payer ───────────────────────────────────────────────────────────
    if (/^(payer|paiement|je paie|finaliser|confirmer|valider|checkout)/i.test(tl)) {
      if (!conv.cart.length) {
        await reply(`🛒 Votre panier est vide.\nTapez *menu* pour voir notre carte.`);
        return res.json({ ok: true, action: 'empty_cart' });
      }
      conv.step = 'awaiting_payment';
      await reply(buildPaymentText(conv.cart, restaurant.name, restaurant.paymentMethods));
      return res.json({ ok: true, action: 'payment_prompt' });
    }

    // ── Choix du mode de paiement ───────────────────────────────────────
    if (conv.step === 'awaiting_payment') {
      let paymentMethod = null;
      if (/^1|cash|espèces?|liquide/i.test(tl)) paymentMethod = 'cash';
      else if (/^2|orange|om/i.test(tl)) paymentMethod = 'orange_money';
      else if (/^3|momo|mtn/i.test(tl)) paymentMethod = 'momo';

      if (paymentMethod) {
        const total = conv.cart.reduce((s, i) => s + i.price * i.qty, 0);
        const order = rRepo.createRestaurantOrder({
          tenantId,
          clientPhone: phone,
          clientName: `Client ${phone.slice(-4)}`,
          items: [...conv.cart],
          paymentMethod,
          total,
        });

        // Mise à jour client fidélité
        rRepo.upsertCustomer(tenantId, { phone, orderCount: 1, totalSpent: total });

        // Notification dashboard
        io.to(`dashboard:${tenantId}`).emit('resto_new_order', order);

        // Ticket cuisine
        const itemsList = conv.cart.map(i => `• ${i.emoji} ${i.name} ×${i.qty}`).join('\n');
        const payLabel = { cash: 'Cash', orange_money: 'Orange Money', momo: 'MoMo MTN' }[paymentMethod] || paymentMethod;
        const staffMsg = `🍽️ *${restaurant.name}*\n🆕 *Commande #${order.orderId.slice(-6).toUpperCase()}*\n📱 Client: ${phone}\n\n${itemsList}\n\n💰 *${fmt(total)} XAF* — ${payLabel}\n⏰ ${new Date().toLocaleTimeString('fr-FR')}`;
        if (restaurant.staffPhone) try { await sendMessage(tenantId, restaurant.staffPhone, staffMsg); } catch (e) {}

        // Lien de paiement mobile money si applicable
        let paymentMsg = '';
        if (paymentMethod === 'orange_money' && restaurant.omPaymentUrl) {
          paymentMsg = `\n\n💳 *Lien de paiement Orange Money:*\n${restaurant.omPaymentUrl}?amount=${total}&ref=${order.orderId.slice(-6)}`;
        } else if (paymentMethod === 'momo' && restaurant.momoPaymentUrl) {
          paymentMsg = `\n\n💳 *Lien de paiement MoMo:*\n${restaurant.momoPaymentUrl}?amount=${total}&ref=${order.orderId.slice(-6)}`;
        }

        const confirmMsg = `✅ *Commande confirmée !*\n\n🏠 ${restaurant.name}\n#${order.orderId.slice(-6).toUpperCase()}\n\n${itemsList}\n\n💰 *Total: ${fmt(total)} XAF*\n💳 Paiement: ${payLabel}${paymentMsg}\n\n⏱️ En préparation...\nNous vous tiendrons informé(e) ! 🙏`;
        await reply(confirmMsg);

        resetConv(tenantId, phone);
        logger.info(`[RestoBot:${tenantId}] Commande ${order.orderId} — ${phone} — ${fmt(total)} XAF`);
        return res.json({ ok: true, action: 'order_placed', order });
      } else {
        await reply(`❓ Répondez avec *1* (Cash), *2* (Orange Money) ou *3* (MoMo)`);
        return res.json({ ok: true, action: 'payment_invalid' });
      }
    }

    // ── Annuler réservation ─────────────────────────────────────────────
    if (/annuler\s+r[eé]servation/i.test(tl)) {
      const myReservations = rRepo.getReservationsByPhone(tenantId, phone);
      const active = myReservations.find(r => r.status === 'confirmed');
      if (active) {
        rRepo.updateReservationStatus(active.reservationId, 'cancelled');
        io.to(`dashboard:${tenantId}`).emit('resto_reservation_updated', active);
        await reply(`❌ Votre réservation du *${active.date}* à *${active.time}* a été annulée.\n\nÀ bientôt ! 🙏`);
      } else {
        await reply(`ℹ️ Aucune réservation active trouvée pour ce numéro.`);
      }
      return res.json({ ok: true, action: 'reservation_cancelled' });
    }

    // ── Ma dernière commande ────────────────────────────────────────────
    if (/ma commande|statut commande|où en est|suivi/i.test(tl)) {
      const myOrders = rRepo.getOrdersByPhone(tenantId, phone);
      if (myOrders.length > 0) {
        const last = myOrders[0];
        const statusLabel = { pending: '⏳ En attente', confirmed: '✅ Confirmée', preparing: '👨‍🍳 En préparation', ready: '🔔 Prête !', served: '✅ Servie', cancelled: '❌ Annulée' };
        const msg = `📋 *Votre dernière commande*\n#${last.orderId.slice(-6).toUpperCase()}\nStatut: ${statusLabel[last.status] || last.status}\n💰 ${fmt(last.total)} XAF\n⏰ ${new Date(last.createdAt).toLocaleTimeString('fr-FR')}`;
        await reply(msg);
      } else {
        await reply(`ℹ️ Aucune commande trouvée.\nTapez *menu* pour commander !`);
      }
      return res.json({ ok: true, action: 'order_status' });
    }

    // ── Fallback: menu si rien compris ──────────────────────────────────
    if (conv.step === 'idle' || conv.step === 'browsing') {
      await reply(`ℹ️ Je n'ai pas compris.\n\nVoici ce que je peux faire :\n• *menu* — Voir la carte\n• *commander [plat]* — Commander\n• *réserver [n] places à [heure]* — Réserver\n• *panier* — Voir mon panier\n• *payer* — Finaliser commande`);
    }

    res.json({ ok: true, action: 'fallback' });
  });

  // ══════════════════════════════════════════════════════════
  // MENU PUBLIC API
  // ══════════════════════════════════════════════════════════
  router.get('/restaurant/menu/:tenantId', (req, res) => {
    res.json(rRepo.getRestaurantMenu(req.params.tenantId));
  });

  return router;
}
