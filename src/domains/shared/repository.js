// ============================================================
// src/domains/shared/repository.js — Repository in-memory
// Remplaceable par MySQL/API PHP via swap d'imports
// ============================================================
import { v4 as uuidv4 } from 'uuid';

// ── Stores ─────────────────────────────────────────────────────────────────
const tenants  = new Map();   // tenantId → TenantRecord
const rooms    = new Map();   // roomId   → RoomRecord
const stays    = new Map();   // stayId   → StayRecord
const orders   = new Map();   // orderId  → OrderRecord
const menus    = new Map();   // tenantId → MenuItem[]

// ── TENANTS ────────────────────────────────────────────────────────────────

export function createTenant({ name, address, staffPhone, primaryColor, logoText }) {
  const tenantId = `tenant_${uuidv4().split('-')[0]}`;
  const tenant = {
    tenantId,
    name: name || 'Hôtel Inconnu',
    address: address || 'Bata, Guinée Équatoriale',
    staffPhone: staffPhone || '',
    primaryColor: primaryColor || '#1a1a2e',
    logoText: logoText || name?.substring(0, 2).toUpperCase() || 'HD',
    createdAt: new Date().toISOString(),
    active: true,
  };
  tenants.set(tenantId, tenant);
  return tenant;
}

export function getTenant(tenantId) { return tenants.get(tenantId) || null; }
export function getAllTenants() { return Array.from(tenants.values()); }
export function updateTenant(tenantId, data) {
  const t = tenants.get(tenantId);
  if (!t) return null;
  Object.assign(t, data);
  return t;
}

// ── CHAMBRES ───────────────────────────────────────────────────────────────
// Statuts: available | occupied | cleaning | out_of_service | checkout_pending

export function addRoom(tenantId, { number, type, pricePerNight, pricePerHour, floor, description }) {
  const roomId = `room_${uuidv4().split('-')[0]}`;
  const room = {
    roomId, tenantId,
    number: String(number),
    type: type || 'Standard',          // Standard | Deluxe | Suite
    pricePerNight: Number(pricePerNight) || 25000,
    pricePerHour:  Number(pricePerHour)  || 5000,
    floor: floor || '1',
    description: description || '',
    status: 'available',               // available | occupied | cleaning | out_of_service | checkout_pending
    active: true,
    createdAt: new Date().toISOString(),
  };
  rooms.set(roomId, room);
  return room;
}

