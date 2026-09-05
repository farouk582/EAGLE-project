function sendFeedback() {
  const name = document.getElementById('feedbackName').value.trim();
  const phone = document.getElementById('feedbackPhone').value.trim();
  const message = document.getElementById('feedbackMessage').value.trim();

  if (!name || !phone || !message) {
    alert('من فضلك املأ جميع البيانات');
    return;
  }

  emailjs.send('service_7c5fzpr', 'template_rp7twyi', { name, phone, message })
    .then(() => {
      document.getElementById('feedbackName').value = '';
      document.getElementById('feedbackPhone').value = '';
      document.getElementById('feedbackMessage').value = '';
      alert('تم إرسال شكواك بنجاح ❤️');
    })
    .catch(err => {
      console.error('EmailJS Error:', err);
      alert('حدث خطأ أثناء الإرسال، حاول مرة أخرى.');
    });
}

// ===== Bestsellers =====
const BS_COLS = {
  mainCat: 'القسم الرئيسي',
  name: 'اسم الجهاز ',
  desc: 'الوصف\n(المميزات و المحتويات )',
  priceBefore: 'السعر قبل الخصم',
  price: 'السعر',
  img1: 'الصور1',
  img2: 'الصور2',
  bestseller: 'الأكثر طلبا'
};

function isEmptyValue(v) {
  if (!v) return true;
  const t = String(v).trim();
  return t === '' || t === '-' || t === '--';
}

function buildBsCard(item) {
  const name = item[BS_COLS.name] || '';
  const cat = item[BS_COLS.mainCat] || '';
  const desc = isEmptyValue(item[BS_COLS.desc]) ? '' : item[BS_COLS.desc];
  const priceBefore = item[BS_COLS.priceBefore] || '';
  const price = item[BS_COLS.price] || '';
  const img1raw = item[BS_COLS.img1] || '';
  const img1 = isEmptyValue(img1raw) ? '' : img1raw;

  const words = desc.split(' ').filter(Boolean);
  const short = words.slice(0, 12).join(' ');
  const rest = words.slice(12).join(' ');
  const hasMore = words.length > 12;

  const beforeHTML = !isEmptyValue(priceBefore)
    ? `<span class="price-before">${priceBefore} جنيه</span>` : '';
  const discountBadge = !isEmptyValue(priceBefore)
    ? `<span class="tag tag-maroon">خصم</span>` : '';

  const productData = encodeURIComponent(JSON.stringify({
    name, desc, priceBefore, price,
    img1: item[BS_COLS.img1],
    img2: item[BS_COLS.img2],
    mainCat: cat
  }));

  return `
    <div class="bs-card" onclick="bsGoProduct('${productData}')">
      <div class="bs-media">
        ${img1 ? `<img src="${img1}" alt="${name}" onerror="this.parentElement.style.background='var(--bg-soft)'">` : ''}
      </div>
      <div class="bs-body">
        <div class="bs-tags">
          <span class="tag tag-gold">الأكثر طلباً</span>
          ${discountBadge}
        </div>
        <h3>${name}</h3>
        <div class="cat">${cat}</div>
        <p class="bs-desc">
          ${short}${hasMore ? `<span class="bs-desc-more"> ${rest}</span>` : ''}
        </p>
        ${hasMore ? `<button class="bs-desc-toggle">اقرأ المزيد</button>` : ''}
        <div class="bs-price">
          ${beforeHTML}
          <span class="price-current">${price ? price + ' جنيه' : 'جاري التحديث'}</span>
        </div>
      </div>
    </div>`;
}

function bsGoProduct(encodedData) {
  sessionStorage.setItem('currentProduct', decodeURIComponent(encodedData));
  window.location.href = 'product.html';
}

async function loadBestsellers() {
  const strip = document.getElementById('bsStrip');
  if (!strip) return;

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbypsXLzEYO3YbnTKMEtv44FVf8od-zAonHjpwcLhNZ96QCTNKc9m8MPvPdzquxB8kM/exec';
  const CACHE_KEY = 'eagle_sheet_data';
  const CACHE_TTL = 30 * 60 * 1000;

  let data = [];
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cachedTime = sessionStorage.getItem(CACHE_KEY + '_time');
    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < CACHE_TTL) {
      data = JSON.parse(cached);
    } else {
      const res = await fetch(SHEET_URL);
      data = await res.json();
      if (Array.isArray(data)) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(CACHE_KEY + '_time', Date.now().toString());
      }
    }
  } catch (e) {
    console.error('Bestsellers fetch error:', e);
  }

  if (!Array.isArray(data) || data.length === 0) {
    strip.innerHTML = '<p style="color:var(--ink-soft);padding:20px">لا توجد منتجات متاحة حالياً</p>';
    return;
  }

  // فلتر: الأكثر طلبا = نعم
  let bestsellers = data.filter(r => {
    const val = (r[BS_COLS.bestseller] || '').toString().trim();
    return val === 'نعم' || val === 'yes' || val === 'Yes' || val === '1' || val === 'TRUE' || val === 'true';
  });

  // لو مفيش منتجات معلّمة "الأكثر طلبا"، خد أول منتج من كل قسم مختلف (مش أول 8 صفوف اللي ممكن تكون كلها من نفس القسم)
  if (bestsellers.length === 0) {
    const seenCats = new Set();
    bestsellers = [];
    for (const row of data) {
      const cat = (row[BS_COLS.mainCat] || '').trim();
      const name = (row[BS_COLS.name] || '').trim();
      if (!cat || !name || seenCats.has(cat)) continue;
      seenCats.add(cat);
      bestsellers.push(row);
      if (bestsellers.length >= 8) break;
    }
    if (bestsellers.length === 0) {
      strip.innerHTML = '<p style="color:var(--ink-soft);padding:20px">لا توجد منتجات متاحة حالياً</p>';
      return;
    }
  }

  strip.innerHTML = bestsellers.map(buildBsCard).join('');

  // تفعيل أزرار اقرأ المزيد
  strip.querySelectorAll('.bs-desc-toggle').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const more = btn.previousElementSibling;
      if (more && more.classList.contains('bs-desc-more')) {
        const isOpen = more.style.display === 'inline';
        more.style.display = isOpen ? 'none' : 'inline';
        btn.textContent = isOpen ? 'اقرأ المزيد' : 'أقل';
      }
    });
  });
}
// 1. جلب البيانات من Google Sheet مع التخزين المؤقت (SessionStorage)
async function getSheetData() {
  try {
    const cached = sessionStorage.getItem('eagle_sheet_data');
    const cachedTime = sessionStorage.getItem('eagle_sheet_data_time');
    
    // التخزين المؤقت لمدة 30 دقيقة لسرعة الأداء
    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < 1800000) {
      return JSON.parse(cached);
    }
    
    const res = await fetch('https://script.google.com/macros/s/AKfycbypsXLzEYO3YbnTKMEtv44FVf8od-zAonHjpwcLhNZ96QCTNKc9m8MPvPdzquxB8kM/exec');
    const data = await res.json();
    
    if (Array.isArray(data)) {
      sessionStorage.setItem('eagle_sheet_data', JSON.stringify(data));
      sessionStorage.setItem('eagle_sheet_data_time', Date.now().toString());
      return data;
    }
  } catch(e) {
    console.error('Error fetching sheet data:', e);
  }
  return [];
}

