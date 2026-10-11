// Menu hamburger — robuste
document.addEventListener('DOMContentLoaded', function() {
  // Accordéons menu mobile
  document.querySelectorAll('.mm-acc-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var body = btn.nextElementSibling;
      var isOpen = btn.classList.contains('open');
      document.querySelectorAll('.mm-acc-btn').forEach(function(b) {
        b.classList.remove('open');
        if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
      });
      if (!isOpen) { btn.classList.add('open'); body.classList.add('open'); }
    });
  });

const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const overlay = document.getElementById('menu-overlay');
if (!hamburger || !mobileMenu || !overlay) return;

function openMenu(){
  mobileMenu.classList.add('open');
  overlay.classList.add('open');
  hamburger.classList.add('open');
  document.body.style.overflow='hidden';
  requestAnimationFrame(function(){ overlay.classList.add('visible'); });
}
function closeMenu(){
  mobileMenu.classList.remove('open');
  overlay.classList.remove('visible');
  hamburger.classList.remove('open');
  document.body.style.overflow='';
  setTimeout(function(){ overlay.classList.remove('open'); }, 350);
}
hamburger.addEventListener('click',()=>mobileMenu.classList.contains('open')?closeMenu():openMenu());
overlay.addEventListener('click',closeMenu);
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));

// Accordéons mobile
document.querySelectorAll('.mm-section-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const body = btn.nextElementSibling;
    const isOpen = btn.classList.contains('open');
    // Fermer tous les autres
    document.querySelectorAll('.mm-section-btn').forEach(function(b) {
      b.classList.remove('open');
      if(b.nextElementSibling) b.nextElementSibling.classList.remove('open');
    });
    // Ouvrir celui-ci si fermé
    if(!isOpen) {
      btn.classList.add('open');
      body.classList.add('open');
    }
  });
});
}); // fin DOMContentLoaded

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(q=>{
  q.addEventListener('click',()=>{
    const isOpen=q.classList.contains('open');
    document.querySelectorAll('.faq-q').forEach(qq=>{
      qq.classList.remove('open');
      qq.parentElement.querySelector('.faq-a').classList.remove('open');
    });
    if(!isOpen){
      q.classList.add('open');
      q.parentElement.querySelector('.faq-a').classList.add('open');
    }
  });
});

// Reveal scroll
const obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, {threshold: 0.08});
document.querySelectorAll('.rhino-card,.pourquoi-card,.sec-card,.consult-card,.faq-item').forEach(function(el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  obs.observe(el);
});
