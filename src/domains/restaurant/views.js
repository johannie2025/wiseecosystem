// ============================================================
// src/domains/restaurant/views.js — Vues HTML Restaurant
// Design: Ebony #0a0a0f · Or doux #c9a84c · Crème #f5efe6
// Typo: Cormorant Garamond + DM Sans
// ============================================================

const HEAD = (title, extra = '') => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Wise Ecosystem · Restaurant</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --gold:#c9a84c;--gold-light:#e8c97a;--gold-dim:rgba(201,168,76,.15);
    --ebony:#0a0a0f;--ebony-2:#111118;--ebony-3:#191923;--ebony-4:#222230;
    --cream:#f5efe6;--cream-dim:#c8bfb0;--muted:#5a5a70;
    --green:#22c55e;--red:#ef4444;--amber:#f59e0b;--blue:#60a5fa;
    --success-bg:rgba(34,197,94,.12);--danger-bg:rgba(239,68,68,.12);
    --warn-bg:rgba(245,158,11,.12);--info-bg:rgba(96,165,250,.12);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'DM Sans',sans-serif;background:var(--ebony);color:var(--cream);min-height:100vh;}
  .font-display{font-family:'Cormorant Garamond',serif;}

  /* ─ Couleurs utilitaires ─ */
  .gold{color:var(--gold);} .bg-gold{background:var(--gold);} .border-gold{border-color:var(--gold);}
  .cream{color:var(--cream);} .muted{color:var(--muted);}

  /* ─ Boutons ─ */
  .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-size:.82rem;font-weight:600;cursor:pointer;border:none;transition:all .25s;text-decoration:none;letter-spacing:.03em;}
  .btn-gold{background:linear-gradient(135deg,var(--gold) 0%,var(--gold-light) 100%);color:#0a0a0f;}
  .btn-gold:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 6px 18px rgba(201,168,76,.3);}
  .btn-outline{border:1px solid var(--gold);color:var(--gold);background:transparent;}
  .btn-outline:hover{background:var(--gold-dim);}
  .btn-ghost{background:var(--ebony-3);color:var(--cream-dim);}
  .btn-ghost:hover{background:var(--ebony-4);color:var(--cream);}
  .btn-danger{background:var(--danger-bg);border:1px solid rgba(239,68,68,.3);color:#f87171;}
  .btn-danger:hover{background:rgba(239,68,68,.22);}
  .btn-sm{padding:6px 12px;font-size:.75rem;}

  /* ─ Cards ─ */
  .card{background:var(--ebony-2);border:1px solid rgba(201,168,76,.1);border-radius:14px;}
  .card-hover{transition:all .25s;} .card-hover:hover{border-color:rgba(201,168,76,.3);transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.4);}

  /* ─ Formulaires ─ */
  input,select,textarea{background:var(--ebony-3);border:1px solid rgba(201,168,76,.18);color:var(--cream);border-radius:8px;padding:9px 13px;width:100%;font-size:.85rem;font-family:'DM Sans',sans-serif;transition:border .2s;}
  input:focus,select:focus,textarea:focus{outline:none;border-color:var(--gold);}
  label{font-size:.78rem;color:var(--cream-dim);display:block;margin-bottom:5px;font-weight:500;}

  /* ─ Navigation ─ */
  .nav-link{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;cursor:pointer;font-size:.83rem;font-weight:500;color:var(--muted);transition:all .2s;border:none;background:none;width:100%;text-align:left;}
  .nav-link:hover{background:var(--ebony-3);color:var(--cream);}
  .nav-link.active{background:var(--gold-dim);color:var(--gold);border-left:2px solid var(--gold);}

  /* ─ Tabs ─ */
  .tab-btn{padding:8px 18px;border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:500;transition:all .2s;border:1px solid transparent;color:var(--muted);background:none;}
  .tab-btn.active{background:var(--gold);color:var(--ebony);}
  .tab-btn:not(.active):hover{color:var(--cream);background:var(--ebony-3);}
  .tab-pane{display:none;} .tab-pane.active{display:block;}

  /* ─ Sections principales (navigation sidebar) ─ */
  .main-section{display:none;} .main-section.active{display:block;}

  /* ─ Badges statut ─ */
  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}
  .badge-pending{background:var(--warn-bg);color:var(--amber);border:1px solid rgba(245,158,11,.25);}
  .badge-confirmed{background:var(--success-bg);color:var(--green);border:1px solid rgba(34,197,94,.25);}
  .badge-preparing{background:var(--info-bg);color:var(--blue);border:1px solid rgba(96,165,250,.25);}
  .badge-ready{background:rgba(168,85,247,.15);color:#c084fc;border:1px solid rgba(168,85,247,.25);}
  .badge-served{background:rgba(99,102,241,.15);color:#818cf8;border:1px solid rgba(99,102,241,.25);}
  .badge-cancelled{background:var(--danger-bg);color:#f87171;border:1px solid rgba(239,68,68,.25);}
  .badge-free{background:var(--success-bg);color:var(--green);}
  .badge-occupied{background:var(--danger-bg);color:#f87171;}
  .badge-reserved{background:var(--warn-bg);color:var(--amber);}
  .badge-out_of_service{background:rgba(107,114,128,.15);color:#9ca3af;}

  /* ─ Status session WA ─ */
  .status-dot{width:9px;height:9px;border-radius:50%;display:inline-block;flex-shrink:0;}
  .status-connected{background:var(--green);box-shadow:0 0 8px var(--green);}
  .status-qr_ready{background:var(--gold);box-shadow:0 0 8px var(--gold);animation:pulse 1.5s infinite;}
  .status-disconnected,.status-not_initialized,.status-error{background:var(--red);}
  .status-initializing{background:var(--blue);animation:pulse 1s infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}

  /* ─ Carte menu ─ */
  .menu-card{position:relative;overflow:hidden;border-left:3px solid transparent;}
  .menu-card.available{border-left-color:var(--gold);}
  .menu-card.unavailable{border-left-color:var(--muted);opacity:.6;}

  /* ─ Commandes ─ */
  .order-row{border-left:3px solid var(--gold-dim);transition:all .2s;}
  .order-row:hover{border-left-color:var(--gold);background:rgba(201,168,76,.04);}
  .order-row.order-pending{border-left-color:var(--amber);}
  .order-row.order-preparing{border-left-color:var(--blue);}
  .order-row.order-ready{border-left-color:#c084fc;}

  /* ─ Table grid ─ */
  .table-cell{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px;cursor:pointer;transition:all .25s;border:2px solid transparent;font-size:.8rem;}
  .table-cell.free{background:var(--success-bg);border-color:rgba(34,197,94,.25);color:var(--green);}
  .table-cell.occupied{background:var(--danger-bg);border-color:rgba(239,68,68,.25);color:#f87171;}
  .table-cell.reserved{background:var(--warn-bg);border-color:rgba(245,158,11,.25);color:var(--amber);}
  .table-cell:hover{transform:scale(1.03);box-shadow:0 6px 20px rgba(0,0,0,.3);}

  /* ─ Stats cards ─ */
  .stat-card{padding:1.25rem 1.5rem;border-radius:14px;background:var(--ebony-2);border:1px solid rgba(201,168,76,.1);position:relative;overflow:hidden;}
  .stat-card::before{content:'';position:absolute;top:0;right:0;width:60px;height:60px;border-radius:0 14px 0 60px;opacity:.08;background:var(--gold);}

  /* ─ Sidebar ─ */
  .sidebar{width:220px;min-width:220px;background:var(--ebony-2);border-right:1px solid rgba(201,168,76,.08);display:flex;flex-direction:column;height:100vh;position:sticky;top:0;overflow-y:auto;}

  /* ─ Scrollbar ─ */
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:var(--ebony-2);}
  ::-webkit-scrollbar-thumb{background:rgba(201,168,76,.3);border-radius:2px;}
  ::-webkit-scrollbar-thumb:hover{background:var(--gold);}

  /* ─ Toast ─ */
  .toast{position:fixed;bottom:24px;right:24px;background:var(--ebony-3);border:1px solid var(--gold);color:var(--cream);padding:12px 20px;border-radius:10px;font-size:.83rem;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;max-width:320px;}
  .toast.show{opacity:1;}

  /* ─ Modal ─ */
  .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;}
  .modal{background:var(--ebony-2);border:1px solid rgba(201,168,76,.2);border-radius:16px;padding:2rem;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;}

  /* ─ Bar chart simple ─ */
  .bar-chart{display:flex;align-items:flex-end;gap:6px;height:80px;}
  .bar{flex:1;background:linear-gradient(to top,var(--gold),var(--gold-light));border-radius:4px 4px 0 0;min-height:3px;transition:height .5s ease;}
  .bar-label{font-size:.65rem;color:var(--muted);text-align:center;margin-top:4px;}

  ${extra}
</style>
</head>`;

const FOOT = (js = '') => `<div id="toast" class="toast"></div>
<script>
function toast(msg,type='info'){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show';t.style.borderColor=type==='success'?'#22c55e':type==='error'?'#ef4444':'var(--gold)';setTimeout(()=>t.className='toast',3200);}
function switchTab(tabGroup,tabId){document.querySelectorAll('[data-tab-group="'+tabGroup+'"]').forEach(el=>{el.classList.remove('active');if(el.dataset.tab===tabId)el.classList.add('active');});document.querySelectorAll('[data-pane-group="'+tabGroup+'"]').forEach(el=>{el.classList.remove('active');if(el.dataset.pane===tabId)el.classList.add('active');});}
function switchSection(id){document.querySelectorAll('.main-section').forEach(s=>s.classList.remove('active'));document.getElementById('section-'+id)?.classList.add('active');document.querySelectorAll('.nav-link').forEach(n=>{n.classList.remove('active');if(n.dataset.section===id)n.classList.add('active');});}
${js}
</script></body></html>`;

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = n => Number(n || 0).toLocaleString('fr-FR');
const escapeJs = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n');
const orderStatusLabel = { pending:'En attente', confirmed:'Confirmée', preparing:'En préparation', ready:'Prête !', served:'Servie', cancelled:'Annulée' };
const tableStatusLabel  = { free:'Libre', occupied:'Occupée', reserved:'Réservée', out_of_service:'Hors service' };
const resaStatusLabel   = { confirmed:'Confirmée', arrived:'Arrivée', completed:'Terminée', cancelled:'Annulée', no_show:'Absent' };
const payLabel          = { cash:'💵 Cash', orange_money:'🟠 Orange Money', momo:'🟡 MoMo MTN' };

// ══════════════════════════════════════════════════════════════════════════
// SUPERADMIN RESTAURANT
// ══════════════════════════════════════════════════════════════════════════
export function renderRestaurantSuperAdmin(restaurants) {
  const secret = process.env.SUPERADMIN_SECRET || 'WiseDesign2025!';

  const cards = restaurants.map(r => `
    <div class="card card-hover p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center font-display text-lg font-bold" style="background:linear-gradient(135deg,var(--ebony-3),var(--ebony-4));border:1px solid var(--gold);color:var(--gold)">${r.logoText}</div>
        <div>
          <div class="font-display text-lg gold">${r.name}</div>
          <div class="text-xs muted">${r.address}</div>
          <div class="text-xs" style="color:var(--cream-dim)">${r.cuisineType || ''}</div>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <a href="/restaurant/dashboard/${r.tenantId}" class="btn btn-gold btn-sm">📊 Dashboard</a>
        <a href="/restaurant/config/${r.tenantId}" class="btn btn-outline btn-sm">⚙️ Config</a>
        <span class="text-xs muted self-center ml-auto">📱 ${r.staffPhone || '—'}</span>
      </div>
    </div>`).join('');

  return HEAD('SuperAdmin — Restaurants') + `
<body class="p-6">
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <div class="font-display text-4xl gold">🍽️ SuperAdmin Restaurant</div>
        <div class="muted text-sm mt-1">Wise Design Smart Ecosystem — Gestion multi-restaurants</div>
      </div>
      <div class="flex gap-2">
        <a href="/admin?secret=${secret}" class="btn btn-ghost btn-sm">🏨 Hôtels</a>
        <a href="/health" class="btn btn-ghost btn-sm">❤️ Health</a>
      </div>
    </div>

    <!-- Créer un restaurant -->
    <div class="card p-6 mb-8">
      <div class="font-display text-xl gold mb-5">+ Nouveau Restaurant</div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div><label>Nom du restaurant *</label><input id="n_name" placeholder="Le Jardin d'Ébène" /></div>
        <div><label>Adresse</label><input id="n_addr" placeholder="Avenue du Littoral, Bata" /></div>
        <div><label>Téléphone Staff WhatsApp</label><input id="n_phone" placeholder="240222333001" /></div>
        <div><label>Type de cuisine</label><input id="n_cuisine" placeholder="Cuisine Africaine & Internationale" /></div>
        <div><label>Horaires</label><input id="n_hours" placeholder="Lun–Dim 07h00–23h00" /></div>
      </div>
      <button onclick="createRestaurant()" class="btn btn-gold">🍽️ Créer le Restaurant</button>
    </div>

    <!-- Liste restaurants -->
    <div class="font-display text-2xl gold mb-4">${restaurants.length} Restaurant${restaurants.length !== 1 ? 's' : ''}</div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${cards || '<p class="muted col-span-3 text-center py-8">Aucun restaurant. Créez-en un !</p>'}
    </div>
  </div>
</body>
` + FOOT(`
async function createRestaurant(){
  const body={name:document.getElementById('n_name').value,address:document.getElementById('n_addr').value,staffPhone:document.getElementById('n_phone').value,cuisineType:document.getElementById('n_cuisine').value,openingHours:document.getElementById('n_hours').value,adminSecret:'${escapeJs(secret)}'};
  if(!body.name){toast('Nom requis','error');return;}
  const r=await fetch('/restaurant/admin/create',{method:'POST',headers:{'Content-Type':'application/json','x-admin-secret':'${escapeJs(secret)}'},body:JSON.stringify(body)}).then(r=>r.json());
  if(r.success){toast('Restaurant créé !','success');setTimeout(()=>location.reload(),1000);}
  else toast(r.error||'Erreur','error');
}
`);
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD RESTAURANT
// ══════════════════════════════════════════════════════════════════════════
export function renderRestaurantDashboard(restaurant, session, orders, tables, reservations, stats, customers) {
  const tid = restaurant.tenantId;
  const waStatusClass = `status-${session.status}`;

  // ── Stat cards ────────────────────────────────────────────────────────
  const statCards = `
    <div class="stat-card"><div class="text-2xl font-display gold font-bold">${fmt(stats.revenueToday)}</div><div class="text-xs muted mt-1">XAF — CA Aujourd'hui</div></div>
    <div class="stat-card"><div class="text-2xl font-display gold font-bold">${fmt(stats.revenueWeek)}</div><div class="text-xs muted mt-1">XAF — CA Cette Semaine</div></div>
    <div class="stat-card"><div class="text-2xl font-display gold font-bold">${fmt(stats.revenueMonth)}</div><div class="text-xs muted mt-1">XAF — CA Ce Mois</div></div>
    <div class="stat-card"><div class="text-2xl font-display font-bold" style="color:var(--amber)">${stats.ordersPending}</div><div class="text-xs muted mt-1">Commandes en attente</div></div>
    <div class="stat-card"><div class="text-2xl font-display font-bold" style="color:var(--blue)">${stats.ordersPreparing}</div><div class="text-xs muted mt-1">En préparation</div></div>
    <div class="stat-card"><div class="text-2xl font-display font-bold" style="color:var(--green)">${stats.tablesFree}/${stats.tablesTotal}</div><div class="text-xs muted mt-1">Tables libres</div></div>`;

  // ── Commandes ─────────────────────────────────────────────────────────
  const ordersHtml = orders.slice(0, 50).map(o => `
    <div class="order-row order-${o.status} card p-4 mb-3" id="order-${o.orderId}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-mono text-xs gold">#${o.orderId.slice(-6).toUpperCase()}</span>
            <span class="badge badge-${o.status}">${orderStatusLabel[o.status] || o.status}</span>
            <span class="text-xs muted">${payLabel[o.paymentMethod] || o.paymentMethod}</span>
          </div>
          <div class="text-sm font-medium mb-1">${o.clientName} <span class="muted text-xs">· ${o.clientPhone}</span></div>
          <div class="text-xs muted">${o.items.map(i => `${i.emoji || '🍽️'} ${i.name} ×${i.qty}`).join('  ·  ')}</div>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="font-display text-lg gold">${fmt(o.total)} <span class="text-xs">XAF</span></div>
          <div class="text-xs muted">${new Date(o.createdAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
      </div>
      <div class="flex gap-2 mt-3 flex-wrap">
        ${o.status === 'pending' ? `<button onclick="updateOrder('${o.orderId}','confirmed')" class="btn btn-gold btn-sm">✅ Confirmer</button>` : ''}
        ${o.status === 'confirmed' ? `<button onclick="updateOrder('${o.orderId}','preparing')" class="btn btn-outline btn-sm">👨‍🍳 En prépa</button>` : ''}
        ${o.status === 'preparing' ? `<button onclick="updateOrder('${o.orderId}','ready')" class="btn btn-outline btn-sm">🔔 Prête</button>` : ''}
        ${o.status === 'ready' ? `<button onclick="updateOrder('${o.orderId}','served')" class="btn btn-ghost btn-sm">✅ Servie</button>` : ''}
        ${['pending','confirmed','preparing'].includes(o.status) ? `<button onclick="updateOrder('${o.orderId}','cancelled')" class="btn btn-danger btn-sm">✗ Annuler</button>` : ''}
      </div>
    </div>`).join('') || '<div class="text-center muted py-12">Aucune commande pour l\'instant.</div>';

  // ── Tables grid ───────────────────────────────────────────────────────
  const tablesHtml = tables.length ? `
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      ${tables.map(t => `
        <div class="table-cell ${t.status}" onclick="cycleTableStatus('${t.tableId}','${t.status}')">
          <div class="text-xl mb-1">${t.status === 'free' ? '🟢' : t.status === 'occupied' ? '🔴' : t.status === 'reserved' ? '🟡' : '⚫'}</div>
          <div class="font-display font-bold text-base">T${t.number}</div>
          <div class="text-xs opacity-70">${t.capacity} pers</div>
          <div class="text-xs opacity-60 mt-0.5">${tableStatusLabel[t.status]}</div>
        </div>`).join('')}
    </div>` : '<div class="text-center muted py-8">Aucune table. Ajoutez des tables en Config !</div>';

  // ── Réservations ──────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => r.date === today && r.status !== 'cancelled');
  const reservationsHtml = todayReservations.length ? todayReservations.map(r => `
    <div class="card p-4 mb-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-xs gold">#${r.reservationId.slice(-6).toUpperCase()}</span>
            <span class="badge badge-${r.status === 'confirmed' ? 'confirmed' : r.status === 'arrived' ? 'preparing' : 'cancelled'}">${resaStatusLabel[r.status]}</span>
          </div>
          <div class="font-medium">${r.clientName} — <span class="gold font-display text-lg">${r.partySize}</span> pers.</div>
          <div class="text-xs muted">${r.clientPhone} ${r.note ? '· ' + r.note : ''}</div>
        </div>
        <div class="text-right">
          <div class="font-display text-xl gold">${r.time}</div>
          <div class="flex gap-2 mt-2">
            ${r.status === 'confirmed' ? `<button onclick="updateResa('${r.reservationId}','arrived')" class="btn btn-gold btn-sm">Arrivée</button>` : ''}
            ${r.status !== 'cancelled' && r.status !== 'completed' ? `<button onclick="updateResa('${r.reservationId}','cancelled')" class="btn btn-danger btn-sm">✗</button>` : ''}
          </div>
        </div>
      </div>
    </div>`).join('') : '<div class="text-center muted py-8">Aucune réservation aujourd\'hui.</div>';

  // ── Top plats ─────────────────────────────────────────────────────────
  const topDishesHtml = stats.topDishes?.length ? stats.topDishes.map((d, i) => `
    <div class="flex items-center gap-3 py-2 ${i < stats.topDishes.length - 1 ? 'border-b border-white border-opacity-5' : ''}">
      <span class="font-display text-xl gold">#${i + 1}</span>
      <span class="text-lg">${d.emoji}</span>
      <div class="flex-1"><div class="text-sm font-medium">${d.name}</div><div class="text-xs muted">${d.count} vendus</div></div>
      <div class="text-sm gold font-medium">${fmt(d.revenue)} XAF</div>
    </div>`).join('') : '<div class="muted text-sm">Pas encore de données.</div>';

  // ── Clients CRM ───────────────────────────────────────────────────────
  const customersHtml = customers.slice(0, 20).map(c => `
    <div class="flex items-center gap-3 py-3 ${customers.indexOf(c) < customers.length - 1 ? 'border-b border-white border-opacity-5' : ''}">
      <div class="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm" style="background:var(--gold-dim);color:var(--gold)">${c.name.substring(0,2).toUpperCase()}</div>
      <div class="flex-1">
        <div class="text-sm font-medium">${c.name}</div>
        <div class="text-xs muted">📱 ${c.phone} · ${c.orderCount} commande${c.orderCount > 1 ? 's' : ''}</div>
      </div>
      <div class="text-right">
        <div class="text-sm gold">${fmt(c.totalSpent)} XAF</div>
        <div class="text-xs muted">⭐ ${c.loyaltyPoints} pts</div>
      </div>
    </div>`).join('') || '<div class="muted text-sm py-4 text-center">Aucun client encore.</div>';

  // ── Chart commandes/jour ──────────────────────────────────────────────
  const chartDays = Object.entries(stats.ordersByDay || {});
  const maxOrders = Math.max(...chartDays.map(([, v]) => v), 1);
  const chartHtml = `
    <div class="bar-chart">
      ${chartDays.map(([label, count]) => `
        <div class="flex flex-col items-center flex-1">
          <div class="text-xs muted mb-1">${count > 0 ? count : ''}</div>
          <div class="bar w-full" style="height:${Math.max((count / maxOrders) * 70, 3)}px" title="${label}: ${count}"></div>
          <div class="bar-label">${label}</div>
        </div>`).join('')}
    </div>`;

  return HEAD(`Dashboard — ${restaurant.name}`) + `
<body style="display:flex;height:100vh;overflow:hidden;">
  <!-- Sidebar -->
  <aside class="sidebar p-4 flex flex-col gap-1">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-2 py-4 mb-2">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold" style="background:var(--gold);color:var(--ebony)">${restaurant.logoText}</div>
      <div><div class="font-display text-sm gold leading-tight">${restaurant.name}</div><div class="text-xs muted">Restaurant</div></div>
    </div>

    <button class="nav-link active" data-section="overview" onclick="switchSection('overview')">📊 Vue d'ensemble</button>
    <button class="nav-link" data-section="orders" onclick="switchSection('orders')">🍽️ Commandes <span id="badge-orders" class="ml-auto text-xs px-2 py-0.5 rounded-full" style="background:var(--warn-bg);color:var(--amber)">${stats.ordersPending || ''}</span></button>
    <button class="nav-link" data-section="tables" onclick="switchSection('tables')">🪑 Tables</button>
    <button class="nav-link" data-section="reservations" onclick="switchSection('reservations')">📅 Réservations</button>
    <button class="nav-link" data-section="crm" onclick="switchSection('crm')">👥 Clients CRM</button>
    <button class="nav-link" data-section="promo" onclick="switchSection('promo')">📢 Promotions</button>
    <button class="nav-link" data-section="whatsapp" onclick="switchSection('whatsapp')">💬 WhatsApp</button>

    <div class="mt-auto pt-4 border-t" style="border-color:rgba(201,168,76,.08)">
      <a href="/restaurant/config/${tid}" class="nav-link">⚙️ Configuration</a>
      <a href="/restaurant/admin?secret=${process.env.SUPERADMIN_SECRET || ''}" class="nav-link">🌐 SuperAdmin</a>
    </div>

    <!-- WA Status -->
    <div class="card p-3 mt-3 text-xs">
      <div class="flex items-center gap-2 mb-1">
        <span class="status-dot ${waStatusClass}"></span>
        <span id="wa-status-label">${session.status === 'connected' ? '✓ Connecté' : session.status === 'qr_ready' ? 'Scanner QR' : 'Déconnecté'}</span>
      </div>
      ${session.phone ? `<div class="muted">📱 ${session.phone}</div>` : ''}
    </div>
  </aside>

  <!-- Main -->
  <main class="flex-1 overflow-y-auto p-6">

    <!-- ── Vue d'ensemble ── -->
    <section id="section-overview" class="main-section active">
      <div class="flex items-center justify-between mb-6">
        <div><div class="font-display text-3xl gold">Bonne journée 🌟</div><div class="muted text-sm">${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div></div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">${statCards}</div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Commandes récentes -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="font-display text-lg gold">Commandes récentes</div>
            <button onclick="switchSection('orders')" class="btn btn-ghost btn-sm">Voir tout</button>
          </div>
          ${orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').slice(0, 4).map(o => `
            <div class="flex items-center gap-3 py-2 border-b border-white border-opacity-5">
              <span class="badge badge-${o.status} text-xs">${orderStatusLabel[o.status]}</span>
              <span class="flex-1 text-sm truncate">${o.items.map(i => `${i.emoji}${i.name}`).join(', ')}</span>
              <span class="text-xs gold">${fmt(o.total)}</span>
            </div>`).join('') || '<div class="muted text-sm py-2">Pas de commandes actives.</div>'}
        </div>

        <!-- Top plats + chart -->
        <div class="card p-5">
          <div class="font-display text-lg gold mb-4">Top Plats</div>
          ${topDishesHtml}
          <div class="mt-6">
            <div class="font-display text-sm gold mb-3">Commandes — 7 derniers jours</div>
            ${chartHtml}
          </div>
        </div>
      </div>

      <!-- Réservations du jour -->
      <div class="card p-5 mt-6">
        <div class="font-display text-lg gold mb-4">📅 Réservations d'aujourd'hui</div>
        ${todayReservations.slice(0, 3).map(r => `
          <div class="flex items-center gap-3 py-2 border-b border-white border-opacity-5">
            <span class="font-display text-xl gold">${r.time}</span>
            <span>${r.clientName}</span>
            <span class="text-sm muted">${r.partySize} pers.</span>
            <span class="badge badge-${r.status === 'confirmed' ? 'confirmed' : 'cancelled'} ml-auto">${resaStatusLabel[r.status]}</span>
          </div>`).join('') || '<div class="muted text-sm py-2">Aucune réservation.</div>'}
      </div>
    </section>

    <!-- ── Commandes ── -->
    <section id="section-orders" class="main-section">
      <div class="flex items-center justify-between mb-6">
        <div class="font-display text-3xl gold">🍽️ Commandes</div>
        <div class="flex gap-2">
          <button onclick="filterOrders('all')" class="btn btn-ghost btn-sm" id="filter-all">Toutes</button>
          <button onclick="filterOrders('active')" class="btn btn-gold btn-sm" id="filter-active">Actives</button>
        </div>
      </div>
      <div id="orders-container">${ordersHtml}</div>
    </section>

    <!-- ── Tables ── -->
    <section id="section-tables" class="main-section">
      <div class="flex items-center justify-between mb-6">
        <div class="font-display text-3xl gold">🪑 Plan de Salle</div>
        <div class="flex gap-3 text-xs">
          <span>🟢 Libre (${stats.tablesFree})</span>
          <span>🔴 Occupée (${stats.tablesOccupied})</span>
          <span>🟡 Réservée (${stats.tablesReserved})</span>
          <span class="gold font-medium">Taux: ${stats.occupancyRate}%</span>
        </div>
      </div>
      <div id="tables-grid">${tablesHtml}</div>
    </section>

    <!-- ── Réservations ── -->
    <section id="section-reservations" class="main-section">
      <div class="flex items-center justify-between mb-6">
        <div class="font-display text-3xl gold">📅 Réservations</div>
        <button onclick="document.getElementById('modal-reservation').classList.remove('hidden')" class="btn btn-gold">+ Nouvelle réservation</button>
      </div>
      <div class="tabs-bar flex gap-2 mb-4">
        <button class="tab-btn active" data-tab-group="resa" data-tab="today" onclick="switchTab('resa','today')">Aujourd'hui</button>
        <button class="tab-btn" data-tab-group="resa" data-tab="all" onclick="switchTab('resa','all')">Toutes</button>
      </div>
      <div data-pane-group="resa" data-pane="today" class="tab-pane active">${reservationsHtml}</div>
      <div data-pane-group="resa" data-pane="all" class="tab-pane">
        ${reservations.slice(0, 30).map(r => `
          <div class="card p-4 mb-3 flex items-center justify-between">
            <div>
              <div class="font-medium">${r.clientName} — <span class="gold">${r.partySize}</span> pers.</div>
              <div class="text-xs muted">${r.date} à ${r.time} · ${r.clientPhone}</div>
            </div>
            <span class="badge badge-${r.status === 'confirmed' ? 'confirmed' : r.status === 'cancelled' ? 'cancelled' : 'served'}">${resaStatusLabel[r.status]}</span>
          </div>`).join('') || '<div class="muted text-center py-8">Aucune réservation.</div>'}
      </div>
    </section>

    <!-- ── CRM ── -->
    <section id="section-crm" class="main-section">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="font-display text-3xl gold">👥 Clients</div>
          <div class="muted text-sm">${stats.totalCustomers} clients · ${stats.recurringCustomers} récurrents</div>
        </div>
      </div>
      <div class="card p-5">${customersHtml}</div>
    </section>

    <!-- ── Promotions ── -->
    <section id="section-promo" class="main-section">
      <div class="font-display text-3xl gold mb-6">📢 Promotions & Menu du Jour</div>
      <div class="card p-6 mb-6">
        <div class="font-display text-xl gold mb-4">Envoyer un message groupé</div>
        <div class="mb-4">
          <label>Message WhatsApp</label>
          <textarea id="promo-msg" rows="5" placeholder="🌟 Menu du Jour — Le Jardin d'Ébène&#10;&#10;🍗 Poulet DG ... 7 000 XAF&#10;🌿 Ndolé ..... 5 000 XAF&#10;&#10;Réservez votre table : réserver 2 places à 20h"></textarea>
        </div>
        <div class="flex items-center gap-4 mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="promo-target" id="target-recurring" checked> Clients récurrents (${stats.recurringCustomers})
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="promo-target" id="target-all"> Tous les clients (${stats.totalCustomers})
          </label>
        </div>
        <button onclick="sendBroadcast()" class="btn btn-gold">📢 Envoyer la promotion</button>
        <div id="promo-result" class="text-sm muted mt-3"></div>
      </div>

      <!-- Templates rapides -->
      <div class="card p-5">
        <div class="font-display text-lg gold mb-4">Templates rapides</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onclick="setTemplate('menu_jour')" class="card p-4 text-left hover:border-gold transition-all">
            <div class="text-sm font-medium mb-1">🍽️ Menu du Jour</div>
            <div class="text-xs muted">Annonce du menu quotidien</div>
          </button>
          <button onclick="setTemplate('promo_weekend')" class="card p-4 text-left hover:border-gold transition-all">
            <div class="text-sm font-medium mb-1">🎉 Offre Week-end</div>
            <div class="text-xs muted">Promotion spéciale</div>
          </button>
          <button onclick="setTemplate('happy_hour')" class="card p-4 text-left hover:border-gold transition-all">
            <div class="text-sm font-medium mb-1">🍺 Happy Hour</div>
            <div class="text-xs muted">Réduction boissons</div>
          </button>
          <button onclick="setTemplate('fidelite')" class="card p-4 text-left hover:border-gold transition-all">
            <div class="text-sm font-medium mb-1">⭐ Programme Fidélité</div>
            <div class="text-xs muted">Rappel points clients</div>
          </button>
        </div>
      </div>
    </section>

    <!-- ── WhatsApp ── -->
    <section id="section-whatsapp" class="main-section">
      <div class="font-display text-3xl gold mb-6">💬 WhatsApp Bot</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Connexion -->
        <div class="card p-6">
          <div class="font-display text-xl gold mb-4">Connexion WhatsApp</div>
          <div class="flex items-center gap-3 mb-6">
            <span class="status-dot ${waStatusClass}" style="width:14px;height:14px;"></span>
            <span id="wa-main-status">${session.status === 'connected' ? 'Connecté — ' + session.phone : session.status === 'qr_ready' ? 'Scanner le QR Code' : 'Non connecté'}</span>
          </div>
          <div id="qr-container" class="${session.status === 'qr_ready' ? '' : 'hidden'} mb-4 text-center">
            ${session.qrDataUrl ? `<img src="${session.qrDataUrl}" class="mx-auto rounded-xl" style="max-width:220px;border:2px solid var(--gold);" />` : ''}
          </div>
          <div class="flex gap-3">
            <button id="btn-connect" onclick="connectWA()" class="btn btn-gold">📱 Connecter WhatsApp</button>
            <button onclick="disconnectWA()" class="btn btn-danger">🔌 Déconnecter</button>
          </div>
        </div>

        <!-- QR Code pour clients -->
        <div class="card p-6">
          <div class="font-display text-xl gold mb-4">QR Code Bot Client</div>
          <div class="text-sm muted mb-4">Ce QR Code ouvre directement WhatsApp vers le bot du restaurant. Imprimez-le et placez-le sur les tables !</div>
          ${session.phone ? `
            <div id="bot-qr" class="text-center mb-4"></div>
            <div class="text-xs muted text-center">wa.me/${session.phone}</div>` : '<div class="muted text-sm">Connectez WhatsApp d\'abord.</div>'}
          <div class="text-xs muted mt-3">
            <div class="mb-1 font-medium cream">Commandes clients acceptées:</div>
            <div class="opacity-70">• "menu" — Voir la carte</div>
            <div class="opacity-70">• "commander poulet dg + riz" — Commander</div>
            <div class="opacity-70">• "réserver 2 places à 20h" — Réserver</div>
            <div class="opacity-70">• "panier" / "payer" — Valider commande</div>
          </div>
        </div>
      </div>
    </section>

  </main>

<!-- Modal Réservation -->
<div id="modal-reservation" class="modal-backdrop hidden">
  <div class="modal">
    <div class="font-display text-2xl gold mb-5">Nouvelle Réservation</div>
    <div class="grid grid-cols-2 gap-4">
      <div><label>Nom client *</label><input id="resa-name" placeholder="Jean Mbarga" /></div>
      <div><label>Téléphone</label><input id="resa-phone" placeholder="240555..." /></div>
      <div><label>Nb personnes *</label><input id="resa-size" type="number" min="1" max="20" value="2" /></div>
      <div><label>Heure *</label><input id="resa-time" type="time" value="19:30" /></div>
      <div><label>Date *</label><input id="resa-date" type="date" value="${new Date().toISOString().split('T')[0]}" /></div>
      <div><label>Note</label><input id="resa-note" placeholder="Fenêtre, anniversaire..." /></div>
    </div>
    <div class="flex gap-3 mt-6">
      <button onclick="createReservation()" class="btn btn-gold">✅ Confirmer</button>
      <button onclick="document.getElementById('modal-reservation').classList.add('hidden')" class="btn btn-ghost">Annuler</button>
    </div>
  </div>
</div>
</body>
` + FOOT(`
const TID = '${tid}';
const socket = io();
socket.emit('join_dashboard', TID);

// ── Socket événements ──
socket.on('resto_new_order', o => {
  toast('🍽️ Nouvelle commande ! #'+o.orderId.slice(-6).toUpperCase(),'success');
  const badge = document.getElementById('badge-orders');
  if(badge){ const n = (parseInt(badge.textContent)||0)+1; badge.textContent=n>0?n:''; }
  refreshOrders();
});
socket.on('resto_order_updated', o => refreshOrders());
socket.on('resto_table_updated', d => { refreshTables(); });
socket.on('resto_reservation_created', () => { toast('📅 Nouvelle réservation !','success'); });
socket.on('session_status', d => {
  if(d.tenantId!==TID)return;
  const dots=[...document.querySelectorAll('.status-dot')];
  dots.forEach(el=>{ el.className='status-dot status-'+d.status; });
  const label = d.status==='connected'?('✓ Connecté — '+(d.phone||''))
    :d.status==='qr_ready'?'Scanner le QR Code':'Non connecté';
  const mainLabel=document.getElementById('wa-main-status');
  if(mainLabel)mainLabel.textContent=label;
  const waLabel=document.getElementById('wa-status-label');
  if(waLabel)waLabel.textContent=d.status==='connected'?'✓ Connecté':d.status==='qr_ready'?'Scanner QR':'Déconnecté';
  const qrC=document.getElementById('qr-container');
  if(qrC){ qrC.className=d.qrDataUrl?'mb-4 text-center':'hidden mb-4 text-center'; if(d.qrDataUrl)qrC.innerHTML='<img src="'+d.qrDataUrl+'" class="mx-auto rounded-xl" style="max-width:220px;border:2px solid var(--gold);">'; }
});

// ── Actions ──
async function connectWA(){
  document.getElementById('btn-connect').textContent='⏳ Connexion...';
  await fetch('/restaurant/dashboard/'+TID+'/connect',{method:'POST'});
  setTimeout(()=>{ document.getElementById('btn-connect').textContent='📱 Connecter WhatsApp'; },3000);
}
async function disconnectWA(){ await fetch('/restaurant/dashboard/'+TID+'/disconnect',{method:'POST'}); toast('Déconnecté','error'); }

async function updateOrder(id,status){
  await fetch('/restaurant/orders/'+id+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
  toast(status==='confirmed'?'✅ Confirmée':status==='preparing'?'👨‍🍳 En préparation':status==='ready'?'🔔 Prête!':status==='served'?'✅ Servie':'❌ Annulée', status==='cancelled'?'error':'success');
  refreshOrders();
}

async function refreshOrders(){
  const data=await fetch('/restaurant/dashboard/'+TID+'/orders').then(r=>r.json());
  const container=document.getElementById('orders-container');
  if(!container)return;
  if(!data.length){container.innerHTML='<div class="text-center muted py-12">Aucune commande.</div>';return;}
  container.innerHTML=data.slice(0,50).map(o=>{
    const items=o.items.map(i=>(i.emoji||'🍽️')+' '+i.name+' ×'+i.qty).join(' · ');
    const btnConfirm=o.status==='pending'?'<button onclick="updateOrder(\''+o.orderId+'\',\'confirmed\')" class="btn btn-gold btn-sm">✅ Confirmer</button>':'';
    const btnPrepa=o.status==='confirmed'?'<button onclick="updateOrder(\''+o.orderId+'\',\'preparing\')" class="btn btn-outline btn-sm">👨‍🍳 En prépa</button>':'';
    const btnReady=o.status==='preparing'?'<button onclick="updateOrder(\''+o.orderId+'\',\'ready\')" class="btn btn-outline btn-sm">🔔 Prête</button>':'';
    const btnServed=o.status==='ready'?'<button onclick="updateOrder(\''+o.orderId+'\',\'served\')" class="btn btn-ghost btn-sm">✅ Servie</button>':'';
    const btnCancel=['pending','confirmed','preparing'].includes(o.status)?'<button onclick="updateOrder(\''+o.orderId+'\',\'cancelled\')" class="btn btn-danger btn-sm">✗ Annuler</button>':'';
    const payLbl={cash:'💵 Cash',orange_money:'🟠 OM',momo:'🟡 MoMo'}[o.paymentMethod]||o.paymentMethod;
    const statusLbl={pending:'En attente',confirmed:'Confirmée',preparing:'En préparation',ready:'Prête !',served:'Servie',cancelled:'Annulée'}[o.status]||o.status;
    const time=new Date(o.createdAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    return '<div class="order-row order-'+o.status+' card p-4 mb-3">'+
      '<div class="flex items-start justify-between gap-3">'+
      '<div class="flex-1"><div class="flex items-center gap-2 mb-2"><span class="font-mono text-xs gold">#'+o.orderId.slice(-6).toUpperCase()+'</span><span class="badge badge-'+o.status+'">'+statusLbl+'</span><span class="text-xs muted">'+payLbl+'</span></div>'+
      '<div class="text-sm font-medium mb-1">'+o.clientName+' <span class="muted text-xs">· '+o.clientPhone+'</span></div>'+
      '<div class="text-xs muted">'+items+'</div></div>'+
      '<div class="text-right flex-shrink-0"><div class="font-display text-lg gold">'+Number(o.total).toLocaleString('fr-FR')+' <span class="text-xs">XAF</span></div><div class="text-xs muted">'+time+'</div></div></div>'+
      '<div class="flex gap-2 mt-3 flex-wrap">'+btnConfirm+btnPrepa+btnReady+btnServed+btnCancel+'</div></div>';
  }).join('');
}

async function refreshTables(){
  const data=await fetch('/restaurant/dashboard/'+TID+'/tables').then(r=>r.json());
  const g=document.getElementById('tables-grid');if(!g)return;
  const statusIcon={free:'🟢',occupied:'🔴',reserved:'🟡',out_of_service:'⚫'};
  const statusLbl={free:'Libre',occupied:'Occupée',reserved:'Réservée',out_of_service:'H.S.'};
  g.innerHTML='<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">'+data.map(t=>
    '<div class="table-cell '+t.status+'" onclick="cycleTableStatus(\''+t.tableId+'\',\''+t.status+'\')">'+
    '<div class="text-xl mb-1">'+statusIcon[t.status]+'</div><div class="font-display font-bold text-base">T'+t.number+'</div>'+
    '<div class="text-xs opacity-70">'+t.capacity+' pers</div><div class="text-xs opacity-60 mt-0.5">'+statusLbl[t.status]+'</div></div>'
  ).join('')+'</div>';
}

async function cycleTableStatus(tableId, currentStatus){
  const next={free:'occupied',occupied:'reserved',reserved:'free',out_of_service:'free'};
  const newStatus=next[currentStatus]||'free';
  await fetch('/restaurant/config/'+TID+'/tables/'+tableId+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})});
  refreshTables();
}

async function createReservation(){
  const body={clientName:document.getElementById('resa-name').value,clientPhone:document.getElementById('resa-phone').value,partySize:document.getElementById('resa-size').value,date:document.getElementById('resa-date').value,time:document.getElementById('resa-time').value,note:document.getElementById('resa-note').value};
  if(!body.clientName||!body.partySize||!body.date||!body.time){toast('Champs requis manquants','error');return;}
  const r=await fetch('/restaurant/dashboard/'+TID+'/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
  if(r.success){toast('Réservation créée !','success');document.getElementById('modal-reservation').classList.add('hidden');}
  else toast(r.error||'Erreur','error');
}

async function updateResa(id,status){
  await fetch('/restaurant/dashboard/'+TID+'/reservations/'+id+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
  toast('Réservation mise à jour','success');
}

async function sendBroadcast(){
  const msg=document.getElementById('promo-msg').value;
  if(!msg){toast('Message requis','error');return;}
  const targetAll=document.getElementById('target-all').checked;
  const r=document.getElementById('promo-result');
  r.textContent='⏳ Envoi en cours...';
  const res=await fetch('/restaurant/dashboard/'+TID+'/broadcast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,targetAll})}).then(r=>r.json());
  if(res.success) r.textContent='✅ '+res.sent+'/'+res.total+' messages envoyés avec succès !';
  else r.textContent='❌ '+(res.error||'Erreur');
}

const templates={
  menu_jour:'🌟 *Menu du Jour — ${escapeJs(restaurant.name)}*\\n\\n🍗 Poulet DG ......... 7 000 XAF\\n🌿 Ndolé ............. 5 000 XAF\\n🥩 Bœuf Braisé ....... 6 500 XAF\\n\\n🍹 Jus Naturel ........ 1 500 XAF\\n🍺 Bière Locale ........ 1 000 XAF\\n\\n📅 Réservez votre table:\\n_réserver [nb] places à [heure]_\\n\\n📍 ${escapeJs(restaurant.address)}',
  promo_weekend:'🎉 *Offre Week-end — ${escapeJs(restaurant.name)}*\\n\\nCe vendredi & samedi : *-15% sur tout le menu* !\\n\\nValable sur présentation de ce message.\\n\\n📞 Réservez maintenant : _réserver 2 places à 20h_',
  happy_hour:'🍺 *Happy Hour — ${escapeJs(restaurant.name)}*\\n\\nDe 17h à 19h : *2 boissons pour le prix d\\'une* !\\n\\nBière · Jus · Softs\\n\\nÀ tout à l\\'heure ! 🥂',
  fidelite:'⭐ *Programme Fidélité — ${escapeJs(restaurant.name)}*\\n\\nVous cumulez des points à chaque commande !\\n*1 point = 1 000 XAF dépensé*\\n\\n🎁 À partir de 10 points : dessert offert !\\n🎁 À partir de 25 points : repas gratuit !\\n\\nTapez *menu* pour commander maintenant !'
};
function setTemplate(t){ document.getElementById('promo-msg').value=templates[t]||''; }

function filterOrders(type){
  document.getElementById('filter-all').className=type==='all'?'btn btn-gold btn-sm':'btn btn-ghost btn-sm';
  document.getElementById('filter-active').className=type==='active'?'btn btn-gold btn-sm':'btn btn-ghost btn-sm';
  refreshOrders();
}
`);
}

// ══════════════════════════════════════════════════════════════════════════
// CONFIG RESTAURANT
// ══════════════════════════════════════════════════════════════════════════
export function renderRestaurantConfig(restaurant, menu, tables) {
  const tid = restaurant.tenantId;

  const categories = [...new Set(menu.map(i => i.category))];
  const menuByCategory = {};
  menu.forEach(i => { if (!menuByCategory[i.category]) menuByCategory[i.category] = []; menuByCategory[i.category].push(i); });

  const menuHtml = categories.map(cat => `
    <div class="mb-6">
      <div class="font-display text-lg gold mb-3">${cat}</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${menuByCategory[cat].map(item => `
          <div class="card menu-card ${item.available !== false ? 'available' : 'unavailable'} p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xl">${item.emoji || '🍽️'}</span>
                  <span class="font-medium text-sm">${item.name}</span>
                </div>
                ${item.description ? `<div class="text-xs muted mt-1">${item.description}</div>` : ''}
                <div class="gold text-sm font-medium mt-1">${fmt(item.price)} XAF</div>
              </div>
              <div class="flex gap-1 flex-shrink-0">
                <button onclick="toggleItem('${item.id}',${item.available !== false})" class="btn btn-sm ${item.available !== false ? 'btn-ghost' : 'btn-outline'}">${item.available !== false ? '⏸' : '▶'}</button>
                <button onclick="deleteItem('${item.id}')" class="btn btn-danger btn-sm">✕</button>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  const tablesHtml = tables.map(t => `
    <div class="card p-4 flex items-center gap-4">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm" style="background:var(--gold-dim);color:var(--gold)">T${t.number}</div>
      <div class="flex-1">
        <div class="font-medium text-sm">Table ${t.number} — <span class="muted">${t.capacity} pers.</span></div>
        <div class="text-xs muted">${t.location}</div>
      </div>
      <span class="badge badge-${t.status}">${tableStatusLabel[t.status]}</span>
      <button onclick="deleteTable('${t.tableId}')" class="btn btn-danger btn-sm">✕</button>
    </div>`).join('');

  return HEAD(`Config — ${restaurant.name}`) + `
<body class="p-6">
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <a href="/restaurant/dashboard/${tid}" class="btn btn-ghost btn-sm">← Dashboard</a>
      <div class="font-display text-3xl gold">⚙️ Configuration — ${restaurant.name}</div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button class="tab-btn active" data-tab-group="cfg" data-tab="menu" onclick="switchTab('cfg','menu')">🍽️ Menu</button>
      <button class="tab-btn" data-tab-group="cfg" data-tab="tables" onclick="switchTab('cfg','tables')">🪑 Tables</button>
      <button class="tab-btn" data-tab-group="cfg" data-tab="settings" onclick="switchTab('cfg','settings')">⚙️ Paramètres</button>
    </div>

    <!-- ── Menu ── -->
    <div data-pane-group="cfg" data-pane="menu" class="tab-pane active">
      <!-- Ajouter un article -->
      <div class="card p-5 mb-6">
        <div class="font-display text-xl gold mb-4">+ Ajouter un article</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div><label>Emoji</label><input id="m_emoji" placeholder="🍗" maxlength="4" style="width:80px" /></div>
          <div><label>Nom *</label><input id="m_name" placeholder="Poulet DG" /></div>
          <div><label>Prix (XAF) *</label><input id="m_price" type="number" placeholder="7000" /></div>
          <div><label>Catégorie</label><input id="m_cat" placeholder="Plats Locaux" list="categories-list" />
            <datalist id="categories-list">${categories.map(c => `<option value="${c}">`).join('')}</datalist>
          </div>
        </div>
        <div class="mb-3"><label>Description (optionnel)</label><input id="m_desc" placeholder="Description du plat..." /></div>
        <button onclick="addMenuItem()" class="btn btn-gold">+ Ajouter au menu</button>
      </div>

      <!-- Liste menu -->
      <div id="menu-list">${menuHtml || '<div class="muted text-center py-8">Menu vide.</div>'}</div>
    </div>

    <!-- ── Tables ── -->
    <div data-pane-group="cfg" data-pane="tables" class="tab-pane">
      <div class="card p-5 mb-6">
        <div class="font-display text-xl gold mb-4">+ Ajouter une table</div>
        <div class="grid grid-cols-3 gap-3 mb-3">
          <div><label>Numéro *</label><input id="t_num" type="number" placeholder="7" /></div>
          <div><label>Capacité (pers.) *</label><input id="t_cap" type="number" placeholder="4" /></div>
          <div><label>Emplacement</label><input id="t_loc" placeholder="Terrasse / Salle" /></div>
        </div>
        <button onclick="addTable()" class="btn btn-gold">+ Ajouter la table</button>
      </div>
      <div id="tables-list" class="grid gap-3">${tablesHtml || '<div class="muted text-center py-8">Aucune table.</div>'}</div>
    </div>

    <!-- ── Paramètres ── -->
    <div data-pane-group="cfg" data-pane="settings" class="tab-pane">
      <div class="card p-6">
        <div class="font-display text-xl gold mb-5">Paramètres du restaurant</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div><label>Nom</label><input id="s_name" value="${restaurant.name}" /></div>
          <div><label>Adresse</label><input id="s_addr" value="${restaurant.address}" /></div>
          <div><label>Téléphone Staff WhatsApp</label><input id="s_phone" value="${restaurant.staffPhone}" /></div>
          <div><label>Type de cuisine</label><input id="s_cuisine" value="${restaurant.cuisineType || ''}" /></div>
          <div><label>Horaires d'ouverture</label><input id="s_hours" value="${restaurant.openingHours || ''}" /></div>
        </div>
        <div class="font-display text-lg gold mb-4">Paiements Mobile Money</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div><label>URL Paiement Orange Money</label><input id="s_om" value="${restaurant.omPaymentUrl || ''}" placeholder="https://..." /></div>
          <div><label>URL Paiement MoMo MTN</label><input id="s_momo" value="${restaurant.momoPaymentUrl || ''}" placeholder="https://..." /></div>
        </div>
        <button onclick="saveSettings()" class="btn btn-gold">💾 Enregistrer</button>
      </div>
    </div>
  </div>
</body>
` + FOOT(`
const TID='${tid}';

async function addMenuItem(){
  const body={emoji:document.getElementById('m_emoji').value,name:document.getElementById('m_name').value,price:document.getElementById('m_price').value,category:document.getElementById('m_cat').value||'Plats',description:document.getElementById('m_desc').value};
  if(!body.name||!body.price){toast('Nom et prix requis','error');return;}
  const r=await fetch('/restaurant/config/'+TID+'/menu',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
  if(r.success){toast('Article ajouté !','success');location.reload();}
  else toast(r.error||'Erreur','error');
}

async function toggleItem(id,isAvailable){
  await fetch('/restaurant/config/'+TID+'/menu/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({available:!isAvailable})});
  toast(isAvailable?'Article mis en pause':'Article réactivé','success');
  location.reload();
}

async function deleteItem(id){
  if(!confirm('Supprimer cet article ?'))return;
  await fetch('/restaurant/config/'+TID+'/menu/'+id,{method:'DELETE'});
  toast('Article supprimé','success');location.reload();
}

async function addTable(){
  const body={number:document.getElementById('t_num').value,capacity:document.getElementById('t_cap').value,location:document.getElementById('t_loc').value||'Salle principale'};
  if(!body.number){toast('Numéro requis','error');return;}
  const r=await fetch('/restaurant/config/'+TID+'/tables',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
  if(r.success){toast('Table ajoutée !','success');location.reload();}
  else toast(r.error||'Erreur','error');
}

async function deleteTable(id){
  if(!confirm('Supprimer cette table ?'))return;
  await fetch('/restaurant/config/'+TID+'/tables/'+id,{method:'DELETE'});
  toast('Table supprimée','success');location.reload();
}

async function saveSettings(){
  const body={name:document.getElementById('s_name').value,address:document.getElementById('s_addr').value,staffPhone:document.getElementById('s_phone').value,cuisineType:document.getElementById('s_cuisine').value,openingHours:document.getElementById('s_hours').value,omPaymentUrl:document.getElementById('s_om').value,momoPaymentUrl:document.getElementById('s_momo').value};
  const r=await fetch('/restaurant/config/'+TID+'/settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
  if(r.success)toast('Paramètres sauvegardés !','success');
  else toast(r.error||'Erreur','error');
}
`);
}
