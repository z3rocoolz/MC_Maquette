'use strict';
(() => {
  const sections = [...document.querySelectorAll('details[data-reading-section], .technical-details details')];
  const toggle = document.querySelector('[data-reading-toggle]');
  const setOpen = (detail, open) => detail.toggleAttribute('open', open);
  const update = () => {
    if (!toggle) return;
    const allOpen = sections.every(section => section.hasAttribute('open'));
    toggle.textContent = allOpen ? 'Tout replier' : 'Tout afficher';
    toggle.setAttribute('aria-expanded', String(allOpen));
  };
  if (toggle && sections.length) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const expand = !sections.every(section => section.hasAttribute('open'));
      sections.forEach(section => setOpen(section, expand));
      update();
    });
    sections.forEach(section => section.addEventListener('toggle', update));
    update();
  }
  const targetFor = hash => {
    try { return hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; }
    catch { return null; }
  };
  const reveal = (target, focus = false) => {
    if (!target) return;
    let ancestor = target.closest('details');
    while (ancestor) {
      setOpen(ancestor, true);
      ancestor = ancestor.parentElement?.closest('details');
    }
    update();
    if (focus) {
      const destination = target.matches('details') ? target.querySelector('summary') : target;
      if (!destination.matches('summary, a[href], button, input, select, textarea, [tabindex]')) destination.setAttribute('tabindex', '-1');
      destination.focus({preventScroll: true});
    }
    target.scrollIntoView({block: 'start'});
  };
  // L'ouverture précède la navigation native, même si l'ancre est déjà dans l'URL.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(targetFor(link.getAttribute('href')), true);
  });
  window.addEventListener('hashchange', () => reveal(targetFor(location.hash), true));
  reveal(targetFor(location.hash));

  // Ne perdre aucun texte à l'impression et retrouver ensuite son état de lecture.
  let printState = null;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = [...document.querySelectorAll('details')].map(detail => [detail, detail.hasAttribute('open')]);
    printState.forEach(([detail]) => setOpen(detail, true));
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    printState.forEach(([detail, open]) => setOpen(detail, open));
    printState = null;
    update();
  });
})();
