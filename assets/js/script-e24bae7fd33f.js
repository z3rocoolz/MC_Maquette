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
