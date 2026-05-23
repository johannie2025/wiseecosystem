// ============================================================
// src/domains/restaurant/repository.js — Repository Restaurant
// In-memory store · Remplaçable par MySQL/Mongo sans changer routes.js
// ============================================================
import { v4 as uuidv4 } from 'uuid';

// ── Stores ─────────────────────────────────────────────────────────────────
const restaurants    = new Map();   // tenantId → RestaurantRecord
const restaurantMenus = new Map();  // tenantId → MenuItem[]
const restTables     = new Map();   // tableId  → TableRecord
const reservations   = new Map();   // reservationId → ReservationRecord
const restOrders     = new Map();   // orderId  → RestaurantOrder
const customers      = new Map();   // `${tenantId}:${phone}` → CustomerRecord

// ── RESTAURANTS ────────────────────────────────────────────────────────────

export function createRestaurant({ name, address, staffPhone, cuisineType, openingHours }) {
  const tenantId = `resto_${uuidv4().split('-')[0]}`;
  const restaurant = {
    tenantId,
    name: name || 'Restaurant',
    address: address || 'Bata, Guinée Équatoriale',
    staffPhone: staffPhone || '',
    cuisineType: cuisineType || 'Cuisine Africaine & Internationale',
    openingHours: openingHours || 'Lun–Dim 07h00–23h00',
    logoText: name?.substring(0, 2).toUpperCase() || 'RS',
    paymentMethods: { cash: true, orangeMoney: true, moMo: true },
    omPaymentUrl: '',
    momoPaymentUrl: '',
    loyaltyEnabled: true,
    active: true,
    createdAt: new Date().toISOString(),
  };
  restaurants.set(tenantId, restaurant);
  return restaurant;
}

export function getRestaurant(tenantId) { return restaurants.get(tenantId) || null; }
export function getAllRestaurants() { return Array.from(restaurants.values()); }

export function updateRestaurant(tenantId, data) {
  const r = restaurants.get(tenantId);
  if (!r) return null;
  // Merge paymentMethods si fourni
  if (data.paymentMethods) Object.assign(r.paymentMethods, data.paymentMethods);
  Object.assign(r, data);
  return r;
}

// ── MENU RESTAURANT ────────────────────────────────────────────────────────

const DEFAULT_RESTO_MENU = [
  { id: 'ndole',      name: 'Ndolé',              price: 5000,  category: 'Plats Locaux',     emoji: '🌿', description: 'Plat traditionnel camerounais aux feuilles amères', available: true },
  { id: 'poulet_dg',  name: 'Poulet DG',           price: 7000,  category: 'Plats Locaux',     emoji: '🍗', description: 'Poulet sauté aux légumes et bananes plantains', available: true },
  { id: 'koki',       name: 'Koki de Haricots',    price: 3500,  category: 'Plats Locaux',     emoji: '🫘', description: 'Gâteau de haricots cuit à la vapeur', available: true },
  { id: 'boeuf_braise',name: 'Bœuf Braisé',        price: 6500,  category: 'Grillades',        emoji: '🥩', description: 'Bœuf grillé au feu de bois avec épices', available: true },
  { id: 'poulet_braise',name: 'Poulet Braisé ½',   price: 4000,  category: 'Grillades',        emoji: '🍗', description: 'Demi-poulet grillé avec sauce pimentée', available: true },
  { id: 'poisson',    name: 'Poisson Braisé',       price: 5500,  category: 'Grillades',        emoji: '🐟', description: 'Tilapia ou capitaine grillé', available: true },
  { id: 'riz',        name: 'Riz Blanc',            price: 1000,  category: 'Accompagnements',  emoji: '🍚', description: 'Riz nature cuit vapeur', available: true },
  { id: 'plantain',   name: 'Banane Plantain Frite',price: 1500,  category: 'Accompagnements',  emoji: '🍌', description: 'Tranches de plantain mûr frites', available: true },
  { id: 'frites',     name: 'Frites Maison',        price: 1500,  category: 'Accompagnements',  emoji: '🍟', description: 'Frites de pommes de terre dorées', available: true },
  { id: 'salade',     name: 'Salade Fraîche',       price: 1500,  category: 'Accompagnements',  emoji: '🥗', description: 'Salade verte tomate concombre', available: true },
  { id: 'eau',        name: 'Eau Minérale 50cl',    price: 500,   category: 'Boissons',         emoji: '💧', description: '', available: true },
  { id: 'biere_loc',  name: 'Bière Locale (33cl)',  price: 1000,  category: 'Boissons',         emoji: '🍺', description: 'Ngaoundéré, Casino, Mützig...', available: true },
  { id: 'coca',       name: 'Coca-Cola 33cl',       price: 800,   category: 'Boissons',         emoji: '🥤', description: '', available: true },
  { id: 'jus_nat',    name: 'Jus Naturel Maison',   price: 1500,  category: 'Boissons',         emoji: '🍹', description: 'Gingembre, bissap, jus d\'orange...', available: true },
  { id: 'cafe_exp',   name: 'Café Expresso',        price: 1000,  category: 'Boissons Chaudes', emoji: '☕', description: '', available: true },
  { id: 'the',        name: 'Thé Africain',         price: 800,   category: 'Boissons Chaudes', emoji: '🍵', description: '', available: true },
];

