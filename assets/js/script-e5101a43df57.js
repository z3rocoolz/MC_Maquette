const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');
const overlay = document.getElementById('overlay');
function openMenu() {
  menu.classList.add('open'); overlay.classList.add('open');
  hamburger.classList.add('open'); hamburger.setAttribute('aria-expanded','true');
  requestAnimationFrame(function() { overlay.classList.add('visible'); });
}
function closeMenu() {
  menu.classList.remove('open'); overlay.classList.remove('visible');
  hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded','false');
  setTimeout(function() { overlay.classList.remove('open'); }, 350);
}
hamburger.addEventListener('click', function() { menu.classList.contains('open') ? closeMenu() : openMenu(); });
overlay.addEventListener('click', closeMenu);
menu.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', closeMenu); });
document.querySelectorAll('.faq-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    const isOpen = btn.classList.contains('open');
    document.querySelectorAll('.faq-btn').forEach(function(b) {
      b.classList.remove('open'); b.setAttribute('aria-expanded','false');
      b.nextElementSibling.classList.remove('open');
    });
    if (!isOpen) {
      btn.classList.add('open'); btn.setAttribute('aria-expanded','true');
      btn.nextElementSibling.classList.add('open');
    }
  });
});
const obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; }
  });
}, {threshold:0.06});
document.querySelectorAll('.col-card,.faq-item,.ville-card,.page-card').forEach(function(el) {
  el.style.opacity='0'; el.style.transform='translateY(14px)';
  el.style.transition='opacity .45s ease,transform .45s ease';
  obs.observe(el);
});
