/* ══════════════════════════════════
   EEMRAS — Shared JS Utilities
   ══════════════════════════════════ */

// ─── API HELPERS ─────────────────────────────────────────────────────────
const API = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// ─── WISHLIST ──────────────────────────────────────────────────────────────
const Wishlist = {
  key: 'eemras_wishlist',
  get() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; } },
  set(ids) { localStorage.setItem(this.key, JSON.stringify(ids)); },
  has(id) { return this.get().includes(String(id)); },
  toggle(id) {
    const ids = this.get();
    const sid = String(id);
    const idx = ids.indexOf(sid);
    if (idx > -1) ids.splice(idx, 1);
    else ids.push(sid);
    this.set(ids);
    return idx === -1;
  },
  count() { return this.get().length; }
};

// ─── COPY TO CLIPBOARD ────────────────────────────────────────────────────
let toastTimer;
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast(`Copied: ${text}`));
}
function showToast(msg) {
  let toast = document.getElementById('copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'copy-toast';
    toast.className = 'copy-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── PRODUCT CARD BUILDER ─────────────────────────────────────────────────
function buildProductCard(p) {
  const isWishlisted = Wishlist.has(p.id);
  const hasDiscount = p.discount_price && p.discount_price < p.price;
  const priceHTML = hasDiscount
    ? `<span class="price-original">৳${p.price.toFixed(0)}</span>
       <span class="price-current price-discounted">৳${p.discount_price.toFixed(0)}</span>`
    : `<span class="price-current">৳${p.price.toFixed(0)}</span>`;

  const imgSrc = p.main_image
    ? p.main_image
    : `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0ebe0"/><text x="100" y="110" text-anchor="middle" font-size="50" fill="#c8c4bc">📦</text></svg>')}`;

  const card = document.createElement('article');
  card.className = 'product-card fade-in';
  card.innerHTML = `
    <div class="product-img-wrap">
      <img src="${imgSrc}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src=''">
      ${p.status === 'sold_out' ? '<span class="sold-badge">Sold Out</span>' : ''}
      <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${p.id}" aria-label="Wishlist">
        ${isWishlisted ? '❤️' : '♡'}
      </button>
    </div>
    <div class="product-info">
      <div class="product-name">${escapeHtml(p.name)}</div>
      <div class="product-meta">
        <button class="product-code" data-code="${escapeHtml(p.code)}" title="Click to copy">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          ${escapeHtml(p.code)}
        </button>
        ${p.measurement ? `<span class="product-measurement">${escapeHtml(p.measurement)}</span>` : ''}
      </div>
      <div class="product-price">${priceHTML}</div>
    </div>
  `;

  // Navigate to product page
  card.querySelector('.product-img-wrap').addEventListener('click', (e) => {
    if (!e.target.closest('.wishlist-btn')) window.location.href = `/product/${p.id}`;
  });
  card.querySelector('.product-name').addEventListener('click', () => { window.location.href = `/product/${p.id}`; });
  card.querySelector('.product-img-wrap').style.cursor = 'pointer';

  // Copy code
  card.querySelector('.product-code').addEventListener('click', (e) => {
    e.stopPropagation();
    copyToClipboard(p.code);
  });

  // Wishlist
  card.querySelector('.wishlist-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const added = Wishlist.toggle(p.id);
    const btn = e.currentTarget;
    btn.textContent = added ? '❤️' : '♡';
    btn.classList.toggle('active', added);
    updateWishlistBadge();
    showToast(added ? 'Added to wishlist' : 'Removed from wishlist');
  });

  return card;
}

// ─── SKELETON CARDS ───────────────────────────────────────────────────────
function buildSkeletonCard() {
  const div = document.createElement('div');
  div.className = 'skeleton-card';
  div.innerHTML = `
    <div class="skel-img"></div>
    <div class="skel-body">
      <div class="skel-line" style="width:80%"></div>
      <div class="skel-line" style="width:50%"></div>
      <div class="skel-line" style="width:40%"></div>
    </div>
  `;
  return div;
}

function showSkeletons(container, count = 10) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) container.appendChild(buildSkeletonCard());
}

// ─── PAGINATION ───────────────────────────────────────────────────────────
function buildPagination(container, pagination, onPageChange) {
  container.innerHTML = '';
  if (pagination.pages <= 1) return;
  const { page, pages } = pagination;

  function makeBtn(label, pageNum, disabled = false, active = false) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (active ? ' active' : '');
    btn.textContent = label;
    btn.disabled = disabled;
    if (!disabled && !active) btn.onclick = () => onPageChange(pageNum);
    return btn;
  }

  container.appendChild(makeBtn('‹', page - 1, page <= 1));

  const range = pageRange(page, pages);
  range.forEach(p => {
    if (p === '...') {
      const span = document.createElement('span');
      span.className = 'page-btn'; span.textContent = '…'; span.style.cursor = 'default';
      container.appendChild(span);
    } else {
      container.appendChild(makeBtn(p, p, false, p === page));
    }
  });

  container.appendChild(makeBtn('›', page + 1, page >= pages));
}

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1,2,3,4,5,'...',total];
  if (current >= total - 3) return [1,'...',total-4,total-3,total-2,total-1,total];
  return [1,'...',current-1,current,current+1,'...',total];
}

// ─── NAVBAR SETUP ─────────────────────────────────────────────────────────
function initNavbar() {
  // Hamburger
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!e.target.closest('.navbar')) navLinks.classList.remove('open');
    });
  }

  // Wishlist badge
  updateWishlistBadge();

  // Search
  const searchInput = document.querySelector('.nav-search input');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(searchInput.value.trim())}`;
      }
    });
  }

  // Active link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path || (path.startsWith('/product') && a.href.includes('/products'))) {
      a.classList.add('active');
    }
  });
}

function updateWishlistBadge() {
  const badge = document.querySelector('.wishlist-badge');
  const count = Wishlist.count();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ─── ESCAPE HTML ──────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ─── PRICE DISPLAY ────────────────────────────────────────────────────────
function priceHTML(price, discount_price) {
  if (discount_price && discount_price < price) {
    return `<span class="price-original">৳${price.toFixed(0)}</span> <span class="price-current price-discounted">৳${discount_price.toFixed(0)}</span>`;
  }
  return `<span class="price-current">৳${price.toFixed(0)}</span>`;
}

// ─── FORMAT DATE ──────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Auto-init navbar
document.addEventListener('DOMContentLoaded', initNavbar);
