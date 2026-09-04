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

  document.querySelectorAll('.bs-desc-toggle').forEach(btn => {
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
});