export function getRestaurantMenu(tenantId) {
  if (!restaurantMenus.has(tenantId)) {
    restaurantMenus.set(tenantId, DEFAULT_RESTO_MENU.map(m => ({ ...m })));
  }
  return restaurantMenus.get(tenantId);
}

export function addRestaurantMenuItem(tenantId, { name, price, category, emoji, description, photoUrl }) {
  const menu = getRestaurantMenu(tenantId);
  const item = {
    id: `ritem_${uuidv4().split('-')[0]}`,
    name,
    price: Number(price) || 0,
    category: category || 'Plats',
    emoji: emoji || '🍽️',
    description: description || '',
    photoUrl: photoUrl || '',
    available: true,
  };
  menu.push(item);
  return item;
}

export function updateRestaurantMenuItem(tenantId, itemId, data) {
  const menu = getRestaurantMenu(tenantId);
  const idx = menu.findIndex(m => m.id === itemId);
  if (idx === -1) return null;
  Object.assign(menu[idx], data);
  return menu[idx];
}

export function deleteRestaurantMenuItem(tenantId, itemId) {
  const menu = getRestaurantMenu(tenantId);
  const idx = menu.findIndex(m => m.id === itemId);
  if (idx === -1) return false;
  menu.splice(idx, 1);
  return true;
}

// ── TABLES ─────────────────────────────────────────────────────────────────
// Statuts: free | occupied | reserved | out_of_service

export function addTable(tenantId, { number, capacity, location }) {
  const tableId = `table_${uuidv4().split('-')[0]}`;
  const table = {
    tableId, tenantId,
    number: String(number),
    capacity: Number(capacity) || 4,
    location: location || 'Salle principale',
    status: 'free',
    active: true,
    createdAt: new Date().toISOString(),
  };
  restTables.set(tableId, table);
  return table;
}

