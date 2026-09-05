const SHEET_URL = 'https://script.google.com/macros/s/AKfycbypsXLzEYO3YbnTKMEtv44FVf8od-zAonHjpwcLhNZ96QCTNKc9m8MPvPdzquxB8kM/exec';

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

function isEmptyValue(v) {
  if (!v) return true;
  const t = String(v).trim();
  return t === '' || t === '-' || t === '--';
}

function initBanner(img1, img2) {
  const mainImg = document.getElementById('bannerMainImg');
  const thumb1 = document.getElementById('thumb1');
  const thumb2 = document.getElementById('thumb2');

  if (!mainImg) return;

  const validImg1 = !isEmptyValue(img1);
  const validImg2 = !isEmptyValue(img2);

  if (validImg1) {
    mainImg.src = img1;
    thumb1.querySelector('img').src = img1;
    thumb1.style.display = 'block';
  } else {
    thumb1.style.display = 'none';
  }

  if (validImg2) {
    thumb2.style.display = 'block';
    thumb2.querySelector('img').src = img2;
  } else {
    thumb2.style.display = 'none';
  }

  if (!validImg1 && !validImg2) {
    document.getElementById('bannerMain').innerHTML = '<div class="banner-placeholder"><i class="fa-solid fa-image"></i><span>الصورة غير متاحة</span></div>';
  } else if (!validImg1 && validImg2) {
    mainImg.src = img2;
  }

  [thumb1, thumb2].forEach(thumb => {
    if (thumb.style.display === 'none') return;
    thumb.addEventListener('click', () => {
      const src = thumb.querySelector('img').src;
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = src;
        mainImg.style.opacity = '1';
      }, 200);
      document.querySelectorAll('.banner-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

function renderProduct(product) {
  const name = product.name || product[COLS.name] || '';
  const desc = product.desc || product[COLS.desc] || '';
  const warranty = product.warranty || product[COLS.warranty] || '';
  const priceBefore = product.priceBefore || product[COLS.priceBefore] || '';
  const price = product.price || product[COLS.price] || '';
  const img1 = product.img1 || product[COLS.img1] || '';
  const img2 = product.img2 || product[COLS.img2] || '';
  const mainCat = product.mainCat || product[COLS.mainCat] || '';
  const subCat = product.subCat || product[COLS.subCat] || '';
  const id = product.id || name;

  document.title = `إيجل ميديكال | ${name}`;

  const priceBeforeHTML = !isEmptyValue(priceBefore)
    ? `<span class="price-before">${priceBefore} جنيه</span>`
    : '';

  const priceHTML = !isEmptyValue(price)
    ? `<span class="price-current">${price} جنيه</span>`
    : `<span class="price-current">تواصل معنا للسعر</span>`;

  const warrantyHTML = !isEmptyValue(warranty)
    ? `<div class="product-warranty-box"><i class="fa-solid fa-shield-halved"></i><span>ضمان: ${warranty}</span></div>`
    : '';

  const descHTML = !isEmptyValue(desc)
    ? `<p class="product-full-desc">${desc}</p>`
    : '';

  const catLink = mainCat
    ? `<a href="category.html?cat=${encodeURIComponent(mainCat)}">${mainCat}</a>`
    : '';

  const productData = { id, name, price, img: img1 };

  document.getElementById('productContent').innerHTML = `
    <div class="product-layout">
      <div class="product-banner">
        <div class="banner-main" id="bannerMain">
          <img id="bannerMainImg" alt="${name}" onerror="this.parentElement.style.background='var(--bg-soft)'">
        </div>
        <div class="banner-thumbs">
          <div class="banner-thumb active" id="thumb1">
            <img alt="صورة 1">
          </div>
          <div class="banner-thumb" id="thumb2" style="display:none">
            <img alt="صورة 2">
          </div>
        </div>
      </div>

      <div class="product-info">
        <div class="product-breadcrumb">
          <a href="index.html">الرئيسية</a>
          <span>»</span>
          ${catLink}
          ${subCat ? `<span>»</span><span>${subCat}</span>` : ''}
          <span>»</span>
          <span>${name}</span>
        </div>

        <h1>${name}</h1>

        ${subCat ? `<div class="product-subcats">${mainCat} » ${subCat}</div>` : ''}

        ${descHTML}

        ${warrantyHTML}

        <div class="product-price-box">
          <div class="price-label">السعر</div>
          ${priceBeforeHTML}
          ${priceHTML}
        </div>

        <div class="product-ctas">
          <button class="btn btn-maroon" onclick='addToCart(${JSON.stringify(productData)})'>
            <i class="fa-solid fa-cart-plus"></i> إضافة للسلة
          </button>
        </div>
      </div>
    </div>
  `;

  initBanner(img1, img2);
}

function initPage() {
  const raw = sessionStorage.getItem('currentProduct');
  if (!raw) {
    document.getElementById('productContent').innerHTML = `
      <div class="error-state">
        <h3>لم يتم تحديد منتج</h3>
        <p><a href="index.html">العودة للرئيسية</a></p>
      </div>`;
    return;
  }
  try {
    const product = JSON.parse(raw);
    renderProduct(product);
  } catch (e) {
    document.getElementById('productContent').innerHTML = `
      <div class="error-state">
        <h3>حدث خطأ في تحميل المنتج</h3>
        <p><a href="javascript:history.back()">العودة</a></p>
      </div>`;
  }
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
