// ============================================================
// src/domains/shared/repository.js — Repository Pattern en mémoire
// Remplaceable par appels API PHP/MySQL via simple swap d'imports
// ============================================================
import { v4 as uuidv4 } from 'uuid';

// ── Base de données in-memory ──────────────────────────────────────────────
const tenants = new Map();       // tenantId → TenantRecord
const orders = new Map();        // orderId → OrderRecord

// Données de démonstration préchargées
_seedDemoData();

// ── TENANTS ────────────────────────────────────────────────────────────────

/**
 * Crée un nouveau tenant (hôtel).
 * @returns {TenantRecord}
 */
export function createTenant({ name, address, staffPhone, primaryColor, logoText }) {
  const tenantId = `tenant_${uuidv4().split('-')[0]}`;
  const tenant = {
    tenantId,
    name: name || 'Hôtel Inconnu',
    address: address || 'Bata, Guinée Équatoriale',
    staffPhone: staffPhone || '',   // Numéro WhatsApp du staff (notifications)
    primaryColor: primaryColor || '#1a1a2e',
    logoText: logoText || name?.substring(0, 2).toUpperCase() || 'HD',
    createdAt: new Date().toISOString(),
    active: true,
  };
  tenants.set(tenantId, tenant);
  return tenant;
}

export function getTenant(tenantId) {
  return tenants.get(tenantId) || null;
}

export function getAllTenants() {
  return Array.from(tenants.values());
}

export function updateTenant(tenantId, data) {
  const tenant = tenants.get(tenantId);
  if (!tenant) return null;
  Object.assign(tenant, data);
  return tenant;
}

// ── COMMANDES / ORDERS ─────────────────────────────────────────────────────

/**
 * Enregistre une nouvelle commande de room service.
 * @returns {OrderRecord}
 */
export function createOrder({ tenantId, roomNumber, clientPhone, items, note }) {
  const orderId = `order_${uuidv4().split('-')[0]}`;
  const order = {
    orderId,
    tenantId,
    roomNumber,
    clientPhone: clientPhone || null,
    items,         // Array<{ name, qty, price }>
    note: note || '',
    status: 'pending', // pending | confirmed | delivered | cancelled
    total: items.reduce((sum, i) => sum + (i.price * i.qty), 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.set(orderId, order);
  return order;
}

export function getOrdersByTenant(tenantId) {
  return Array.from(orders.values())
    .filter(o => o.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateOrderStatus(orderId, status) {
  const order = orders.get(orderId);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  return order;
}

// ── MENU (statique, par tenant) ────────────────────────────────────────────
const DEFAULT_MENU = [
  { id: 'cafe',      name: 'Café Expresso',       price: 1500,  category: 'Boissons',   emoji: '☕' },
  { id: 'eau',       name: 'Eau Minérale 50cl',   price: 800,   category: 'Boissons',   emoji: '💧' },
  { id: 'jus',       name: 'Jus de Fruits Frais', price: 2000,  category: 'Boissons',   emoji: '🍊' },
  { id: 'croissant', name: 'Croissant Beurré',    price: 1200,  category: 'Pâtisseries',emoji: '🥐' },
  { id: 'toast',     name: 'Toast Jambon-Fromage',price: 2500,  category: 'Restauration',emoji: '🍞' },
  { id: 'serviette', name: 'Serviettes Propres',  price: 0,     category: 'Services',   emoji: '🛁' },
  { id: 'menage',    name: 'Ménage Chambre',       price: 0,     category: 'Services',   emoji: '🧹' },
  { id: 'taxi',      name: 'Réservation Taxi',     price: 0,     category: 'Conciergerie',emoji: '🚗' },
  { id: 'reveil',    name: 'Service Réveil',       price: 0,     category: 'Conciergerie',emoji: '⏰' },
];

export function getMenu(tenantId) {
  // Extensible: requête MySQL par tenant_id plus tard
  return DEFAULT_MENU;
}

// ── Données de démo ────────────────────────────────────────────────────────
function _seedDemoData() {
  const h1 = createTenant({
    name: 'Hôtel Continental Bata',
    address: 'Avenue de l\'Indépendance, Bata',
    staffPhone: '240000000001',
    primaryColor: '#0f3460',
    logoText: 'HC',
  });

  const h2 = createTenant({
    name: 'Palace Résidence',
    address: 'Boulevard du Littoral, Bata',
    staffPhone: '240000000002',
    primaryColor: '#4a0e0e',
    logoText: 'PR',
  });

  // Commandes de démo
  createOrder({ tenantId: h1.tenantId, roomNumber: '101', items: [{ name: 'Café Expresso', qty: 2, price: 1500 }], clientPhone: '240111222333' });
  createOrder({ tenantId: h1.tenantId, roomNumber: '205', items: [{ name: 'Eau Minérale 50cl', qty: 3, price: 800 }, { name: 'Croissant Beurré', qty: 2, price: 1200 }] });
  createOrder({ tenantId: h2.tenantId, roomNumber: '302', items: [{ name: 'Ménage Chambre', qty: 1, price: 0 }] });
}