export function getTables(tenantId) {
  return Array.from(restTables.values())
    .filter(t => t.tenantId === tenantId && t.active)
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

export function getTable(tableId) { return restTables.get(tableId) || null; }

export function updateTable(tableId, data) {
  const t = restTables.get(tableId);
  if (!t) return null;
  Object.assign(t, data);
  return t;
}

export function deleteTable(tableId) {
  const t = restTables.get(tableId);
  if (!t) return false;
  t.active = false;
  return true;
}

// ── RÉSERVATIONS ───────────────────────────────────────────────────────────

export function createReservation({ tenantId, clientName, clientPhone, partySize, date, time, tableId, note }) {
  const reservationId = `resa_${uuidv4().split('-')[0]}`;
  const reservation = {
    reservationId, tenantId,
    clientName: clientName || 'Client',
    clientPhone: clientPhone || '',
    partySize: Number(partySize) || 2,
    date,
    time,
    tableId: tableId || null,
    note: note || '',
    status: 'confirmed', // confirmed | arrived | completed | cancelled | no_show
    createdAt: new Date().toISOString(),
  };
  reservations.set(reservationId, reservation);

  // Marquer la table comme réservée si assignée
  if (tableId) updateTable(tableId, { status: 'reserved' });

  return reservation;
}

export function getReservations(tenantId) {
  return Array.from(reservations.values())
    .filter(r => r.tenantId === tenantId)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

export function getReservationsByPhone(tenantId, phone) {
  return Array.from(reservations.values())
    .filter(r => r.tenantId === tenantId && r.clientPhone === phone)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateReservationStatus(reservationId, status) {
  const r = reservations.get(reservationId);
  if (!r) return null;
  r.status = status;
  // Libérer la table si réservation terminée/annulée
  if ((status === 'completed' || status === 'cancelled' || status === 'no_show') && r.tableId) {
    updateTable(r.tableId, { status: 'free' });
  }
  return r;
}

// ── COMMANDES RESTAURANT ───────────────────────────────────────────────────
// Statuts: pending | confirmed | preparing | ready | served | cancelled

export function createRestaurantOrder({ tenantId, clientPhone, clientName, items, paymentMethod, total, tableNumber }) {
  const orderId = `rorder_${uuidv4().split('-')[0]}`;
  const order = {
    orderId, tenantId,
    clientPhone: clientPhone || '',
    clientName: clientName || 'Client',
    items,
    paymentMethod: paymentMethod || 'cash',
    total: Number(total) || items.reduce((s, i) => s + i.price * i.qty, 0),
    tableNumber: tableNumber || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  restOrders.set(orderId, order);
  return order;
}

export function getRestaurantOrders(tenantId) {
  return Array.from(restOrders.values())
    .filter(o => o.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getOrdersByPhone(tenantId, phone) {
  return Array.from(restOrders.values())
    .filter(o => o.tenantId === tenantId && o.clientPhone === phone)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateRestaurantOrderStatus(orderId, status) {
  const o = restOrders.get(orderId);
  if (!o) return null;
  o.status = status;
  o.updatedAt = new Date().toISOString();
  return o;
}

// ── CLIENTS (Mini-CRM) ──────────────────────────────────────────────────────

export function upsertCustomer(tenantId, { phone, orderCount = 0, totalSpent = 0, name }) {
  const key = `${tenantId}:${phone}`;
  const existing = customers.get(key) || {
    customerId: `cust_${uuidv4().split('-')[0]}`,
    tenantId, phone,
    name: name || `Client ${phone.slice(-4)}`,
    orderCount: 0,
    totalSpent: 0,
    firstOrderAt: new Date().toISOString(),
    lastOrderAt: null,
    loyaltyPoints: 0,
  };
  existing.orderCount += orderCount;
  existing.totalSpent += totalSpent;
  existing.lastOrderAt = new Date().toISOString();
  existing.loyaltyPoints = Math.floor(existing.totalSpent / 1000); // 1 pt / 1000 XAF
  if (name) existing.name = name;
  customers.set(key, existing);
  return existing;
}

export function getCustomers(tenantId) {
  return Array.from(customers.values())
    .filter(c => c.tenantId === tenantId)
    .sort((a, b) => b.orderCount - a.orderCount);
}

export function getCustomer(tenantId, phone) {
  return customers.get(`${tenantId}:${phone}`) || null;
}

// ── STATISTIQUES RESTAURANT ────────────────────────────────────────────────

export function getRestaurantStats(tenantId) {
  const orders = getRestaurantOrders(tenantId);
  const tables = getTables(tenantId);
  const customerList = getCustomers(tenantId);

  const now = new Date();
  const today = now.toDateString();
  const weekAgo = new Date(now - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const closedOrders = orders.filter(o => o.status !== 'cancelled');

  const revenueToday = closedOrders
    .filter(o => new Date(o.createdAt).toDateString() === today)
    .reduce((s, o) => s + o.total, 0);

  const revenueWeek = closedOrders
    .filter(o => new Date(o.createdAt) >= weekAgo)
    .reduce((s, o) => s + o.total, 0);

  const revenueMonth = closedOrders
    .filter(o => new Date(o.createdAt) >= monthStart)
    .reduce((s, o) => s + o.total, 0);

  // Plats les plus vendus
  const itemCount = {};
  closedOrders.forEach(o => {
    o.items.forEach(i => {
      if (!itemCount[i.name]) itemCount[i.name] = { name: i.name, emoji: i.emoji || '🍽️', count: 0, revenue: 0 };
      itemCount[i.name].count += i.qty;
      itemCount[i.name].revenue += i.price * i.qty;
    });
  });
  const topDishes = Object.values(itemCount).sort((a, b) => b.count - a.count).slice(0, 5);

  // Commandes par jour (7 derniers jours)
  const ordersByDay = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
    ordersByDay[key] = closedOrders.filter(o =>
      new Date(o.createdAt).toDateString() === d.toDateString()
    ).length;
  }

  return {
    // CA
    revenueToday, revenueWeek, revenueMonth,
    // Commandes
    ordersTotal: orders.length,
    ordersToday: orders.filter(o => new Date(o.createdAt).toDateString() === today).length,
    ordersPending: orders.filter(o => o.status === 'pending').length,
    ordersPreparing: orders.filter(o => o.status === 'preparing' || o.status === 'confirmed').length,
    // Tables
    tablesTotal: tables.length,
    tablesFree: tables.filter(t => t.status === 'free').length,
    tablesOccupied: tables.filter(t => t.status === 'occupied').length,
    tablesReserved: tables.filter(t => t.status === 'reserved').length,
    occupancyRate: tables.length > 0 ? Math.round((tables.filter(t => t.status !== 'free').length / tables.length) * 100) : 0,
    // Clients
    totalCustomers: customerList.length,
    recurringCustomers: customerList.filter(c => c.orderCount >= 2).length,
    // Charts
    topDishes,
    ordersByDay,
  };
}

// ── DONNÉES DE DÉMO ────────────────────────────────────────────────────────

function _seedRestaurantDemo() {
  // Restaurant 1 — Bata
  const r1 = createRestaurant({
    name: 'Le Jardin d\'Ébène',
    address: 'Avenue du Littoral, Bata',
    staffPhone: '240222333001',
    cuisineType: 'Cuisine Africaine & Internationale',
    openingHours: 'Lun–Dim 07h00–23h00',
  });

  // Tables
  ['1', '2', '3', '4', '5', '6'].forEach((n, i) => {
    addTable(r1.tenantId, {
      number: n,
      capacity: i < 2 ? 2 : i < 4 ? 4 : 6,
      location: i < 3 ? 'Terrasse' : 'Salle intérieure',
    });
  });

  // Quelques tables occupées / réservées
  const tables = getTables(r1.tenantId);
  if (tables[0]) updateTable(tables[0].tableId, { status: 'occupied' });
  if (tables[2]) updateTable(tables[2].tableId, { status: 'reserved' });

  // Réservations démo
  const today = new Date().toISOString().split('T')[0];
  createReservation({ tenantId: r1.tenantId, clientName: 'Famille Ndong', clientPhone: '240222444001', partySize: 4, date: today, time: '19:30', note: 'Table fenêtre si possible' });
  createReservation({ tenantId: r1.tenantId, clientName: 'Pierre Mba', clientPhone: '240222444002', partySize: 2, date: today, time: '20:00' });

  // Commandes démo
  const menu = getRestaurantMenu(r1.tenantId);
  const items1 = [
    { id: 'poulet_dg', name: 'Poulet DG', price: 7000, qty: 2, emoji: '🍗' },
    { id: 'riz', name: 'Riz Blanc', price: 1000, qty: 2, emoji: '🍚' },
    { id: 'biere_loc', name: 'Bière Locale', price: 1000, qty: 2, emoji: '🍺' },
  ];
  const o1 = createRestaurantOrder({ tenantId: r1.tenantId, clientPhone: '240555100001', clientName: 'Jean Mbarga', items: items1, paymentMethod: 'cash', total: 17000 });
  updateRestaurantOrderStatus(o1.orderId, 'preparing');

  const items2 = [
    { id: 'ndole', name: 'Ndolé', price: 5000, qty: 1, emoji: '🌿' },
    { id: 'plantain', name: 'Banane Plantain Frite', price: 1500, qty: 1, emoji: '🍌' },
    { id: 'jus_nat', name: 'Jus Naturel Maison', price: 1500, qty: 2, emoji: '🍹' },
  ];
  createRestaurantOrder({ tenantId: r1.tenantId, clientPhone: '240555100002', clientName: 'Marie Oyono', items: items2, paymentMethod: 'orange_money', total: 9500 });

  const items3 = [
    { id: 'boeuf_braise', name: 'Bœuf Braisé', price: 6500, qty: 1, emoji: '🥩' },
    { id: 'frites', name: 'Frites Maison', price: 1500, qty: 1, emoji: '🍟' },
    { id: 'coca', name: 'Coca-Cola', price: 800, qty: 1, emoji: '🥤' },
  ];
  const o3 = createRestaurantOrder({ tenantId: r1.tenantId, clientPhone: '240555100003', clientName: 'David Nze', items: items3, paymentMethod: 'cash', total: 8800 });
  updateRestaurantOrderStatus(o3.orderId, 'served');

  // Clients CRM
  upsertCustomer(r1.tenantId, { phone: '240555100001', orderCount: 5, totalSpent: 45000, name: 'Jean Mbarga' });
  upsertCustomer(r1.tenantId, { phone: '240555100002', orderCount: 3, totalSpent: 27500, name: 'Marie Oyono' });
  upsertCustomer(r1.tenantId, { phone: '240555100003', orderCount: 8, totalSpent: 72000, name: 'David Nze' });
  upsertCustomer(r1.tenantId, { phone: '240555100004', orderCount: 1, totalSpent: 6500, name: 'Carine Essono' });

  // Restaurant 2
  createRestaurant({
    name: 'Maquis Chez Mama Rose',
    address: 'Quartier Ela Nguema, Bata',
    staffPhone: '240222333002',
    cuisineType: 'Maquis & Street Food',
    openingHours: 'Mar–Dim 10h00–22h00',
  });
}

_seedRestaurantDemo();
