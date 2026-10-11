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
