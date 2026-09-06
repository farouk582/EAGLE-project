const SHEET_URL = 'https://script.google.com/macros/s/AKfycbypsXLzEYO3YbnTKMEtv44FVf8od-zAonHjpwcLhNZ96QCTNKc9m8MPvPdzquxB8kM/exec';
const CACHE_KEY = 'eagle_sheet_data';
const CACHE_TTL = 30 * 60 * 1000;

const COLS = {
  mainCat: 'القسم الرئيسي',
  subCat:  'قسم فرعي ',
  name:    'اسم الجهاز ',
  desc:    'الوصف\n(المميزات و المحتويات )',
  warranty:'الضمان ',
  priceBefore: 'السعر قبل الخصم',
  price:   'السعر',
  img1:    'الصور1',
  img2:    'الصور2'
};

function getParam(key) {
  return decodeURIComponent(new URLSearchParams(window.location.search).get(key) || '');
}

function generateId(item, index) {
  return encodeURIComponent(item[COLS.name] || index);
}

async function fetchData() {
  if (!SHEET_URL) return getSampleData();

  const cached = sessionStorage.getItem(CACHE_KEY);
  const cachedTime = sessionStorage.getItem(CACHE_KEY + '_time');
  if (cached && cachedTime && Date.now() - parseInt(cachedTime) < CACHE_TTL) {
    return JSON.parse(cached);
  }

  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();
    if (Array.isArray(data)) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(CACHE_KEY + '_time', Date.now().toString());
      return data;
    }
    return [];
  } catch (e) {
    console.error('Sheet fetch error:', e);
    if (cached) return JSON.parse(cached);
    return getSampleData();
  }
}

function getSampleData() {
  const cat = getParam('cat') || 'أجهزة ضغط الدم';
  return [
    {
      'القسم الرئيسي': cat,
      'قسم فرعي': 'ذراع',
      'اسم الجهاز': 'جهاز ضغط ذراع رقمي',
      'الوصف': 'جهاز دقيق لقياس ضغط الدم بتقنية رقمية متطورة مناسب للاستخدام المنزلي.',
      'الضمان': 'سنتين',
      'السعر قبل الخصم': '850',
      'السعر': '650',
      'الصور1': '',
      'الصور2': ''
    },
    {
      'القسم الرئيسي': cat,
      'قسم فرعي': 'معصم',
      'اسم الجهاز': 'جهاز ضغط معصم أوتوماتيك',
      'الوصف': 'جهاز ضغط معصم بضغط واحد من الزر مع ذاكرة لحفظ القراءات.',
      'الضمان': 'سنة',
      'السعر قبل الخصم': '-',
      'السعر': '450',
      'الصور1': '',
      'الصور2': ''
    }
  ];
}

function groupBySubCat(items) {
  const groups = {};
  items.forEach(item => {
    const sub = item[COLS.subCat] || 'عام';
    if (!groups[sub]) groups[sub] = [];
    groups[sub].push(item);
  });
  return groups;
}

function isEmptyValue(v) {
  if (!v) return true;
  const t = String(v).trim();
  return t === '' || t === '-' || t === '--';
}

