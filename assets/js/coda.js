'use strict';
(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.getElementById('navigation-principale');
  const mobile = window.matchMedia('(max-width: 1020px)');
  if (menuButton && nav) {
    menuButton.hidden = false;
    document.documentElement.classList.add('js-menu');
    const setOpen = (open, restoreFocus = false) => {
      menuButton.setAttribute('aria-expanded', String(open));
      nav.dataset.collapsed = String(!open);
      if (restoreFocus) menuButton.focus();
    };
    const adapt = () => {
      menuButton.hidden = !mobile.matches;
      setOpen(!mobile.matches);
    };
    menuButton.addEventListener('click', () => setOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobile.matches && menuButton.getAttribute('aria-expanded') === 'true') setOpen(false, true);
    });
    nav.addEventListener('click', event => { if (mobile.matches && event.target.closest('a')) setOpen(false); });
    mobile.addEventListener('change', adapt);
    adapt();
  }

  // Liens d'ancrage natifs : tous les textes existent avant le JavaScript.
  const techniqueLinks = [...document.querySelectorAll('[data-technique-link]')];
  const panels = [...document.querySelectorAll('[data-technique-panel]')];
  if (techniqueLinks.length && panels.length) {
    const activate = id => {
      panels.forEach(panel => { panel.hidden = panel.id !== id; });
      techniqueLinks.forEach(link => {
        const current = link.getAttribute('href') === '#' + id;
        if (current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };
    techniqueLinks.forEach(link => link.addEventListener('click', event => {
      const id = link.getAttribute('href').slice(1);
      if (!panels.some(p => p.id === id)) return;
      event.preventDefault();
      activate(id);
      const panel = document.getElementById(id);
      panel.focus({preventScroll: true});
      if (window.matchMedia('(max-width: 760px)').matches) panel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
    }));
    const initial = panels.some(p => '#' + p.id === location.hash) ? location.hash.slice(1) : panels[0].id;
    activate(initial);
  }

  const filter = document.querySelector('[data-specialty-filter]');
  if (filter) {
    const cards = [...document.querySelectorAll('[data-specialty-category]')];
    const status = document.querySelector('[data-filter-status]');
    filter.hidden = false;
    filter.addEventListener('click', event => {
      const button = event.target.closest('button[data-filter]');
      if (!button) return;
      const selected = button.dataset.filter;
      let visible = 0;
      cards.forEach(card => {
        card.hidden = selected !== 'all' && card.dataset.specialtyCategory !== selected;
        if (!card.hidden) visible++;
      });
      filter.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      if (status) status.textContent = visible + (visible === 1 ? ' domaine affiché' : ' domaines affichés');
    });
  }
})();
