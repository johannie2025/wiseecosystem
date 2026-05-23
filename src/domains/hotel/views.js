// ============================================================
// src/domains/hotel/views.js — Vues HTML Luxury Dark Hotel PMS
// Design: Or #c9a84c · Noir Profond #0a0a0f · Crème #f5efe6
// ============================================================

const HEAD = (title, extra = '') => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Wise Ecosystem</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root{--gold:#c9a84c;--gold-light:#e8c97a;--dark:#0a0a0f;--dark-2:#12121a;--dark-3:#1c1c28;--cream:#f5efe6;--muted:#6b6b7a;}
  *{box-sizing:border-box;}
  body{font-family:'DM Sans',sans-serif;background:var(--dark);color:var(--cream);margin:0;}
  .font-display{font-family:'Cormorant Garamond',serif;}
  .gold{color:var(--gold);} .bg-gold{background:var(--gold);} .border-gold{border-color:var(--gold);}
  .btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold-light));color:#0a0a0f;font-weight:600;letter-spacing:.05em;transition:all .3s;border:none;cursor:pointer;border-radius:8px;}
  .btn-gold:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 8px 20px rgba(201,168,76,.3);}
  .btn-outline{border:1px solid var(--gold);color:var(--gold);background:transparent;transition:all .3s;cursor:pointer;border-radius:8px;}
  .btn-outline:hover{background:var(--gold);color:var(--dark);}
  .btn-danger{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);color:#f87171;cursor:pointer;border-radius:8px;transition:all .3s;}
  .btn-danger:hover{background:rgba(239,68,68,.3);}
  .card{background:var(--dark-2);border:1px solid rgba(201,168,76,.15);border-radius:12px;}
  .card-hover{transition:all .3s;} .card-hover:hover{border-color:rgba(201,168,76,.4);transform:translateY(-1px);}
  .status-dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
  .status-connected{background:#22c55e;box-shadow:0 0 8px #22c55e;}
  .status-qr_ready{background:var(--gold);box-shadow:0 0 8px var(--gold);animation:pulse 1.5s infinite;}
  .status-disconnected,.status-not_initialized,.status-error{background:#ef4444;}
  .status-initializing{background:#60a5fa;animation:pulse 1s infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .room-badge{border-radius:10px;padding:4px 10px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;}
  .badge-available{background:rgba(34,197,94,.2);color:#22c55e;border:1px solid rgba(34,197,94,.3);}
  .badge-occupied{background:rgba(239,68,68,.2);color:#f87171;border:1px solid rgba(239,68,68,.3);}
  .badge-cleaning{background:rgba(251,191,36,.2);color:#fbbf24;border:1px solid rgba(251,191,36,.3);}
  .badge-out_of_service{background:rgba(107,114,128,.2);color:#9ca3af;border:1px solid rgba(107,114,128,.3);}
  .badge-checkout_pending{background:rgba(139,92,246,.2);color:#a78bfa;border:1px solid rgba(139,92,246,.3);}
  .badge-pending{background:rgba(251,191,36,.15);color:#fbbf24;}
  .badge-confirmed{background:rgba(34,197,94,.15);color:#22c55e;}
  .badge-delivered{background:rgba(99,102,241,.15);color:#818cf8;}
  .badge-cancelled{background:rgba(239,68,68,.15);color:#ef4444;}
  .order-card{border-left:3px solid var(--gold);}
  .scrollbar-thin::-webkit-scrollbar{width:4px;} .scrollbar-thin::-webkit-scrollbar-thumb{background:var(--gold);border-radius:2px;}
  input,select,textarea{background:var(--dark-3);border:1px solid rgba(201,168,76,.2);color:var(--cream);border-radius:8px;padding:8px 12px;width:100%;transition:border .2s;}
  input:focus,select:focus,textarea:focus{outline:none;border-color:var(--gold);}
  .tab-btn{padding:8px 20px;border-radius:8px;cursor:pointer;font-size:.85rem;font-weight:500;transition:all .2s;border:1px solid transparent;}
  .tab-btn.active{background:var(--gold);color:#0a0a0f;}
  .tab-btn:not(.active){color:var(--muted);} .tab-btn:not(.active):hover{color:var(--cream);}
  .section{display:none;} .section.active{display:block;}
  .toast{position:fixed;bottom:24px;right:24px;background:var(--dark-3);border:1px solid var(--gold);color:var(--cream);padding:12px 20px;border-radius:10px;font-size:.85rem;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;}
  .toast.show{opacity:1;}
  ${extra}
</style>
</head>`;

const FOOT = (js = '') => `<script>${js}</script></body></html>`;

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = n => Number(n || 0).toLocaleString('fr-FR');
const statusLabel = { available: 'Disponible', occupied: 'Occupée', cleaning: 'Nettoyage', out_of_service: 'Hors service', checkout_pending: 'Checkout' };
const orderLabel  = { pending: 'En attente', confirmed: 'Confirmée', delivered: 'Livrée', cancelled: 'Annulée' };
const roomIcon    = { available: '🟢', occupied: '🔴', cleaning: '🟡', out_of_service: '⚫', checkout_pending: '🟣' };

// ══════════════════════════════════════════════════════════════════════════
// SUPERADMIN
// ══════════════════════════════════════════════════════════════════════════
export function renderSuperAdmin(tenants) {
  const secret = process.env.SUPERADMIN_SECRET || 'WiseDesign2025!';
  const cards = tenants.map(t => `
    <div class="card card-hover p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold font-display" style="background:${t.primaryColor};color:#f5efe6">${t.logoText}</div>
        <div><div class="font-display text-lg gold">${t.name}</div><div class="text-xs text-gray-500">${t.address}</div></div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <a href="/dashboard/${t.tenantId}" class="btn-gold px-4 py-2 text-xs rounded-lg">📊 Dashboard</a>
        <a href="/config/${t.tenantId}" class="btn-outline px-4 py-2 text-xs rounded-lg">⚙️ Config</a>
        <span class="text-xs text-gray-600 self-center">📱 ${t.staffPhone || 'Non défini'}</span>
      </div>
    </div>`).join('');

  return HEAD('SuperAdmin') + `
<body class="min-h-screen p-6">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8"><div class="font-display text-3xl gold">🌐 SuperAdmin</div><div class="text-gray-500 text-sm mt-1">Wise Design Smart Ecosystem</div></div>
    <div class="card p-6 mb-6">
      <div class="font-display text-lg gold mb-4">Créer un nouvel hôtel</div>
      <div class="grid grid-cols-2 gap-3">
        <input id="n_name" placeholder="Nom de l'hôtel" />
        <input id="n_addr" placeholder="Adresse" />
        <input id="n_phone" placeholder="Téléphone staff WhatsApp" />
        <input id="n_color" type="color" value="#1a1a2e" style="height:42px;padding:4px;" />
      </div>
      <button onclick="createTenant()" class="btn-gold px-6 py-2 mt-3 text-sm">+ Créer l'hôtel</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${cards || '<p class="text-gray-500 col-span-2">Aucun hôtel enregistré.</p>'}</div>
  </div>
</body>
${FOOT(`
function toast(msg){const t=document.createElement('div');t.className='toast show';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3000);}
async function createTenant(){
  const body={name:document.getElementById('n_name').value,address:document.getElementById('n_addr').value,staffPhone:document.getElementById('n_phone').value,primaryColor:document.getElementById('n_color').value,adminSecret:'${secret}'};
  const r=await fetch('/admin/tenants',{method:'POST',headers:{'Content-Type':'application/json','x-admin-secret':'${secret}'},body:JSON.stringify(body)});
  const d=await r.json();
  if(d.success){toast('✅ Hôtel créé !');setTimeout(()=>location.reload(),1000);}else{toast('❌ '+d.error);}
}
`)}`;
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD HÔTEL — PMS COMPLET
// ══════════════════════════════════════════════════════════════════════════
export function renderDashboard(tenant, sessionStatus, orders, rooms, stays, stats) {
  const { tenantId, name } = tenant;
  const activeSt = stays.filter(s => s.status === 'active' || s.status === 'checkout_requested');

  // ── Grille des chambres ───────────────────────────────────────────────
  const roomGrid = rooms.map(r => {
    const stay = stays.find(s => s.roomNumber === r.number && (s.status === 'active' || s.status === 'checkout_requested'));
    const guestInfo = stay ? `<div class="text-xs text-gray-400 mt-1 truncate">${stay.guestName}</div>` : '';
    const checkoutBtn = stay ? `<button onclick="showCheckout('${stay.stayId}','${r.number}','${stay.guestName}',${stay.totalDue},'${stay.guestPhone}')" class="mt-2 w-full text-xs btn-outline py-1">🚪 Check-out</button>` : '';
    return `<div class="card p-3 card-hover flex flex-col" data-room="${r.number}" data-status="${r.status}">
      <div class="flex items-start justify-between">
        <div class="font-display text-xl gold">${r.number}</div>
        <span class="room-badge badge-${r.status}">${statusLabel[r.status] || r.status}</span>
      </div>
      <div class="text-xs text-gray-500 mt-1">${r.type} · ${fmt(r.pricePerNight)} XAF/nuit</div>
      ${guestInfo}${checkoutBtn}
    </div>`;
  }).join('');

  // ── Commandes récentes ────────────────────────────────────────────────
  const orderCards = orders.slice(0, 20).map(o => `
    <div class="card p-4 order-card mb-3" id="order-${o.orderId}">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium">Chambre <span class="gold">${o.roomNumber}</span> — #${o.orderId.slice(-6).toUpperCase()}</span>
        <span class="room-badge badge-${o.status} text-xs">${orderLabel[o.status]}</span>
      </div>
      <div class="text-xs text-gray-400">${o.items.map(i => `${i.name} ×${i.qty}`).join(' · ')}${o.total > 0 ? ` — <span class="gold">${fmt(o.total)} XAF</span>` : ''}</div>
      <div class="flex gap-2 mt-3">
        ${o.status === 'pending' ? `<button onclick="updateOrder('${o.orderId}','confirmed')" class="text-xs btn-gold px-3 py-1">✓ Confirmer</button><button onclick="updateOrder('${o.orderId}','cancelled')" class="text-xs btn-danger px-3 py-1">✗ Annuler</button>` : ''}
        ${o.status === 'confirmed' ? `<button onclick="updateOrder('${o.orderId}','delivered')" class="text-xs btn-gold px-3 py-1">📦 Livré</button>` : ''}
      </div>
    </div>`).join('');

  // ── Séjours actifs ────────────────────────────────────────────────────
  const stayRows = activeSt.map(s => {
    const checkOut = new Date(s.checkOutAt).toLocaleDateString('fr-FR');
    const isReq = s.status === 'checkout_requested';
    return `<tr class="${isReq ? 'bg-purple-900/10' : ''}">
      <td class="p-3 gold font-medium">${s.roomNumber}</td>
      <td class="p-3 text-sm">${s.guestName}</td>
      <td class="p-3 text-xs text-gray-400">${s.guestPhone || '—'}</td>
      <td class="p-3 text-xs">${checkOut}</td>
      <td class="p-3 text-right gold text-sm">${fmt(s.totalDue)} XAF</td>
      <td class="p-3 text-right">
        ${isReq ? `<span class="room-badge badge-checkout_pending mr-2">Demandé</span>` : ''}
        <button onclick="showCheckout('${s.stayId}','${s.roomNumber}','${s.guestName}',${s.totalDue},'${s.guestPhone}')" class="text-xs btn-outline px-3 py-1">🚪 Check-out</button>
      </td>
    </tr>`;
  }).join('');

  const waStatus = sessionStatus.status;

  return HEAD(`Dashboard — ${name}`) + `
<body class="min-h-screen">
  <!-- Header -->
  <header class="border-b border-yellow-900/20 px-6 py-4 flex items-center justify-between sticky top-0 z-40" style="background:var(--dark-2)">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-display" style="background:${tenant.primaryColor};color:#f5efe6">${tenant.logoText}</div>
      <div>
        <div class="font-display text-lg gold leading-tight">${name}</div>
        <div class="text-xs text-gray-500">${tenant.address}</div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span class="status-dot status-${waStatus}" id="wa-dot"></span>
      <span class="text-xs text-gray-400" id="wa-label">${{{'connected':'✓ Connecté','qr_ready':'⟳ QR — Scanner','disconnected':'✗ Déconnecté','initializing':'⟳ Initialisation...'}['${waStatus}'] || '${waStatus}'}}</span>
      <button onclick="connectWA()" class="btn-gold px-4 py-2 text-xs">⚡ ${waStatus === 'connected' ? 'Relancer' : 'Connecter WA'}</button>
      <button onclick="disconnectWA()" class="btn-outline px-4 py-2 text-xs">✕ Déconnecter</button>
      <a href="/config/${tenantId}" class="btn-outline px-4 py-2 text-xs">⚙️ Config</a>
    </div>
  </header>

  <!-- QR Code inline — affiché sous le header, géré par Socket.IO -->
  <div id="qr-container" class="flex justify-center py-4" style="background:var(--dark-2);border-bottom:1px solid rgba(201,168,76,0.1);${waStatus === 'qr_ready' ? '' : 'display:none!important'}">
    ${waStatus === 'qr_ready' && sessionStatus.qrDataUrl ? `
      <div class="flex flex-col items-center gap-2">
        <p class="text-xs text-gray-400">Ouvrez WhatsApp → Appareils liés → Scanner ce QR</p>
        <div class="p-3 bg-white rounded-2xl inline-block shadow-2xl shadow-yellow-900/20">
          <img src="${sessionStatus.qrDataUrl}" alt="QR WhatsApp" style="width:208px;height:208px;">
        </div>
      </div>` : ''}
  </div>

  <!-- Check-in Modal -->
  <div id="checkin-modal" class="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-4">
    <div class="card p-6 w-full max-w-md">
      <div class="font-display text-xl gold mb-4">📋 Nouveau Check-in</div>
      <div class="grid gap-3">
        <div><label class="text-xs text-gray-400 mb-1 block">Chambre *</label><input id="ci-room" placeholder="ex: 101" /></div>
        <div><label class="text-xs text-gray-400 mb-1 block">Nom du client *</label><input id="ci-name" placeholder="Nom complet" /></div>
        <div><label class="text-xs text-gray-400 mb-1 block">N° CNI / Passeport</label><input id="ci-id" placeholder="CNI-2024-001" /></div>
        <div><label class="text-xs text-gray-400 mb-1 block">Téléphone WhatsApp</label><input id="ci-phone" placeholder="240XXXXXXXXX" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs text-gray-400 mb-1 block">Durée (nuits)</label><input id="ci-days" type="number" min="0" value="1" /></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Durée (heures)</label><input id="ci-hours" type="number" min="0" value="0" /></div>
        </div>
      </div>
      <div class="flex gap-3 mt-5">
        <button onclick="submitCheckin()" class="btn-gold flex-1 py-2 text-sm">✅ Enregistrer</button>
        <button onclick="document.getElementById('checkin-modal').classList.add('hidden')" class="btn-outline flex-1 py-2 text-sm">Annuler</button>
      </div>
    </div>
  </div>

  <!-- Checkout Modal -->
  <div id="checkout-modal" class="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-4">
    <div class="card p-6 w-full max-w-md">
      <div class="font-display text-xl gold mb-1">🚪 Check-out</div>
      <p class="text-xs text-gray-400 mb-4">Chambre <span id="co-room" class="gold"></span> — <span id="co-name"></span></p>
      <div class="card p-4 mb-4 text-center">
        <div class="text-sm text-gray-400 mb-1">Total à régler</div>
        <div class="font-display text-3xl gold" id="co-total"></div>
        <div class="text-xs text-gray-500">XAF</div>
      </div>
      <div><label class="text-xs text-gray-400 mb-1 block">Mode de paiement</label>
        <select id="co-payment">
          <option value="cash">💵 Espèces</option>
          <option value="mobile_money">📱 Mobile Money</option>
          <option value="card">💳 Carte bancaire</option>
        </select>
      </div>
      <div class="flex gap-3 mt-5">
        <button onclick="submitCheckout()" class="btn-gold flex-1 py-2 text-sm">✅ Valider & Envoyer Facture WA</button>
        <button onclick="document.getElementById('checkout-modal').classList.add('hidden')" class="btn-outline flex-1 py-2 text-sm">Annuler</button>
      </div>
      <input type="hidden" id="co-stay-id" />
    </div>
  </div>

  <main class="max-w-7xl mx-auto p-6">
    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-4 text-center"><div class="font-display text-3xl gold">${stats.roomsAvailable}</div><div class="text-xs text-gray-400 mt-1">🟢 Disponibles</div></div>
      <div class="card p-4 text-center"><div class="font-display text-3xl" style="color:#f87171">${stats.roomsOccupied}</div><div class="text-xs text-gray-400 mt-1">🔴 Occupées</div></div>
      <div class="card p-4 text-center"><div class="font-display text-3xl" style="color:#fbbf24">${stats.roomsCleaning}</div><div class="text-xs text-gray-400 mt-1">🟡 Nettoyage</div></div>
      <div class="card p-4 text-center"><div class="font-display text-3xl gold" id="stat-revenue-today">${fmt(stats.revenueToday)}</div><div class="text-xs text-gray-400 mt-1">💰 Recettes du jour (XAF)</div></div>
    </div>

    <!-- Onglets -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button class="tab-btn active" onclick="showTab('rooms',this)">🏠 Chambres (${rooms.length})</button>
      <button class="tab-btn" onclick="showTab('orders',this)">📋 Commandes <span id="pending-count" class="ml-1 bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">${stats.pendingOrders}</span></button>
      <button class="tab-btn" onclick="showTab('stays',this)">👤 Séjours actifs (${activeSt.length})</button>
      <button class="tab-btn" onclick="showTab('finance',this)">💹 Finances</button>
      <button onclick="document.getElementById('checkin-modal').classList.remove('hidden')" class="btn-gold px-5 py-2 text-sm ml-auto">+ Check-in</button>
    </div>

    <!-- SECTION: Chambres -->
    <div id="tab-rooms" class="section active">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" id="rooms-grid">
        ${roomGrid || '<p class="text-gray-500 col-span-5">Aucune chambre. <a href="/config/${tenantId}" class="gold underline">Configurer</a></p>'}
      </div>
    </div>

    <!-- SECTION: Commandes -->
    <div id="tab-orders" class="section">
      <div id="orders-list">${orderCards || '<p class="text-gray-500">Aucune commande.</p>'}</div>
    </div>

    <!-- SECTION: Séjours actifs -->
    <div id="tab-stays" class="section">
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-yellow-900/20 text-xs text-gray-500">
            <th class="p-3 text-left">Chambre</th><th class="p-3 text-left">Client</th><th class="p-3 text-left">Téléphone</th><th class="p-3 text-left">Check-out</th><th class="p-3 text-right">Total</th><th class="p-3"></th>
          </tr></thead>
          <tbody id="stays-body">${stayRows || '<tr><td colspan="6" class="p-6 text-center text-gray-500">Aucun séjour actif.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <!-- SECTION: Finances -->
    <div id="tab-finance" class="section">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card p-6 text-center">
          <div class="text-xs text-gray-400 mb-2">📅 Aujourd'hui</div>
          <div class="font-display text-2xl gold">${fmt(stats.revenueToday)}</div>
          <div class="text-xs text-gray-500">XAF</div>
        </div>
        <div class="card p-6 text-center">
          <div class="text-xs text-gray-400 mb-2">📆 Ce mois</div>
          <div class="font-display text-2xl gold">${fmt(stats.revenueMonth)}</div>
          <div class="text-xs text-gray-500">XAF</div>
        </div>
        <div class="card p-6 text-center">
          <div class="text-xs text-gray-400 mb-2">📊 Total historique</div>
          <div class="font-display text-2xl gold">${fmt(stats.revenueTotal)}</div>
          <div class="text-xs text-gray-500">XAF</div>
        </div>
      </div>
      <div class="card p-6">
        <div class="font-display text-lg gold mb-4">Historique des séjours clôturés</div>
        <div id="closed-stays-list"><p class="text-gray-500 text-sm">Chargement...</p></div>
      </div>
    </div>
  </main>
  <div class="toast" id="toast"></div>
</body>
${FOOT(`
const TID='${tenantId}';
const socket=io();
socket.emit('join_dashboard',TID);

function toast(msg,ok=true){const t=document.getElementById('toast');t.textContent=msg;t.style.borderColor=ok?'var(--gold)':'#ef4444';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500);}
function showTab(name,btn){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.getElementById('tab-'+name).classList.add('active');document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');if(name==='finance')loadClosedStays();}

// ── WhatsApp — logique identique à views_hotel.js (liaison <10s) ──────────
async function connectWA(){
  document.getElementById('wa-label').textContent='⟳ Connexion en cours...';
  await fetch('/dashboard/'+TID+'/connect',{method:'POST'});
}
async function disconnectWA(){
  await fetch('/dashboard/'+TID+'/disconnect',{method:'POST'});
}

const WA_LABELS={'connected':'✓ Connecté','qr_ready':'⟳ QR Prêt — Scanner maintenant','disconnected':'✗ Déconnecté','initializing':'⟳ Initialisation...','error':'✗ Erreur'};

socket.on('session_status',({tenantId,status,qrDataUrl,phone})=>{
  if(tenantId!==TID)return;
  // Statut dot + label
  const dot=document.getElementById('wa-dot');
  const lbl=document.getElementById('wa-label');
  if(dot)dot.className='status-dot status-'+status;
  if(lbl)lbl.textContent=WA_LABELS[status]||status;

  // QR inline
  const qrEl=document.getElementById('qr-container');
  if(status==='qr_ready'&&qrDataUrl){
    qrEl.style.display='flex';
    qrEl.innerHTML=`<div class="flex flex-col items-center gap-2">
      <p class="text-xs text-gray-400">Ouvrez WhatsApp → Appareils liés → Scanner ce QR</p>
      <div class="p-3 bg-white rounded-2xl inline-block shadow-2xl shadow-yellow-900/20">
        <img src="${qrDataUrl}" alt="QR" style="width:208px;height:208px;">
      </div></div>`;
  } else if(status==='connected'){
    qrEl.style.display='flex';
    qrEl.innerHTML=`<div class="text-center py-2"><div class="text-3xl mb-1">✅</div><div class="text-sm" style="color:#22c55e">WhatsApp opérationnel</div>${phone?`<div class="text-xs text-gray-500 mt-1">📱 ${phone}</div>`:''}</div>`;
    toast('✅ WhatsApp connecté !');
  } else {
    qrEl.style.display='none';
    qrEl.innerHTML='';
  }
});

// ── Commandes ─────────────────────────────────────────────────────────────
async function updateOrder(id,status){
  await fetch('/orders/'+id+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
}
socket.on('new_order',o=>{
  const list=document.getElementById('orders-list');
  const div=document.createElement('div');
  div.className='card p-4 order-card mb-3';div.id='order-'+o.orderId;
  div.innerHTML='<div class="flex items-center justify-between mb-2"><span class="text-sm font-medium">Chambre <span class="gold">'+o.roomNumber+'</span> — #'+o.orderId.slice(-6).toUpperCase()+'</span><span class="room-badge badge-pending text-xs">En attente</span></div><div class="text-xs text-gray-400">'+o.items.map(i=>i.name+' ×'+i.qty).join(' · ')+(o.total>0?' — <span class="gold">'+o.total.toLocaleString()+' XAF</span>':'')+'</div><div class="flex gap-2 mt-3"><button onclick="updateOrder(\''+o.orderId+'\',\'confirmed\')" class="text-xs btn-gold px-3 py-1">✓ Confirmer</button><button onclick="updateOrder(\''+o.orderId+'\',\'cancelled\')" class="text-xs btn-danger px-3 py-1">✗ Annuler</button></div>';
  if(list.firstChild)list.insertBefore(div,list.firstChild);else list.appendChild(div);
  const pc=document.getElementById('pending-count');if(pc)pc.textContent=parseInt(pc.textContent||0)+1;
  toast('📋 Nouvelle commande — Chambre '+o.roomNumber);
});
socket.on('order_updated',o=>{
  const el=document.getElementById('order-'+o.orderId);
  if(el){const labels={pending:'En attente',confirmed:'Confirmée',delivered:'Livrée',cancelled:'Annulée'};el.querySelector('.room-badge').textContent=labels[o.status]||o.status;el.querySelector('.room-badge').className='room-badge badge-'+o.status+' text-xs';el.querySelectorAll('button').forEach(b=>b.remove());}
});

// ── Chambres (temps réel) ─────────────────────────────────────────────────
socket.on('room_updated',d=>{loadRooms();});
socket.on('stay_created',s=>{toast('✅ Check-in: '+s.guestName+' — Chambre '+s.roomNumber);loadRooms();});
socket.on('checkout_requested',s=>{toast('🚪 Checkout demandé — Chambre '+s.roomNumber);});
socket.on('stay_closed',s=>{toast('💰 Séjour clôturé — '+s.guestName);loadRooms();});

async function loadRooms(){
  const r=await fetch('/dashboard/'+TID+'/rooms');
  const rooms=await r.json();
  renderRoomsGrid(rooms);
}

function renderRoomsGrid(rooms){
  const grid=document.getElementById('rooms-grid');if(!grid)return;
  const statusLabel={available:'Disponible',occupied:'Occupée',cleaning:'Nettoyage',out_of_service:'Hors service',checkout_pending:'Checkout'};
  grid.innerHTML=rooms.map(r=>{
    return '<div class="card p-3 card-hover flex flex-col" data-room="'+r.number+'" data-status="'+r.status+'"><div class="flex items-start justify-between"><div class="font-display text-xl gold">'+r.number+'</div><span class="room-badge badge-'+r.status+'">'+(statusLabel[r.status]||r.status)+'</span></div><div class="text-xs text-gray-500 mt-1">'+r.type+' · '+Number(r.pricePerNight).toLocaleString()+' XAF/nuit</div></div>';
  }).join('');
}

// ── Check-in ──────────────────────────────────────────────────────────────
async function submitCheckin(){
  const body={roomNumber:document.getElementById('ci-room').value,guestName:document.getElementById('ci-name').value,guestId:document.getElementById('ci-id').value,guestPhone:document.getElementById('ci-phone').value,durationDays:document.getElementById('ci-days').value,durationHours:document.getElementById('ci-hours').value};
  if(!body.roomNumber||!body.guestName){toast('Chambre et nom requis',false);return;}
  const r=await fetch('/dashboard/'+TID+'/checkin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  if(d.success){toast('✅ Check-in enregistré !');document.getElementById('checkin-modal').classList.add('hidden');}
  else{toast('❌ '+d.error,false);}
}

// ── Checkout ──────────────────────────────────────────────────────────────
function showCheckout(stayId,room,name,total,phone){
  document.getElementById('co-stay-id').value=stayId;
  document.getElementById('co-room').textContent=room;
  document.getElementById('co-name').textContent=name;
  document.getElementById('co-total').textContent=Number(total).toLocaleString('fr-FR');
  document.getElementById('checkout-modal').classList.remove('hidden');
}
async function submitCheckout(){
  const stayId=document.getElementById('co-stay-id').value;
  const paymentMethod=document.getElementById('co-payment').value;
  const r=await fetch('/dashboard/'+TID+'/stays/'+stayId+'/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentMethod})});
  const d=await r.json();
  if(d.success){toast('✅ Check-out validé — Facture envoyée sur WhatsApp !');document.getElementById('checkout-modal').classList.add('hidden');}
  else{toast('❌ '+d.error,false);}
}

// ── Finances ──────────────────────────────────────────────────────────────
async function loadClosedStays(){
  const r=await fetch('/dashboard/'+TID+'/stays');
  const stays=await r.json();
  const closed=stays.filter(s=>s.status==='closed');
  const el=document.getElementById('closed-stays-list');
  if(!el)return;
  if(!closed.length){el.innerHTML='<p class="text-gray-500 text-sm">Aucun séjour clôturé.</p>';return;}
  el.innerHTML='<table class="w-full text-sm"><thead><tr class="border-b border-yellow-900/20 text-xs text-gray-500"><th class="p-3 text-left">Client</th><th class="p-3 text-left">Chambre</th><th class="p-3 text-left">Départ</th><th class="p-3 text-right gold">Total</th></tr></thead><tbody>'+closed.slice(0,50).map(s=>'<tr class="border-b border-yellow-900/10"><td class="p-3">'+s.guestName+'</td><td class="p-3 gold">'+s.roomNumber+'</td><td class="p-3 text-xs text-gray-400">'+new Date(s.closedAt).toLocaleDateString("fr-FR")+'</td><td class="p-3 text-right gold">'+Number(s.totalDue).toLocaleString()+' XAF</td></tr>').join('')+'</tbody></table>';
}
`)}`;
}

// ══════════════════════════════════════════════════════════════════════════
// CONFIGURATION BACKOFFICE — CRUD Chambres + Menu
// ══════════════════════════════════════════════════════════════════════════
export function renderConfig(tenant, rooms, menu) {
  const { tenantId, name } = tenant;

  const roomRows = rooms.map(r => `
    <tr class="border-b border-yellow-900/10" id="rrow-${r.roomId}">
      <td class="p-3 gold font-medium">${r.number}</td>
      <td class="p-3 text-sm">${r.type}</td>
      <td class="p-3 text-sm">${fmt(r.pricePerNight)} XAF</td>
      <td class="p-3 text-sm">${fmt(r.pricePerHour)} XAF</td>
      <td class="p-3"><span class="room-badge badge-${r.status}">${statusLabel[r.status] || r.status}</span></td>
      <td class="p-3">
        <select onchange="changeRoomStatus('${r.roomId}',this.value,'${tenantId}')" class="text-xs" style="width:auto;padding:4px 8px;">
          <option value="">— Changer statut —</option>
          <option value="available">🟢 Disponible</option>
          <option value="cleaning">🟡 Nettoyage</option>
          <option value="out_of_service">⚫ Hors service</option>
        </select>
      </td>
      <td class="p-3 text-right">
        <button onclick="deleteRoom('${r.roomId}','${tenantId}')" class="btn-danger text-xs px-3 py-1">Suppr.</button>
      </td>
    </tr>`).join('');

  const cats = [...new Set(menu.map(m => m.category))];
  const menuRows = menu.map(m => `
    <tr class="border-b border-yellow-900/10" id="mrow-${m.id}">
      <td class="p-3 text-lg">${m.emoji}</td>
      <td class="p-3 text-sm">${m.name}</td>
      <td class="p-3 text-sm text-gray-400">${m.category}</td>
      <td class="p-3 gold text-sm">${fmt(m.price)} XAF</td>
      <td class="p-3 text-right">
        <button onclick="deleteMenuItem('${m.id}','${tenantId}')" class="btn-danger text-xs px-3 py-1">Suppr.</button>
      </td>
    </tr>`).join('');

  return HEAD(`Configuration — ${name}`) + `
<body class="min-h-screen p-6">
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <a href="/dashboard/${tenantId}" class="btn-outline px-4 py-2 text-sm">← Dashboard</a>
      <div>
        <div class="font-display text-2xl gold">Configuration</div>
        <div class="text-xs text-gray-500">${name}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button class="tab-btn active" onclick="showTab('cfg-rooms',this)">🏠 Chambres</button>
      <button class="tab-btn" onclick="showTab('cfg-menu',this)">🍽️ Menu & Services</button>
    </div>

    <!-- ── CHAMBRES ────────────────────────────────────────────── -->
    <div id="tab-cfg-rooms" class="section active">
      <div class="card p-6 mb-5">
        <div class="font-display text-lg gold mb-4">Ajouter une chambre</div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label class="text-xs text-gray-400 mb-1 block">Numéro *</label><input id="r-num" placeholder="ex: 101" /></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Type</label>
            <select id="r-type"><option>Standard</option><option>Deluxe</option><option>Suite</option></select></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Étage</label><input id="r-floor" placeholder="1" /></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Prix/nuit (XAF)</label><input id="r-night" type="number" placeholder="25000" /></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Prix/heure (XAF)</label><input id="r-hour" type="number" placeholder="5000" /></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Description</label><input id="r-desc" placeholder="Vue mer, Climatisé..." /></div>
        </div>
        <button onclick="addRoom()" class="btn-gold px-6 py-2 mt-4 text-sm">+ Ajouter la chambre</button>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm" id="rooms-table">
          <thead><tr class="border-b border-yellow-900/20 text-xs text-gray-500">
            <th class="p-3 text-left">N°</th><th class="p-3 text-left">Type</th><th class="p-3 text-left">Nuit</th><th class="p-3 text-left">Heure</th><th class="p-3 text-left">Statut</th><th class="p-3">Action statut</th><th class="p-3"></th>
          </tr></thead>
          <tbody id="rooms-tbody">${roomRows || '<tr><td colspan="7" class="p-6 text-center text-gray-500">Aucune chambre.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <!-- ── MENU ───────────────────────────────────────────────── -->
    <div id="tab-cfg-menu" class="section">
      <div class="card p-6 mb-5">
        <div class="font-display text-lg gold mb-4">Ajouter un article / service</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label class="text-xs text-gray-400 mb-1 block">Emoji</label><input id="m-emoji" placeholder="🍽️" style="font-size:1.5rem;text-align:center;" /></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Nom *</label><input id="m-name" placeholder="Nom du plat ou service" /></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Catégorie</label>
            <select id="m-cat"><option>Restauration</option><option>Boissons</option><option>Pâtisseries</option><option>Services</option><option>Conciergerie</option><option>Autres</option></select></div>
          <div><label class="text-xs text-gray-400 mb-1 block">Prix (XAF)</label><input id="m-price" type="number" placeholder="0" /></div>
        </div>
        <button onclick="addMenuItem()" class="btn-gold px-6 py-2 mt-4 text-sm">+ Ajouter l'article</button>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-yellow-900/20 text-xs text-gray-500">
            <th class="p-3 text-left">Emoji</th><th class="p-3 text-left">Nom</th><th class="p-3 text-left">Catégorie</th><th class="p-3 text-left">Prix</th><th class="p-3"></th>
          </tr></thead>
          <tbody id="menu-tbody">${menuRows || '<tr><td colspan="5" class="p-6 text-center text-gray-500">Menu vide.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="toast" id="toast"></div>
</body>
${FOOT(`
const TID='${tenantId}';
function toast(msg,ok=true){const t=document.getElementById('toast');t.textContent=msg;t.style.borderColor=ok?'var(--gold)':'#ef4444';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500);}
function showTab(name,btn){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.getElementById('tab-'+name).classList.add('active');document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}

async function addRoom(){
  const body={number:document.getElementById('r-num').value,type:document.getElementById('r-type').value,floor:document.getElementById('r-floor').value,pricePerNight:document.getElementById('r-night').value,pricePerHour:document.getElementById('r-hour').value,description:document.getElementById('r-desc').value};
  if(!body.number){toast('Numéro de chambre requis',false);return;}
  const r=await fetch('/config/'+TID+'/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  if(d.success){toast('✅ Chambre ajoutée !');setTimeout(()=>location.reload(),1000);}else{toast('❌ '+d.error,false);}
}

async function deleteRoom(roomId,tid){
  if(!confirm('Supprimer cette chambre ?'))return;
  const r=await fetch('/config/'+tid+'/rooms/'+roomId,{method:'DELETE'});
  const d=await r.json();
  if(d.success){toast('Chambre supprimée');document.getElementById('rrow-'+roomId)?.remove();}else{toast('❌ '+d.error,false);}
}

async function changeRoomStatus(roomId,status,tid){
  if(!status)return;
  const r=await fetch('/config/'+tid+'/rooms/'+roomId+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
  const d=await r.json();
  if(d.success){toast('✅ Statut mis à jour');setTimeout(()=>location.reload(),800);}else{toast('❌ '+d.error,false);}
}

async function addMenuItem(){
  const body={emoji:document.getElementById('m-emoji').value||'🍽️',name:document.getElementById('m-name').value,category:document.getElementById('m-cat').value,price:document.getElementById('m-price').value};
  if(!body.name){toast('Nom requis',false);return;}
  const r=await fetch('/config/'+TID+'/menu',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  if(d.success){toast('✅ Article ajouté !');setTimeout(()=>location.reload(),1000);}else{toast('❌ '+d.error,false);}
}

async function deleteMenuItem(itemId,tid){
  if(!confirm('Supprimer cet article ?'))return;
  const r=await fetch('/config/'+tid+'/menu/'+itemId,{method:'DELETE'});
  const d=await r.json();
  if(d.success){toast('Article supprimé');document.getElementById('mrow-'+itemId)?.remove();}else{toast('❌ '+d.error,false);}
}
`)}`;
}

// ══════════════════════════════════════════════════════════════════════════
// VUE CLIENT — ROOM SERVICE CONTEXTUALISÉ
// ══════════════════════════════════════════════════════════════════════════
export function renderRoom(tenant, roomNumber, menu, activeStay, orders = []) {
  const { tenantId, name } = tenant;

  // Regrouper le menu par catégorie
  const cats = {};
  menu.forEach(m => { if (!cats[m.category]) cats[m.category] = []; cats[m.category].push(m); });

  const menuHtml = Object.entries(cats).map(([cat, items]) => `
    <div class="mb-5">
      <div class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">${cat}</div>
      <div class="grid grid-cols-2 gap-3">
        ${items.map(m => `
          <div class="card p-3 card-hover cursor-pointer select-none" onclick="addItem('${m.id}','${m.name.replace(/'/g,"\\'")}',${m.price},'${m.emoji}')">
            <div class="text-2xl mb-1">${m.emoji}</div>
            <div class="text-sm font-medium leading-tight">${m.name}</div>
            <div class="text-xs mt-1 ${m.price > 0 ? 'gold' : 'text-gray-500'}">${m.price > 0 ? fmt(m.price) + ' XAF' : 'Gratuit'}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  // Commandes de la session actuelle
  const prevOrders = orders.slice(0, 5).map(o => `
    <div class="flex items-center justify-between py-2 border-b border-yellow-900/10 text-xs">
      <span class="text-gray-400">${o.items.map(i => i.name).join(', ')}</span>
      <span class="room-badge badge-${o.status}">${orderLabel[o.status] || o.status}</span>
    </div>`).join('');

  const guestGreeting = activeStay
    ? `<div class="card p-4 mb-5 flex items-center gap-3">
        <div class="text-2xl">👤</div>
        <div>
          <div class="font-display text-lg gold">Bienvenue, ${activeStay.guestName}</div>
          <div class="text-xs text-gray-400">Chambre ${roomNumber} · Check-out: ${new Date(activeStay.checkOutAt).toLocaleString('fr-FR')}</div>
        </div>
      </div>`
    : `<div class="card p-4 mb-5 text-center text-gray-500 text-sm">
        <div class="text-xl mb-1">🏨</div>
        Chambre ${roomNumber} — Scannez à la réception pour vous enregistrer
      </div>`;

  const billSection = activeStay ? `
    <div class="card p-4 mb-5">
      <div class="flex items-center justify-between mb-3">
        <div class="font-display text-base gold">Ma note de chambre</div>
        <div class="text-xs text-gray-400">Mise à jour en temps réel</div>
      </div>
      <div class="flex justify-between text-sm mb-1"><span class="text-gray-400">Hébergement</span><span>${fmt(activeStay.priceBase)} XAF</span></div>
      <div class="flex justify-between text-sm mb-2"><span class="text-gray-400">Room Service</span><span>${fmt(activeStay.orderTotal)} XAF</span></div>
      <div class="flex justify-between font-semibold border-t border-yellow-900/20 pt-2"><span class="gold">Total estimé</span><span class="gold" id="bill-total">${fmt(activeStay.totalDue)} XAF</span></div>
      <button onclick="requestCheckout()" class="btn-outline w-full mt-3 py-2 text-sm">🚪 Demander mon Check-out</button>
    </div>` : '';

  return HEAD(`Room Service — Chambre ${roomNumber}`, `
    .item-count{min-width:28px;height:28px;border-radius:50%;background:var(--gold);color:#0a0a0f;font-weight:700;font-size:.85rem;display:flex;align-items:center;justify-content:center;}
  `) + `
<body class="min-h-screen">
  <header class="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style="background:var(--dark-2);border-bottom:1px solid rgba(201,168,76,.1)">
    <div>
      <div class="font-display text-lg gold">${name}</div>
      <div class="text-xs text-gray-500">Chambre ${roomNumber} — Room Service</div>
    </div>
    <button onclick="toggleCart()" class="btn-outline px-4 py-2 text-sm flex items-center gap-2">
      🛒 <span id="cart-count" class="item-count text-xs" style="min-width:20px;height:20px;display:${Object.keys({}).length ? 'flex' : 'none'}">0</span>
    </button>
  </header>

  <!-- Cart Drawer -->
  <div id="cart-drawer" class="fixed inset-0 z-50 hidden">
    <div class="absolute inset-0 bg-black/70" onclick="toggleCart()"></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-sm flex flex-col" style="background:var(--dark-2)">
      <div class="p-5 border-b border-yellow-900/20 flex items-center justify-between">
        <div class="font-display text-xl gold">Ma commande</div>
        <button onclick="toggleCart()" class="text-gray-400 text-xl">✕</button>
      </div>
      <div id="cart-items" class="flex-1 overflow-y-auto p-5 scrollbar-thin"></div>
      <div class="p-5 border-t border-yellow-900/20">
        <div class="flex justify-between mb-3 text-sm"><span class="text-gray-400">Total</span><span class="gold font-semibold" id="cart-total">0 XAF</span></div>
        <textarea id="order-note" placeholder="Note pour la cuisine (optionnel)..." class="w-full text-xs mb-3" rows="2"></textarea>
        <button onclick="submitOrder()" class="btn-gold w-full py-3 text-sm">📤 Envoyer la commande</button>
      </div>
    </div>
  </div>

  <!-- Success Modal -->
  <div id="success-modal" class="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-4">
    <div class="card p-8 text-center max-w-sm w-full">
      <div class="text-5xl mb-3">✅</div>
      <div class="font-display text-2xl gold mb-2">Commande envoyée!</div>
      <p class="text-sm text-gray-400 mb-5">Nous vous apportons votre commande dans les plus brefs délais.</p>
      <button onclick="document.getElementById('success-modal').classList.add('hidden')" class="btn-gold w-full py-3">Fermer</button>
    </div>
  </div>

  <main class="max-w-lg mx-auto p-4 pb-24">
    ${guestGreeting}
    ${billSection}

    ${prevOrders ? `<div class="mb-5"><div class="text-xs text-gray-500 uppercase tracking-widest mb-3">Commandes précédentes</div>${prevOrders}</div>` : ''}

    <div class="text-xs text-gray-500 uppercase tracking-widest mb-4">Menu & Services</div>
    ${menuHtml}
  </main>
  <div class="toast" id="toast"></div>
</body>
${FOOT(`
const TID='${tenantId}', ROOM='${roomNumber}';
let cart={};

function toast(msg,ok=true){const t=document.getElementById('toast');t.textContent=msg;t.style.borderColor=ok?'var(--gold)':'#ef4444';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}

function addItem(id,name,price,emoji){
  if(!cart[id])cart[id]={id,name,price,emoji,qty:0};
  cart[id].qty++;
  renderCart();
  toast(emoji+' '+name+' ajouté');
}

function renderCart(){
  const items=Object.values(cart).filter(i=>i.qty>0);
  const count=items.reduce((s,i)=>s+i.qty,0);
  const total=items.reduce((s,i)=>s+(i.price*i.qty),0);
  const cc=document.getElementById('cart-count');
  if(cc){cc.textContent=count;cc.style.display=count>0?'flex':'none';}
  const ci=document.getElementById('cart-items');
  if(ci)ci.innerHTML=items.length?items.map(i=>'<div class="flex items-center justify-between py-3 border-b border-yellow-900/10"><div class="flex items-center gap-2"><span class="text-xl">'+i.emoji+'</span><div><div class="text-sm">'+i.name+'</div>'+(i.price>0?'<div class="text-xs gold">'+Number(i.price).toLocaleString()+' XAF</div>':'')+'</div></div><div class="flex items-center gap-2"><button onclick="changeQty(\''+i.id+'\',-1)" class="w-7 h-7 rounded-full border border-yellow-900/30 text-gray-400 flex items-center justify-center">−</button><span class="text-sm w-5 text-center">'+i.qty+'</span><button onclick="changeQty(\''+i.id+'\',1)" class="w-7 h-7 rounded-full btn-gold flex items-center justify-center">+</button></div></div>').join(''):'<p class="text-center text-gray-500 text-sm py-8">Votre panier est vide</p>';
  const ct=document.getElementById('cart-total');
  if(ct)ct.textContent=Number(total).toLocaleString()+' XAF';
}

function changeQty(id,delta){
  if(cart[id]){cart[id].qty+=delta;if(cart[id].qty<=0)delete cart[id];}
  renderCart();
}

function toggleCart(){document.getElementById('cart-drawer').classList.toggle('hidden');}

async function submitOrder(){
  const items=Object.values(cart).filter(i=>i.qty>0);
  if(!items.length){toast('Panier vide',false);return;}
  const note=document.getElementById('order-note').value;
  const r=await fetch('/room/'+TID+'/'+ROOM+'/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items.map(i=>({name:i.name,qty:i.qty,price:i.price})),note})});
  const d=await r.json();
  if(d.success){cart={};renderCart();toggleCart();document.getElementById('success-modal').classList.remove('hidden');updateBill();}
  else{toast('❌ Erreur lors de l\\'envoi',false);}
}

async function updateBill(){
  try{
    const r=await fetch('/room/'+TID+'/'+ROOM+'/bill');
    const d=await r.json();
    if(d.stay){const el=document.getElementById('bill-total');if(el)el.textContent=Number(d.stay.totalDue).toLocaleString()+' XAF';}
  }catch(e){}
}

async function requestCheckout(){
  if(!confirm('Demander votre check-out ? La réception sera notifiée.'))return;
  const r=await fetch('/room/'+TID+'/'+ROOM+'/checkout-request',{method:'POST'});
  const d=await r.json();
  if(d.success)toast('✅ Demande envoyée ! La réception vous contactera.');
  else toast('❌ Erreur',false);
}
`)}`;
}