function buildProductCard(item, index) {
  const id = generateId(item, index);
  const name = item[COLS.name] || '';
  const desc = isEmptyValue(item[COLS.desc]) ? '' : item[COLS.desc];
  const warranty = item[COLS.warranty] || '';
  const priceBefore = item[COLS.priceBefore] || '';
  const price = item[COLS.price] || '';
  const img1raw = item[COLS.img1] || '';
  const img1 = isEmptyValue(img1raw) ? '' : img1raw;

  const descWords = desc.split(' ').filter(Boolean);
  const descShort = descWords.slice(0, 10).join(' ');
  const descRest = descWords.slice(10).join(' ');
  const hasMore = descWords.length > 10;

  const priceBeforeHTML = !isEmptyValue(priceBefore)
    ? `<span class="price-before">${priceBefore} جنيه</span>`
    : '';

  const priceHTML = !isEmptyValue(price)
    ? `<span class="price-current">${price} جنيه</span>`
    : `<span class="price-current">جاري التحديث</span>`;

  const warrantyHTML = !isEmptyValue(warranty)
    ? `<div class="product-warranty"><i class="fa-solid fa-shield-halved"></i> ضمان: ${warranty}</div>`
    : '';

  const productData = encodeURIComponent(JSON.stringify({
    id, name,
    desc: item[COLS.desc],
    warranty,
    priceBefore: item[COLS.priceBefore],
    price,
    img1: item[COLS.img1],
    img2: item[COLS.img2],
    mainCat: item[COLS.mainCat],
    subCat: item[COLS.subCat]
  }));

  return `
    <div class="product-card" onclick="goToProduct('${productData}')">
      <div class="product-img">
        ${img1 ? `<img src="${img1}" alt="${name}" onerror="this.parentElement.style.background='var(--bg-soft)'">` : ''}
      </div>
      <div class="product-body">
        <div class="product-name">${name}</div>
        <p class="product-desc">
          ${descShort}${hasMore ? `<span class="product-desc-more"> ${descRest}</span>` : ''}
        </p>
        ${hasMore ? `<button class="product-desc-toggle" onclick="toggleDesc(event, this)">اقرأ المزيد</button>` : ''}
        ${warrantyHTML}
        <div class="product-price">
          ${priceBeforeHTML}
          ${priceHTML}
        </div>
        <div class="product-actions">
          <button class="btn btn-maroon" onclick="addProductToCart(event, '${productData}')">
            <i class="fa-solid fa-cart-plus"></i> إضافة للسلة
          </button>
        </div>
      </div>
    </div>
  `;
}

function buildSections(groups) {
  return Object.entries(groups).map(([subCat, items]) => `
    <div class="cat-section">
      <div class="cat-section-head">
        <h2>${subCat}</h2>
        <span class="cat-section-count">${items.length} منتج</span>
      </div>
      <div class="products-grid">
        ${items.map((item, i) => buildProductCard(item, i)).join('')}
      </div>
    </div>
  `).join('');
}

function goToProduct(encodedData) {
  sessionStorage.setItem('currentProduct', decodeURIComponent(encodedData));
  window.location.href = 'product.html';
}

function addProductToCart(e, encodedData) {
  e.stopPropagation();
  const item = JSON.parse(decodeURIComponent(encodedData));
  addToCart({ id: item.id, name: item.name, price: item.price, img: item.img1 });
}

function toggleDesc(e, btn) {
  e.stopPropagation();
  const more = btn.previousElementSibling.querySelector('.product-desc-more');
  if (!more) return;
  const open = more.style.display === 'inline';
  more.style.display = open ? 'none' : 'inline';
  btn.textContent = open ? 'اقرأ المزيد' : 'أقل';
}

async function initPage() {
  const cat = getParam('cat');
  if (!cat) {
    document.getElementById('catContent').innerHTML = `
      <div class="error-state">
        <h3>لم يتم تحديد قسم</h3>
        <p><a href="index.html">العودة للرئيسية</a></p>
      </div>`;
    return;
  }

  document.getElementById('catTitle').textContent = cat;
  document.getElementById('catHeading').textContent = cat;
  document.title = `إيجل ميديكال | ${cat}`;

  const seoDesc = `تصفح ${cat} من إيجل ميديكال - أجهزة ومستلزمات طبية معتمدة بالقاهرة مع طلب فوري عبر الواتساب.`;
  const metaDesc = document.getElementById('metaDescription');
  const ogTitle = document.getElementById('ogTitle');
  const ogDesc = document.getElementById('ogDescription');
  if (metaDesc) metaDesc.setAttribute('content', seoDesc);
  if (ogTitle) ogTitle.setAttribute('content', `إيجل ميديكال | ${cat}`);
  if (ogDesc) ogDesc.setAttribute('content', seoDesc);

  const allData = await fetchData();
  const normalize = s => (s || '').trim().replace(/\s+/g, ' ');
  const filtered = allData.filter(r => normalize(r[COLS.mainCat]) === normalize(cat));

  if (filtered.length === 0) {
    document.getElementById('catContent').innerHTML = `
      <div class="error-state">
        <h3>لا توجد منتجات في هذا القسم حالياً</h3>
        <p>سيتم إضافة منتجات قريباً</p>
      </div>`;
    return;
  }

  const groups = groupBySubCat(filtered);
  document.getElementById('catContent').innerHTML = buildSections(groups);
}

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
  }
  initPage();
});
