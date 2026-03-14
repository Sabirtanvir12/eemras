/* ══════════════════════════════════
   ADMIN — Shared JS
   ══════════════════════════════════ */

// ─── XSS PROTECTION ──────────────────────────────────────────────────────
function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── AUTH CHECK ───────────────────────────────────────────────────────────
let currentAdmin = null;
async function requireAdminAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.authenticated) { window.location.href = '/headshot/login.html'; return false; }
    currentAdmin = data.admin;
    renderAdminInfo(data.admin);
    return true;
  } catch(e) { window.location.href = '/headshot/login.html'; return false; }
}

function renderAdminInfo(admin) {
  const avatarEls = document.querySelectorAll('.admin-avatar');
  const nameEls = document.querySelectorAll('.admin-name');
  const roleEls = document.querySelectorAll('.admin-role');
  const initial = admin.name[0].toUpperCase();
  avatarEls.forEach(el => el.textContent = initial);
  nameEls.forEach(el => el.textContent = admin.name);
  roleEls.forEach(el => { el.textContent = admin.role === 'super_admin' ? 'Super Admin' : 'Admin'; });
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/headshot/login.html';
}

// ─── ADMIN API ────────────────────────────────────────────────────────────
const AdminAPI = {
  async get(url) {
    const res = await fetch('/api/headshot' + url);
    if (res.status === 401) { window.location.href = '/headshot/login.html'; throw new Error('Unauthorized'); }
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || `HTTP ${res.status}`); }
    return res.json();
  },
  async post(url, body) {
    const res = await fetch('/api/headshot' + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.status === 401) { window.location.href = '/headshot/login.html'; throw new Error('Unauthorized'); }
    return res.json();
  },
  async postForm(url, formData) {
    const res = await fetch('/api/headshot' + url, { method: 'POST', body: formData });
    if (res.status === 401) { window.location.href = '/headshot/login.html'; throw new Error('Unauthorized'); }
    return res.json();
  },
  async putForm(url, formData) {
    const res = await fetch('/api/headshot' + url, { method: 'PUT', body: formData });
    if (res.status === 401) { window.location.href = '/headshot/login.html'; throw new Error('Unauthorized'); }
    return res.json();
  },
  async del(url) {
    const res = await fetch('/api/headshot' + url, { method: 'DELETE' });
    if (res.status === 401) { window.location.href = '/headshot/login.html'; throw new Error('Unauthorized'); }
    return res.json();
  }
};

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'admin-toast';
  el.style.cssText = `
    position:fixed;bottom:1.5rem;right:1.5rem;
    background:${type === 'error' ? '#dc2626' : '#16a34a'};
    color:white;padding:0.7rem 1.25rem;border-radius:8px;
    font-size:0.85rem;font-weight:500;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
    z-index:9999;transform:translateX(10px);opacity:0;
    transition:all 0.22s;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.transform = 'translateX(0)'; el.style.opacity = '1'; });
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(10px)'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────
function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem';
    overlay.innerHTML = `
      <div style="background:white;border-radius:12px;padding:2rem;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
        <h3 style="font-size:1rem;margin-bottom:0.75rem">Confirm Action</h3>
        <p style="color:#6b7280;font-size:0.875rem;margin-bottom:1.5rem">${msg}</p>
        <div style="display:flex;gap:0.75rem;justify-content:flex-end">
          <button id="conf-cancel" style="padding:0.5rem 1.1rem;border-radius:6px;border:1px solid #e5e7eb;background:white;cursor:pointer;font-family:inherit;font-size:0.83rem">Cancel</button>
          <button id="conf-ok" style="padding:0.5rem 1.1rem;border-radius:6px;border:none;background:#dc2626;color:white;cursor:pointer;font-family:inherit;font-size:0.83rem">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#conf-cancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#conf-ok').onclick = () => { overlay.remove(); resolve(true); };
  });
}

// ─── SIDEBAR SETUP ────────────────────────────────────────────────────────
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (toggle) {
    toggle.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('open'); });
    overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); });
  }
  // Active link
  const path = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

// ─── PRICE DISPLAY ────────────────────────────────────────────────────────
function fmtPrice(price, discount) {
  if (discount && discount < price) return `<del style="color:#9ca3af;font-size:0.85em">৳${price}</del> <strong style="color:#c4714a">৳${discount}</strong>`;
  return `৳${price}`;
}

// ─── UPLOAD ZONE ──────────────────────────────────────────────────────────
function initUploadZone(zoneId, inputId, previewId, { multiple = false } = {}) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const dt = e.dataTransfer;
    handleFiles(dt.files);
  });
  input.addEventListener('change', () => handleFiles(input.files));

  function handleFiles(files) {
    if (!multiple) { preview.innerHTML = ''; }
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const div = document.createElement('div');
        div.className = 'preview-img';
        div.innerHTML = `<img src="${e.target.result}" alt=""><button class="preview-remove" type="button">✕</button>`;
        div.querySelector('.preview-remove').onclick = () => div.remove();
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }
}

// ─── PAGINATION ───────────────────────────────────────────────────────────
function renderPagination(containerId, pagination, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  if (pagination.pages <= 1) return;
  const { page, pages } = pagination;

  function mkBtn(label, pg, disabled, active) {
    const b = document.createElement('button');
    b.className = 'pg-btn' + (active ? ' active' : '');
    b.textContent = label; b.disabled = disabled;
    if (!disabled && !active) b.onclick = () => onPageChange(pg);
    return b;
  }
  el.appendChild(mkBtn('‹', page-1, page<=1));
  for (let p = 1; p <= pages; p++) {
    if (pages > 7 && p > 2 && p < pages - 1 && Math.abs(p - page) > 1) {
      if (p === 3 || p === pages-2) { const s = document.createElement('span'); s.className='pg-btn';s.textContent='…';s.style.cursor='default'; el.appendChild(s); }
      continue;
    }
    el.appendChild(mkBtn(p, p, false, p===page));
  }
  el.appendChild(mkBtn('›', page+1, page>=pages));
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  requireAdminAuth();
});