// 2. دالة الرد المحلي الذكي (تعتمد على البحث السريع بداخل الكتالوج)
function getLocalBotReply(userText, sheetData) {
  const text = userText.toLowerCase().trim();

  // أ. استفسارات التواصل والعنوان
  if (text.includes('عنوان') || text.includes('مكان') || text.includes('فين') || text.includes('مقر')) {
    return 'مقرنا في القاهرة. للتفاصيل والزيارة تواصل معنا على واتساب: 01006264999';
  }
  if (text.includes('رقم') || text.includes('تليفون') || text.includes('واتس') || text.includes('اتصال') || text.includes('تواصل')) {
    return 'يمكنك التواصل معنا عبر:\n- واتساب: 01006264999\n- موبايل: 01006264999 / 01503011200\n- أرضي: 0223629914';
  }

  // ب. البحث بداخل منتجات Google Sheet محلياً
  if (sheetData && sheetData.length) {
    const matches = sheetData.filter(item => {
      const nameKey = Object.keys(item).find(k => k.trim().includes('اسم الجهاز')) || '';
      const catKey  = Object.keys(item).find(k => k.trim().includes('القسم الرئيسي')) || '';

      const name = String(item[nameKey] ?? '').toLowerCase();
      const cat  = String(item[catKey] ?? '').toLowerCase();

      return (name && (name.includes(text) || text.includes(name))) ||
             (cat && (cat.includes(text) || text.includes(cat)));
    });

    if (matches.length > 0) {
      let reply = 'وجدنا المنتجات التالية بناءً على طلبك:\n';
      matches.slice(0, 4).forEach(m => {
        const nameKey  = Object.keys(m).find(k => k.trim().includes('اسم الجهاز')) || '';
        const priceKey = Object.keys(m).find(k => k.trim().includes('السعر')) || '';

        const name  = String(m[nameKey] ?? 'جهاز').trim();
        const price = String(m[priceKey] ?? 'عند الطلب').trim();

        reply += `• ${name} - السعر: ${price} جنيه\n`;
      });
      reply += '\nلطلب الأجهزة واستفسارات الضمان تواصل معنا على واتساب: 01006264999';
      return reply;
    }
  }

  // ج. الرد الافتراضي
  return 'أهلاً بك في EAGLE Medical! نحن متخصصون في الأجهزة والمستلزمات الطبية بالقاهرة.\nيمكنك البحث باسم الجهاز أو قسمه، أو التواصل معنا مباشرة عبر واتساب: 01006264999';
}

// 3. دالة معالجة إرسال الرسالة وعرضها بداخل الشات
async function sendAiMessage() {
  const input    = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const sendBtn  = document.getElementById('chatSendBtn');
  
  if (!input || !messages) return;
  
  const userText = (input.value || '').trim();
  if (!userText) return;

  input.value = '';
  if (sendBtn) sendBtn.disabled = true;
  
  messages.innerHTML += '<div class="bubble user">' + userText + '</div>';

  const typingId = 'typing_' + Date.now();
  messages.innerHTML += '<div class="bubble typing" id="' + typingId + '">جاري البحث...</div>';
  messages.scrollTop = messages.scrollHeight;

  // جلب المنتجات من الشيت محلياً أو من الكاش
  const sheetData = await getSheetData();
  
  // توليد الرد فوراً
  const reply = getLocalBotReply(userText, sheetData);

  // إزالة مؤشر "جاري البحث" وعرض الرد
  const typingElem = document.getElementById(typingId);
  if (typingElem) typingElem.remove();

  messages.innerHTML += '<div class="bubble bot">' + reply.replace(/\n/g, '<br>') + '</div>';

  if (sendBtn) sendBtn.disabled = false;
  messages.scrollTop = messages.scrollHeight;
}

// 4. الأحداث الأساسية للسطح والموبايل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }

  if (typeof loadBestsellers === 'function') {
    loadBestsellers();
  }
});