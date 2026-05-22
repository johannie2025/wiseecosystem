// ============================================================
// src/domains/hotel/views.js — Générateurs de vues HTML
// Design: Luxury Dark Hotel — Or, Noir Profond, Crème
// ============================================================

const HEAD = (title, extra = '') => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Wise Design Smart Ecosystem</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --dark: #0a0a0f;
    --dark-2: #12121a;
    --dark-3: #1c1c28;
    --cream: #f5efe6;
    --muted: #6b6b7a;
  }
  * { box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; background: var(--dark); color: var(--cream); margin: 0; }
  .font-display { font-family: 'Cormorant Garamond', serif; }
  .gold { color: var(--gold); }
  .bg-gold { background: var(--gold); }
  .border-gold { border-color: var(--gold); }
  .btn-gold {
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: #0a0a0f;
    font-weight: 600;
    letter-spacing: 0.05em;
    transition: all 0.3s;
    border: none;
    cursor: pointer;
  }
  .btn-gold:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(201,168,76,0.3); }
  .btn-outline {
    border: 1px solid var(--gold);
    color: var(--gold);
    background: transparent;
    transition: all 0.3s;
    cursor: pointer;
  }
  .btn-outline:hover { background: var(--gold); color: var(--dark); }
  .card { background: var(--dark-2); border: 1px solid rgba(201,168,76,0.15); }
  .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .status-connected { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
  .status-qr_ready { background: var(--gold); box-shadow: 0 0 8px var(--gold); animation: pulse 1.5s infinite; }
  .status-disconnected, .status-not_initialized, .status-error { background: #ef4444; }
  .status-initializing { background: #60a5fa; animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .order-card { border-left: 3px solid var(--gold); transition: all 0.3s; }
  .order-card:hover { border-left-color: var(--gold-light); background: var(--dark-3); }
  .badge-pending { background: rgba(251,191,36,0.2); color: #fbbf24; }
  .badge-confirmed { background: rgba(34,197,94,0.2); color: #22c55e; }
  .badge-delivered { background: rgba(99,102,241,0.2); color: #818cf8; }
  .badge-cancelled { background: rgba(239,68,68,0.2); color: #ef4444; }
  .scrollbar-thin::-webkit-scrollbar { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: var(--dark); }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }
  ${extra}
</style>
</head>`;

// ── SuperAdmin View ────────────────────────────────────────────────────────
export function renderSuperAdmin(tenants) {
  const secret = process.env.SUPERADMIN_SECRET || 'WiseDesign2025!';
  const tenantsHtml = tenants.map(t => `
    <div class="card rounded-xl p-5 order-card">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-display" 
               style="background:${t.primaryColor};color:#f5efe6">${t.logoText}</div>
          <div>
            <div class="font-display text-lg gold">${t.name}</div>
            <div class="text-xs text-gray-500">${t.address}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500 mb-1">${t.tenantId}</div>
          <div class="flex gap-2">
            <a href="/dashboard/${t.tenantId}" 
               class="btn-outline text-xs px-3 py-1 rounded-lg">Dashboard</a>
            <a href="/room/${t.tenantId}/101" 
               class="btn-gold text-xs px-3 py-1 rounded-lg">Chambre 101</a>
          </div>
        </div>
      </div>
      <div class="text-xs text-gray-500">👤 Staff WA: ${t.staffPhone || 'Non défini'}</div>
    </div>
  `).join('');

  return `${HEAD('SuperAdmin')}
<body class="min-h-screen p-6">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-10">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-3 h-3 rounded-full bg-gold"></div>
        <span class="text-xs text-gray-500 tracking-widest uppercase">Wise Design Smart Ecosystem</span>
      </div>
      <h1 class="font-display text-5xl gold font-light">SuperAdmin</h1>
      <p class="text-gray-500 mt-1">Gestion centralisée des tenants hôteliers</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="card rounded-xl p-4 text-center">
        <div class="font-display text-4xl gold">${tenants.length}</div>
        <div class="text-xs text-gray-500 mt-1">Tenants Actifs</div>
      </div>
      <div class="card rounded-xl p-4 text-center">
        <div class="font-display text-4xl text-blue-400">${tenants.length}</div>
        <div class="text-xs text-gray-500 mt-1">Sessions WhatsApp</div>
      </div>
      <div class="card rounded-xl p-4 text-center">
        <div class="font-display text-4xl text-green-400">1</div>
        <div class="text-xs text-gray-500 mt-1">Module Actif (Hôtel)</div>
      </div>
    </div>

    <!-- Formulaire création tenant -->
    <div class="card rounded-xl p-6 mb-8">
      <h2 class="font-display text-2xl gold mb-5">Créer un Nouveau Tenant</h2>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="text-xs text-gray-400 mb-1 block">Nom de l'Hôtel *</label>
          <input id="t-name" type="text" placeholder="Hôtel Continental" 
            class="w-full bg-transparent border border-gray-700 focus:border-yellow-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" style="color:var(--cream)">
        </div>
        <div>
          <label class="text-xs text-gray-400 mb-1 block">Adresse</label>
          <input id="t-addr" type="text" placeholder="Avenue de l'Indépendance, Bata" 
            class="w-full bg-transparent border border-gray-700 focus:border-yellow-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" style="color:var(--cream)">
        </div>
        <div>
          <label class="text-xs text-gray-400 mb-1 block">Téléphone Staff WhatsApp</label>
          <input id="t-phone" type="text" placeholder="240XXXXXXXXX (sans +)" 
            class="w-full bg-transparent border border-gray-700 focus:border-yellow-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" style="color:var(--cream)">
        </div>
        <div>
          <label class="text-xs text-gray-400 mb-1 block">Couleur Principale</label>
          <div class="flex gap-2">
            <input id="t-color" type="color" value="#0f3460" class="w-12 h-10 rounded cursor-pointer bg-transparent border border-gray-700">
            <span class="text-xs text-gray-500 self-center">Couleur de marque</span>
          </div>
        </div>
      </div>
      <button onclick="createTenant()" class="btn-gold px-8 py-2.5 rounded-xl text-sm">
        + Créer le Tenant Hôtel
      </button>
      <div id="create-result" class="mt-3 text-sm"></div>
    </div>

    <!-- Liste tenants -->
    <h2 class="font-display text-2xl gold mb-4">Tenants Enregistrés (${tenants.length})</h2>
    <div class="space-y-3">${tenantsHtml}</div>

    <!-- Modules futurs -->
    <div class="mt-10 card rounded-xl p-6 opacity-50">
      <h2 class="font-display text-xl gold mb-3">🔮 Modules à Venir</h2>
      <div class="grid grid-cols-3 gap-3 text-center text-sm text-gray-500">
        <div class="border border-gray-700 rounded-lg p-3">🎟️ Billetterie</div>
        <div class="border border-gray-700 rounded-lg p-3">🚌 Transport</div>
        <div class="border border-gray-700 rounded-lg p-3">📅 Réservations</div>
      </div>
    </div>
  </div>

  <script>
  async function createTenant() {
    const name = document.getElementById('t-name').value.trim();
    const address = document.getElementById('t-addr').value.trim();
    const staffPhone = document.getElementById('t-phone').value.trim();
    const primaryColor = document.getElementById('t-color').value;
    const res = document.getElementById('create-result');

    if (!name) { res.innerHTML = '<span style="color:#ef4444">⚠ Nom requis</span>'; return; }
    res.innerHTML = '<span style="color:#60a5fa">Création en cours...</span>';

    const r = await fetch('/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': '${secret}' },
      body: JSON.stringify({ name, address, staffPhone, primaryColor })
    });
    const data = await r.json();
    if (data.success) {
      res.innerHTML = '<span style="color:#22c55e">✓ Tenant créé! ID: ' + data.tenant.tenantId + '</span>';
      setTimeout(() => location.reload(), 1500);
    } else {
      res.innerHTML = '<span style="color:#ef4444">Erreur: ' + data.error + '</span>';
    }
  }
  </script>
</body></html>`;
}

// ── Dashboard Hôtel ────────────────────────────────────────────────────────
export function renderDashboard(tenant, sessionStatus, orders) {
  const statusLabel = {
    'connected': '✓ Connecté',
    'qr_ready': '⟳ QR Prêt — Scanner maintenant',
    'disconnected': '✗ Déconnecté',
    'initializing': '⟳ Initialisation...',
    'not_initialized': '○ Non initialisé',
    'error': '✗ Erreur',
  }[sessionStatus.status] || sessionStatus.status;

  const ordersHtml = orders.slice(0, 50).map(o => {
    const itemsList = o.items.map(i => `${i.name} ×${i.qty}`).join(', ');
    const timeStr = new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `
    <div class="card order-card rounded-xl p-4 mb-3" id="order-${o.orderId}">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs text-gray-400">#${o.orderId.slice(-6).toUpperCase()}</span>
          <span class="font-semibold">Chambre <span class="gold">${o.roomNumber}</span></span>
          <span class="badge-${o.status} text-xs px-2 py-0.5 rounded-full" id="badge-${o.orderId}">${o.status}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">${timeStr}</span>
          <select onchange="updateStatus('${o.orderId}', this.value)" 
            class="text-xs bg-transparent border border-gray-700 rounded px-2 py-1 outline-none" style="color:var(--cream)">
            <option value="pending" ${o.status==='pending'?'selected':''}>En attente</option>
            <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmé</option>
            <option value="delivered" ${o.status==='delivered'?'selected':''}>Livré</option>
            <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Annulé</option>
          </select>
        </div>
      </div>
      <div class="text-sm text-gray-300">${itemsList}</div>
      ${o.total > 0 ? `<div class="text-xs gold mt-1">${o.total.toLocaleString()} XAF</div>` : ''}
      ${o.note ? `<div class="text-xs text-gray-500 mt-1 italic">📝 ${o.note}</div>` : ''}
    </div>`;
  }).join('') || '<div class="text-center text-gray-600 py-10">Aucune commande pour le moment</div>';

  const qrSection = sessionStatus.status === 'qr_ready' && sessionStatus.qrDataUrl
    ? `<div class="mt-4 flex flex-col items-center">
        <p class="text-xs text-gray-400 mb-3">Ouvrez WhatsApp → Appareils liés → Scanner ce QR</p>
        <div class="p-3 bg-white rounded-2xl inline-block shadow-2xl shadow-yellow-900/20">
          <img src="${sessionStatus.qrDataUrl}" alt="QR WhatsApp" class="w-52 h-52">
        </div>
      </div>` : '';

  return `${HEAD(`Dashboard — ${tenant.name}`)}
<body class="min-h-screen">
  <!-- Navbar -->
  <nav class="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-display" 
           style="background:${tenant.primaryColor};color:#f5efe6">${tenant.logoText}</div>
      <div>
        <div class="font-display text-xl gold">${tenant.name}</div>
        <div class="text-xs text-gray-500">Tableau de bord Conciergerie</div>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <div id="live-indicator" class="flex items-center gap-2 text-xs text-gray-400">
        <div class="status-dot status-dot-live bg-green-500" style="box-shadow:0 0 6px #22c55e;animation:pulse 2s infinite"></div>
        Live
      </div>
      <a href="/admin?secret=${process.env.SUPERADMIN_SECRET}" 
         class="text-xs text-gray-500 hover:text-yellow-400 transition-colors">↑ SuperAdmin</a>
    </div>
  </nav>

  <div class="flex h-[calc(100vh-65px)]">
    <!-- Sidebar WhatsApp -->
    <aside class="w-80 border-r border-gray-800 p-5 flex flex-col">
      <h2 class="font-display text-xl gold mb-4">Connexion WhatsApp</h2>

      <!-- Statut -->
      <div class="card rounded-xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="status-dot status-${sessionStatus.status}" id="status-dot"></span>
          <span class="text-sm font-medium" id="status-label">${statusLabel}</span>
        </div>
        ${sessionStatus.phone ? `<div class="text-xs text-gray-500">📱 ${sessionStatus.phone}</div>` : ''}
      </div>

      <!-- QR Code -->
      <div id="qr-container">${qrSection}</div>

      <!-- Boutons -->
      <div class="flex gap-2 mt-4">
        <button onclick="connectWA()" id="btn-connect"
          class="btn-gold flex-1 px-4 py-2 rounded-xl text-sm">
          ${sessionStatus.status === 'connected' ? 'Relancer' : 'Connecter WA'}
        </button>
        <button onclick="disconnectWA()" 
          class="btn-outline flex-1 px-4 py-2 rounded-xl text-sm">
          Déconnecter
        </button>
      </div>

      <!-- Test Chambre -->
      <div class="mt-auto pt-5 border-t border-gray-800">
        <div class="text-xs text-gray-500 mb-2">Simuler une chambre client :</div>
        <div class="flex gap-2">
          <input id="room-nb" type="text" value="101" 
            class="flex-1 bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" style="color:var(--cream)">
          <button onclick="openRoom()" class="btn-outline px-3 py-2 rounded-lg text-sm">→</button>
        </div>
      </div>
    </aside>

    <!-- Main: Commandes -->
    <main class="flex-1 overflow-hidden flex flex-col">
      <div class="p-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 class="font-display text-2xl gold">Commandes en Temps Réel</h2>
          <div class="text-xs text-gray-500 mt-0.5" id="order-count">${orders.length} commande(s) enregistrée(s)</div>
        </div>
        <div class="text-xs text-gray-500">Mis à jour automatiquement via WebSocket</div>
      </div>
      <div class="flex-1 overflow-y-auto scrollbar-thin p-5" id="orders-container">
        ${ordersHtml}
      </div>
    </main>

    <!-- Sidebar Messages WhatsApp -->
    <aside class="w-72 border-l border-gray-800 p-5">
      <h2 class="font-display text-xl gold mb-4">Messages WA Reçus</h2>
      <div id="messages-container" class="space-y-3 overflow-y-auto scrollbar-thin max-h-[calc(100vh-150px)]">
        <div class="text-xs text-gray-600 text-center">En attente de messages...</div>
      </div>
    </aside>
  </div>

  <script>
  const tenantId = '${tenant.tenantId}';
  const socket = io();

  socket.emit('join_dashboard', tenantId);

  // ── Mise à jour du statut WhatsApp ────────────────────────────────────
  socket.on('session_status', ({ status, qrDataUrl, phone }) => {
    const labels = {
      'connected': '✓ Connecté',
      'qr_ready': '⟳ QR Prêt — Scanner maintenant',
      'disconnected': '✗ Déconnecté',
      'initializing': '⟳ Initialisation...',
      'error': '✗ Erreur',
    };
    document.getElementById('status-dot').className = 'status-dot status-' + status;
    document.getElementById('status-label').textContent = labels[status] || status;

    const qrEl = document.getElementById('qr-container');
    if (status === 'qr_ready' && qrDataUrl) {
      qrEl.innerHTML = \`
        <div class="mt-4 flex flex-col items-center">
          <p class="text-xs text-gray-400 mb-3">Ouvrez WhatsApp → Appareils liés → Scanner ce QR</p>
          <div class="p-3 bg-white rounded-2xl inline-block">
            <img src="\${qrDataUrl}" alt="QR" class="w-52 h-52">
          </div>
        </div>\`;
    } else if (status === 'connected') {
      qrEl.innerHTML = \`<div class="mt-4 text-center">
        <div class="text-4xl mb-2">✅</div>
        <div class="text-sm text-green-400">WhatsApp opérationnel</div>
        \${phone ? \`<div class="text-xs text-gray-500 mt-1">📱 \${phone}</div>\` : ''}
      </div>\`;
    } else {
      qrEl.innerHTML = '';
    }
  });

  // ── Nouvelle commande reçue ────────────────────────────────────────────
  socket.on('new_order', (order) => {
    const container = document.getElementById('orders-container');
    const itemsList = order.items.map(i => i.name + ' ×' + i.qty).join(', ');
    const timeStr = new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const html = \`
    <div class="card order-card rounded-xl p-4 mb-3 border-l-yellow-400" id="order-\${order.orderId}" 
         style="border-left-color:#e8c97a;animation:fadeIn 0.5s">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs text-gray-400">#\${order.orderId.slice(-6).toUpperCase()}</span>
          <span>Chambre <span style="color:var(--gold)">\${order.roomNumber}</span></span>
          <span class="badge-pending text-xs px-2 py-0.5 rounded-full" id="badge-\${order.orderId}">pending</span>
        </div>
        <span class="text-xs text-gray-500">\${timeStr}</span>
      </div>
      <div class="text-sm text-gray-300">\${itemsList}</div>
      \${order.total > 0 ? \`<div class="text-xs mt-1" style="color:var(--gold)">\${order.total.toLocaleString()} XAF</div>\` : ''}
    </div>\`;
    container.insertAdjacentHTML('afterbegin', html);

    // Son de notification
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    osc.connect(audio.destination);
    osc.frequency.value = 880;
    osc.start();
    setTimeout(() => osc.stop(), 150);
  });

  // ── Mise à jour statut commande ───────────────────────────────────────
  socket.on('order_updated', (order) => {
    const badge = document.getElementById('badge-' + order.orderId);
    if (badge) { badge.textContent = order.status; badge.className = 'badge-' + order.status + ' text-xs px-2 py-0.5 rounded-full'; }
  });

  // ── Nouveau message WA reçu ───────────────────────────────────────────
  socket.on('new_message', ({ from, text, timestamp }) => {
    const container = document.getElementById('messages-container');
    const time = new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const phone = from.split('@')[0];
    container.insertAdjacentHTML('afterbegin', \`
      <div class="card rounded-xl p-3 text-sm" style="border:1px solid rgba(201,168,76,0.2)">
        <div class="flex justify-between mb-1">
          <span class="text-xs" style="color:var(--gold)">+\${phone}</span>
          <span class="text-xs text-gray-600">\${time}</span>
        </div>
        <div class="text-gray-300">\${text}</div>
      </div>\`);
  });

  async function connectWA() {
    document.getElementById('status-label').textContent = '⟳ Connexion en cours...';
    await fetch('/dashboard/' + tenantId + '/connect', { method: 'POST' });
  }

  async function disconnectWA() {
    await fetch('/dashboard/' + tenantId + '/disconnect', { method: 'POST' });
  }

  async function updateStatus(orderId, status) {
    await fetch('/orders/' + orderId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  }

  function openRoom() {
    const room = document.getElementById('room-nb').value.trim() || '101';
    window.open('/room/${tenant.tenantId}/' + room, '_blank');
  }
  </script>
  <style>@keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }</style>
</body></html>`;
}

// ── Vue Client — Interface Chambre ─────────────────────────────────────────
export function renderRoom(tenant, roomNumber, menu) {
  const categories = [...new Set(menu.map(i => i.category))];

  const categoriesHtml = categories.map(cat => {
    const items = menu.filter(i => i.category === cat);
    const itemsHtml = items.map(item => `
      <div class="menu-item card rounded-2xl p-4 cursor-pointer transition-all duration-200 select-none"
           onclick="toggleItem('${item.id}', '${item.name}', ${item.price})"
           id="item-${item.id}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${item.emoji}</span>
            <div>
              <div class="font-medium text-sm">${item.name}</div>
              <div class="text-xs text-gray-500">
                ${item.price > 0 ? `${item.price.toLocaleString()} XAF` : 'Gratuit'}
              </div>
            </div>
          </div>
          <div class="qty-control hidden items-center gap-2" id="ctrl-${item.id}">
            <button onclick="event.stopPropagation();changeQty('${item.id}', -1)" 
              class="w-7 h-7 rounded-full border border-gray-600 flex items-center justify-center text-gray-300 hover:border-yellow-500 text-lg leading-none">−</button>
            <span class="text-sm font-bold w-5 text-center" id="qty-${item.id}">1</span>
            <button onclick="event.stopPropagation();changeQty('${item.id}', 1)" 
              class="w-7 h-7 rounded-full border border-gray-600 flex items-center justify-center text-gray-300 hover:border-yellow-500 text-lg leading-none">+</button>
          </div>
          <div class="check-icon hidden text-green-400 text-lg" id="check-${item.id}">✓</div>
        </div>
      </div>`).join('');
    return `
      <div class="mb-5">
        <h3 class="text-xs tracking-widest uppercase text-gray-500 mb-3 px-1">${cat}</h3>
        <div class="space-y-2">${itemsHtml}</div>
      </div>`;
  }).join('');

  return `${HEAD(`Chambre ${roomNumber}`, `
    body { background: var(--dark); }
    .menu-item:hover { border-color: rgba(201,168,76,0.3); }
    .menu-item.selected { border-color: var(--gold) !important; background: rgba(201,168,76,0.08); }
    .qty-control { display: flex; }
    .hidden { display: none; }
    .sticky-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: linear-gradient(to top, var(--dark) 80%, transparent);
      padding: 20px 20px 30px;
    }
  `)}
<body class="min-h-screen pb-36">

  <!-- Header chambre -->
  <div class="sticky top-0 z-10 px-5 pt-6 pb-4" style="background:var(--dark)">
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" 
             style="background:${tenant.primaryColor};color:#f5efe6">${tenant.logoText}</div>
        <div>
          <div class="font-display text-base gold">${tenant.name}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs text-gray-500">Votre chambre</div>
        <div class="font-display text-2xl gold">${roomNumber}</div>
      </div>
    </div>
    <div class="h-px bg-gray-800 mt-3"></div>
  </div>

  <!-- Menu -->
  <div class="px-5 pt-3">
    <h2 class="font-display text-3xl gold font-light mb-1">Room Service</h2>
    <p class="text-xs text-gray-500 mb-6">Sélectionnez vos articles, nous vous les apportons.</p>
    ${categoriesHtml}
  </div>

  <!-- Sticky: numéro + bouton commander -->
  <div class="sticky-bar">
    <div class="max-w-md mx-auto">
      <div id="summary-bar" class="mb-3 hidden">
        <div class="text-xs text-gray-400 mb-1">Votre sélection:</div>
        <div id="summary-text" class="text-sm gold"></div>
      </div>
      <div class="mb-3">
        <label class="text-xs text-gray-500 mb-1 block">Votre WhatsApp (pour confirmation) — optionnel</label>
        <input id="client-phone" type="tel" placeholder="240XXXXXXXXX"
          class="w-full bg-transparent border border-gray-700 focus:border-yellow-600 rounded-xl px-4 py-2.5 text-sm outline-none" style="color:var(--cream)">
      </div>
      <div class="mb-2">
        <input id="order-note" type="text" placeholder="Note spéciale... (ex: sans sucre)"
          class="w-full bg-transparent border border-gray-700 focus:border-yellow-600 rounded-xl px-4 py-2.5 text-sm outline-none" style="color:var(--cream)">
      </div>
      <button onclick="submitOrder()" id="btn-order"
        class="btn-gold w-full py-4 rounded-2xl text-base font-semibold tracking-wide">
        Commander — <span id="btn-total">0 article(s)</span>
      </button>
      <div id="order-result" class="mt-3 text-center text-sm"></div>
    </div>
  </div>

  <script>
  const cart = {};
  const prices = {};
  const tenantId = '${tenant.tenantId}';
  const roomNumber = '${roomNumber}';

  function toggleItem(id, name, price) {
    if (cart[id]) {
      delete cart[id];
      delete prices[id];
      document.getElementById('item-' + id).classList.remove('selected');
      document.getElementById('ctrl-' + id).classList.add('hidden');
      document.getElementById('check-' + id).classList.add('hidden');
    } else {
      cart[id] = { id, name, qty: 1, price };
      prices[id] = price;
      document.getElementById('item-' + id).classList.add('selected');
      document.getElementById('ctrl-' + id).classList.remove('hidden');
      document.getElementById('check-' + id).classList.remove('hidden');
    }
    updateSummary();
  }

  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty = Math.max(1, cart[id].qty + delta);
    document.getElementById('qty-' + id).textContent = cart[id].qty;
    updateSummary();
  }

  function updateSummary() {
    const items = Object.values(cart);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    
    document.getElementById('btn-total').textContent = 
      count + ' article(s)' + (total > 0 ? ' — ' + total.toLocaleString() + ' XAF' : '');

    const sb = document.getElementById('summary-bar');
    if (items.length) {
      sb.classList.remove('hidden');
      document.getElementById('summary-text').textContent = items.map(i => i.name + ' ×' + i.qty).join(' · ');
    } else {
      sb.classList.add('hidden');
    }
  }

  async function submitOrder() {
    const items = Object.values(cart);
    if (!items.length) {
      document.getElementById('order-result').innerHTML = '<span style="color:#ef4444">⚠ Sélectionnez au moins un article</span>';
      return;
    }

    const btn = document.getElementById('btn-order');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours...';
    document.getElementById('order-result').innerHTML = '';

    const clientPhone = document.getElementById('client-phone').value.trim();
    const note = document.getElementById('order-note').value.trim();

    try {
      const r = await fetch('/room/' + tenantId + '/' + roomNumber + '/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, clientPhone, note })
      });
      const data = await r.json();

      if (data.success) {
        document.getElementById('order-result').innerHTML = 
          '<span style="color:#22c55e">✅ ' + data.message + '</span>';
        btn.textContent = '✓ Commande envoyée!';
        btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
        
        // Reset cart après 3s
        setTimeout(() => {
          Object.keys(cart).forEach(id => {
            delete cart[id];
            const el = document.getElementById('item-' + id);
            if (el) el.classList.remove('selected');
            const ctrl = document.getElementById('ctrl-' + id);
            if (ctrl) ctrl.classList.add('hidden');
            const check = document.getElementById('check-' + id);
            if (check) check.classList.add('hidden');
          });
          updateSummary();
          btn.disabled = false;
          btn.textContent = 'Commander — 0 article(s)';
          btn.style.background = '';
          document.getElementById('order-result').innerHTML = '';
        }, 3000);
      } else {
        document.getElementById('order-result').innerHTML = '<span style="color:#ef4444">Erreur: ' + (data.error || 'Inconnue') + '</span>';
        btn.disabled = false;
        btn.textContent = 'Commander — Réessayer';
      }
    } catch(e) {
      document.getElementById('order-result').innerHTML = '<span style="color:#ef4444">Erreur réseau</span>';
      btn.disabled = false;
      btn.textContent = 'Commander';
    }
  }
  </script>
</body></html>`;
}
