// This is the shared sidebar template string for admin pages
// Used by all admin pages via JS injection
const SIDEBAR_HTML = `
<div class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <span>EEM<em>RAS</em></span>
    <p>EEMRAS</p>
  </div>
  <p class="sidebar-section">Main</p>
  <nav class="sidebar-nav">
    <a href="/headshot/dashboard.html" class="sidebar-link"><span class="sidebar-icon">📊</span> Dashboard</a>
    <a href="/headshot/products.html" class="sidebar-link"><span class="sidebar-icon">🛍️</span> Products</a>
    <a href="/headshot/add-product.html" class="sidebar-link"><span class="sidebar-icon">➕</span> Add Product</a>
    <a href="/headshot/categories.html" class="sidebar-link"><span class="sidebar-icon">📂</span> Categories</a>
    <a href="/headshot/admins.html" class="sidebar-link" id="adminMgmtLink"><span class="sidebar-icon">👥</span> Admins</a>
  </nav>
  <p class="sidebar-section">Account</p>
  <nav class="sidebar-nav" style="padding-top:0">
    <a href="/headshot/settings.html" class="sidebar-link"><span class="sidebar-icon">⚙️</span> Settings</a>
    <a href="/" class="sidebar-link" target="_blank"><span class="sidebar-icon">🌐</span> View Store</a>
  </nav>
  <div class="sidebar-bottom">
    <div class="sidebar-admin-info">
      <div class="admin-avatar">A</div>
      <div class="admin-avatar-info">
        <p class="admin-name">Admin</p>
        <span class="admin-role">Admin</span>
      </div>
    </div>
    <button class="logout-btn" id="logoutBtn">
      <span>🚪</span> Sign Out
    </button>
  </div>
</div>
<div class="sidebar-overlay" id="sidebarOverlay"></div>
`;
 