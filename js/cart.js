const CART_KEY = 'eagle_cart';
const WA_NUMBER = '201006264999';

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  renderCartDrawer();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  showCartNotification(product.name);
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

function updateCartCount() {
  const count = getCart().reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function renderCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  if (!drawer) return;
  const cart = getCart();
  const list = drawer.querySelector('.cart-items');
  const total = drawer.querySelector('.cart-total-val');
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = '<p class="cart-empty">السلة فارغة</p>';
    if (total) total.textContent = '0 جنيه';
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.img || ''}" alt="${item.name}" onerror="this.style.display='none'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price || ''}</div>
        <div class="cart-item-qty">الكمية: ${item.qty || 1}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div>
  `).join('');

  const totalNum = cart.reduce((s, i) => {
    const raw = String(i.price || '').replace(/[^0-9.]/g, '');
    const p = parseFloat(raw) || 0;
    return s + p * (i.qty || 1);
  }, 0);
  if (total) total.textContent = totalNum > 0 ? totalNum.toLocaleString() + ' جنيه' : '-';
}

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function sendCartViaWhatsApp() {
  const cart = getCart();
  if (cart.length === 0) {
    alert('السلة فارغة!');
    return;
  }
  const lines = cart.map(i => `- ${i.name} (الكمية: ${i.qty || 1})`);
  const msg = `مرحباً إيجل ميديكال، أريد الاستفسار عن المنتجات التالية:\n${lines.join('\n')}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function showCartNotification(name) {
  const n = document.createElement('div');
  n.className = 'cart-notification';
  n.textContent = `✓ تمت إضافة "${name}" للسلة`;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 10);
  setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 2500);
}

function buildCartHTML() {
  return `
    <div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
    <div class="cart-drawer" id="cartDrawer">
      <div class="cart-header">
        <h3>سلة المشتريات</h3>
        <button class="cart-close" onclick="closeCart()">✕</button>
      </div>
      <div class="cart-items"></div>
      <div class="cart-footer">
        <div class="cart-total">الإجمالي: <span class="cart-total-val">0 جنيه</span></div>
        <button class="btn btn-maroon" style="width:100%;justify-content:center" onclick="sendCartViaWhatsApp()">
          <i class="fa-brands fa-whatsapp"></i> إرسال الطلب عبر واتساب
        </button>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('beforeend', buildCartHTML());
  updateCartCount();
  renderCartDrawer();
});