export function getRoomsByTenant(tenantId) {
  return Array.from(rooms.values())
    .filter(r => r.tenantId === tenantId && r.active)
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

export function getRoom(roomId) { return rooms.get(roomId) || null; }

export function getRoomByNumber(tenantId, number) {
  return Array.from(rooms.values())
    .find(r => r.tenantId === tenantId && r.number === String(number) && r.active) || null;
}

export function updateRoom(roomId, data) {
  const r = rooms.get(roomId);
  if (!r) return null;
  Object.assign(r, data);
  return r;
}

export function deleteRoom(roomId) {
  const r = rooms.get(roomId);
  if (!r) return false;
  r.active = false;
  return true;
}

export function setRoomStatus(tenantId, roomNumber, status) {
  const r = getRoomByNumber(tenantId, roomNumber);
  if (!r) return null;
  r.status = status;
  return r;
}

// ── SÉJOURS (STAYS) ────────────────────────────────────────────────────────

export function createStay({ tenantId, roomNumber, guestName, guestId, guestPhone, durationDays, durationHours }) {
  const stayId = `stay_${uuidv4().split('-')[0]}`;
  const now = new Date();
  let checkOutAt;

  if (durationHours && Number(durationHours) > 0) {
    checkOutAt = new Date(now.getTime() + Number(durationHours) * 3600_000);
  } else {
    checkOutAt = new Date(now.getTime() + Number(durationDays || 1) * 86400_000);
  }

  const room = getRoomByNumber(tenantId, roomNumber);
  const priceBase = durationHours
    ? (room?.pricePerHour || 5000) * Number(durationHours)
    : (room?.pricePerNight || 25000) * Number(durationDays || 1);

  const stay = {
    stayId, tenantId, roomNumber,
    guestName: guestName || 'Client',
    guestId: guestId || '',
    guestPhone: guestPhone || '',
    durationDays:  Number(durationDays)  || 0,
    durationHours: Number(durationHours) || 0,
    checkInAt:  now.toISOString(),
    checkOutAt: checkOutAt.toISOString(),
    priceBase,
    orderTotal: 0,   // cumulé des room services
    totalDue: priceBase,
    status: 'active',  // active | checkout_requested | checkout_pending | closed
    paymentMethod: null,
    closedAt: null,
    createdAt: now.toISOString(),
  };
  stays.set(stayId, stay);

  // Marquer la chambre comme occupée
  setRoomStatus(tenantId, roomNumber, 'occupied');

  return stay;
}

export function getActiveStay(tenantId, roomNumber) {
  return Array.from(stays.values())
    .find(s => s.tenantId === tenantId && s.roomNumber === String(roomNumber)
              && (s.status === 'active' || s.status === 'checkout_requested' || s.status === 'checkout_pending')) || null;
}

export function getStaysByTenant(tenantId) {
  return Array.from(stays.values())
    .filter(s => s.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getStay(stayId) { return stays.get(stayId) || null; }

export function updateStay(stayId, data) {
  const s = stays.get(stayId);
  if (!s) return null;
  Object.assign(s, data);
  // Recalcul total
  s.totalDue = s.priceBase + s.orderTotal;
  return s;
}

export function addToStayBill(tenantId, roomNumber, amount) {
  const stay = getActiveStay(tenantId, roomNumber);
  if (!stay) return null;
  stay.orderTotal += amount;
  stay.totalDue = stay.priceBase + stay.orderTotal;
  return stay;
}

export function requestCheckout(stayId) {
  const s = stays.get(stayId);
  if (!s) return null;
  s.status = 'checkout_requested';
  return s;
}

export function closeStay(stayId, paymentMethod) {
  const s = stays.get(stayId);
  if (!s) return null;
  s.status = 'closed';
  s.paymentMethod = paymentMethod || 'cash';
  s.closedAt = new Date().toISOString();
  // Chambre → à nettoyer
  setRoomStatus(s.tenantId, s.roomNumber, 'cleaning');
  return s;
}

// ── COMMANDES / ORDERS ─────────────────────────────────────────────────────

export function createOrder({ tenantId, roomNumber, clientPhone, items, note }) {
  const orderId = `order_${uuidv4().split('-')[0]}`;
  const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const order = {
    orderId, tenantId, roomNumber,
    clientPhone: clientPhone || null,
    items,
    note: note || '',
    status: 'pending',  // pending | confirmed | delivered | cancelled
    total,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.set(orderId, order);

  // Imputer automatiquement sur la note de chambre
  if (total > 0) addToStayBill(tenantId, roomNumber, total);

  return order;
}

export function getOrdersByTenant(tenantId) {
  return Array.from(orders.values())
    .filter(o => o.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getOrdersByStay(tenantId, roomNumber) {
  const stay = getActiveStay(tenantId, roomNumber);
  if (!stay) return [];
  return Array.from(orders.values())
    .filter(o => o.tenantId === tenantId && o.roomNumber === String(roomNumber)
                && new Date(o.createdAt) >= new Date(stay.checkInAt))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateOrderStatus(orderId, status) {
  const o = orders.get(orderId);
  if (!o) return null;
  o.status = status;
  o.updatedAt = new Date().toISOString();
  return o;
}

// ── MENU (CRUD par tenant) ──────────────────────────────────────────────────

const DEFAULT_MENU = [
  { id: 'cafe',      name: 'Café Expresso',        price: 1500,  category: 'Boissons',    emoji: '☕' },
  { id: 'eau',       name: 'Eau Minérale 50cl',    price: 800,   category: 'Boissons',    emoji: '💧' },
  { id: 'jus',       name: 'Jus de Fruits Frais',  price: 2000,  category: 'Boissons',    emoji: '🍊' },
  { id: 'biere',     name: 'Bière Locale',          price: 1500,  category: 'Boissons',    emoji: '🍺' },
  { id: 'croissant', name: 'Croissant Beurré',      price: 1200,  category: 'Pâtisseries', emoji: '🥐' },
  { id: 'toast',     name: 'Toast Jambon-Fromage',  price: 2500,  category: 'Restauration',emoji: '🍞' },
  { id: 'omelette',  name: 'Omelette du Matin',     price: 3000,  category: 'Restauration',emoji: '🍳' },
  { id: 'poulet',    name: 'Poulet DG',             price: 8000,  category: 'Restauration',emoji: '🍗' },
  { id: 'serviette', name: 'Serviettes Propres',    price: 0,     category: 'Services',    emoji: '🛁' },
  { id: 'menage',    name: 'Ménage Chambre',         price: 0,     category: 'Services',    emoji: '🧹' },
  { id: 'taxi',      name: 'Réservation Taxi',       price: 0,     category: 'Conciergerie',emoji: '🚗' },
  { id: 'reveil',    name: 'Service Réveil',         price: 0,     category: 'Conciergerie',emoji: '⏰' },
];

export function getMenu(tenantId) {
  if (!menus.has(tenantId)) menus.set(tenantId, DEFAULT_MENU.map(m => ({ ...m })));
  return menus.get(tenantId);
}

export function addMenuItem(tenantId, { name, price, category, emoji }) {
  const menu = getMenu(tenantId);
  const item = { id: `item_${uuidv4().split('-')[0]}`, name, price: Number(price) || 0, category: category || 'Autres', emoji: emoji || '🍽️' };
  menu.push(item);
  return item;
}

export function updateMenuItem(tenantId, itemId, data) {
  const menu = getMenu(tenantId);
  const idx = menu.findIndex(m => m.id === itemId);
  if (idx === -1) return null;
  Object.assign(menu[idx], data);
  return menu[idx];
}

export function deleteMenuItem(tenantId, itemId) {
  const menu = getMenu(tenantId);
  const idx = menu.findIndex(m => m.id === itemId);
  if (idx === -1) return false;
  menu.splice(idx, 1);
  return true;
}

// ── STATISTIQUES ───────────────────────────────────────────────────────────

export function getStats(tenantId) {
  const tenantRooms  = getRoomsByTenant(tenantId);
  const tenantStays  = getStaysByTenant(tenantId);
  const tenantOrders = getOrdersByTenant(tenantId);

  const today = new Date().toDateString();
  const thisMonth = new Date().toISOString().slice(0, 7);

  const revenueTotal = tenantStays.filter(s => s.status === 'closed').reduce((sum, s) => sum + s.totalDue, 0);
  const revenueToday = tenantStays
    .filter(s => s.status === 'closed' && new Date(s.closedAt).toDateString() === today)
    .reduce((sum, s) => sum + s.totalDue, 0);
  const revenueMonth = tenantStays
    .filter(s => s.status === 'closed' && s.closedAt?.startsWith(thisMonth))
    .reduce((sum, s) => sum + s.totalDue, 0);

  return {
    totalRooms:     tenantRooms.length,
    roomsAvailable: tenantRooms.filter(r => r.status === 'available').length,
    roomsOccupied:  tenantRooms.filter(r => r.status === 'occupied').length,
    roomsCleaning:  tenantRooms.filter(r => r.status === 'cleaning').length,
    roomsOOS:       tenantRooms.filter(r => r.status === 'out_of_service').length,
    activeStays:    tenantStays.filter(s => s.status === 'active').length,
    pendingOrders:  tenantOrders.filter(o => o.status === 'pending').length,
    revenueTotal, revenueToday, revenueMonth,
  };
}

// ── Données de démo ────────────────────────────────────────────────────────

function _seedDemoData() {
  const h1 = createTenant({ name: 'Hôtel Continental Bata', address: 'Avenue de l\'Indépendance, Bata', staffPhone: '240000000001', primaryColor: '#0f3460', logoText: 'HC' });
  const h2 = createTenant({ name: 'Palace Résidence', address: 'Boulevard du Littoral, Bata', staffPhone: '240000000002', primaryColor: '#4a0e0e', logoText: 'PR' });

  // Chambres H1
  const roomNums1 = [
    { number: '101', type: 'Standard', pricePerNight: 25000, floor: '1' },
    { number: '102', type: 'Standard', pricePerNight: 25000, floor: '1' },
    { number: '103', type: 'Deluxe',   pricePerNight: 40000, floor: '1' },
    { number: '201', type: 'Standard', pricePerNight: 25000, floor: '2' },
    { number: '202', type: 'Deluxe',   pricePerNight: 40000, floor: '2' },
    { number: '301', type: 'Suite',    pricePerNight: 75000, floor: '3' },
  ];
  const h1Rooms = roomNums1.map(r => addRoom(h1.tenantId, r));

  // Chambres H2
  ['101','102','201','301 Suite'].forEach((n, i) => addRoom(h2.tenantId, { number: n, type: i >= 3 ? 'Suite' : 'Standard', pricePerNight: i >= 3 ? 65000 : 22000, floor: String(Math.floor(i / 2) + 1) }));

  // Séjour démo H1 — chambre 101
  const stay101 = createStay({ tenantId: h1.tenantId, roomNumber: '101', guestName: 'Jean-Pierre Mbarga', guestId: 'CNI-2024-001', guestPhone: '240555111222', durationDays: 3 });
  createOrder({ tenantId: h1.tenantId, roomNumber: '101', items: [{ name: 'Café Expresso', qty: 2, price: 1500 }], clientPhone: '240555111222' });

  // Chambre 102 → nettoyage
  setRoomStatus(h1.tenantId, '102', 'cleaning');

  // Chambre 301 → hors service
  setRoomStatus(h1.tenantId, '301', 'out_of_service');

  // Commandes démo H1
  createOrder({ tenantId: h1.tenantId, roomNumber: '202', items: [{ name: 'Eau Minérale 50cl', qty: 3, price: 800 }, { name: 'Croissant Beurré', qty: 2, price: 1200 }] });

  // Séjour clos démo (revenus)
  const closedStay = createStay({ tenantId: h1.tenantId, roomNumber: '201', guestName: 'Marie Nguema', guestId: 'CNI-2024-002', guestPhone: '240555333444', durationDays: 2 });
  closeStay(closedStay.stayId, 'cash');
}

_seedDemoData();
