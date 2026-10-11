'use strict';

/**
 * Interface d'édition : éditeur de texte riche, repliage des sections,
 * garde-fou contre la perte de saisie.
 *
 * Aucune dépendance : le champ riche est un `contenteditable` dont le contenu
 * est nettoyé avant d'être renvoyé, pour qu'il ne produise que les balises
 * attendues par le site.
 */

/* ─── Nettoyage du HTML saisi ───────────────────────────────────── */

const BALISES_AUTORISEES = new Set(['P','BR','STRONG','EM','A','UL','OL','LI','SPAN','SUP','SUB','DIV','SECTION','ARTICLE','ADDRESS','H2','H3','H4','H5','H6','IMG','FIGURE','FIGCAPTION','BLOCKQUOTE','CITE','TABLE','THEAD','TBODY','TR','TH','TD','SMALL','NAV','ASIDE','DETAILS','SUMMARY','BUTTON','PICTURE','SOURCE','SVG','PATH','CIRCLE']);
const EQUIVALENCES = { B: 'STRONG', I: 'EM' };
const ATTRIBUTS_AUTORISES = new Set(['class','id','hidden','role','tabindex','aria-label','aria-labelledby','aria-describedby','aria-hidden','aria-live','aria-pressed','aria-expanded','aria-controls','aria-current','href','target','rel','src','srcset','sizes','alt','width','height','loading','media','type','colspan','rowspan','scope','viewbox','xmlns','focusable','d','cx','cy','r','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','data-technique-link','data-technique-panel','data-specialty-category','data-specialty-filter','data-filter-status','data-filter']);

/**
 * Ramène le contenu aux seules balises que le site sait mettre en forme.
 * Le presse-papiers apporte sinon des styles, des polices et des classes
 * venues de Word ou d'une page web.
 *
 * Confort de saisie uniquement : le filtrage qui fait foi est celui du
 * serveur (`admin/src/assainir.js`), qu'une requête forgée ne contourne pas.
 */
function nettoyer(racine) {
  const copie = racine.cloneNode(true);

  copie.querySelectorAll('script, style, iframe, object, embed, form, input, textarea, link, meta, noscript, math').forEach((e) => e.remove());

  // Remplacer un élément recrée ses descendants : on repasse jusqu'à stabilité,
  // sinon un « b » imbriqué dans un « div » survit au nettoyage.
  for (let passe = 0; passe < 8; passe += 1) {
    const fautif = [...copie.querySelectorAll('*')].find(
      (e) => EQUIVALENCES[e.tagName.toUpperCase()] || !BALISES_AUTORISEES.has(e.tagName.toUpperCase())
    );
    if (!fautif) break;

    const remplacement = EQUIVALENCES[fautif.tagName.toUpperCase()];
    if (remplacement) {
      const neuf = document.createElement(remplacement);
      neuf.innerHTML = fautif.innerHTML;
      fautif.replaceWith(neuf);
    } else {
      fautif.replaceWith(...fautif.childNodes);
    }
  }

  for (const element of copie.querySelectorAll('*')) {
    for (const attribut of [...element.attributes]) {
      const garder = ATTRIBUTS_AUTORISES.has(attribut.name.toLowerCase());
      if (!garder || /^on/i.test(attribut.name)) element.removeAttribute(attribut.name);
    }
    if (element.tagName === 'A' && /^\s*(javascript|data|vbscript):/i.test(element.getAttribute('href') || '')) {
      element.removeAttribute('href');
    }
  }

  return copie.innerHTML.trim();
}

/* ─── Éditeur riche ─────────────────────────────────────────────── */

function installerEditeur(editeur) {
  const zone = editeur.querySelector('.zone-riche');
  const code = editeur.querySelector('.zone-code');
  const cible = document.getElementById(editeur.dataset.cible);

  const synchroniser = () => {
    cible.value = code.hidden ? nettoyer(zone) : code.value.trim();
  };

  zone.addEventListener('input', synchroniser);
  zone.addEventListener('blur', synchroniser);
  code.addEventListener('input', synchroniser);

  // Le collage n'apporte que du texte : la mise en forme se refait à la main.
  zone.addEventListener('paste', (evenement) => {
    evenement.preventDefault();
    const texte = (evenement.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, texte);
  });

  editeur.querySelectorAll('.outils button').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const commande = bouton.dataset.commande;

      if (commande === 'code') {
        if (code.hidden) {
          code.value = nettoyer(zone);
          code.hidden = false;
          zone.hidden = true;
        } else {
          zone.innerHTML = code.value;
          zone.hidden = false;
          code.hidden = true;
        }
        synchroniser();
        return;
      }

      if (commande === 'lien') {
        const adresse = prompt('Adresse du lien (ex. /rhinoplastie-nice/)');
        if (adresse) {
          zone.focus();
          document.execCommand('createLink', false, adresse);
        }
        synchroniser();
        return;
      }

      zone.focus();
      document.execCommand(commande, false, null);
      synchroniser();
    });
  });
}

/* ─── Mise en place ─────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.editeur').forEach(installerEditeur);

  // Sur les pages longues seulement, les sections lointaines sont repliées au
  // départ. Le contenu rédactionnel, lui, reste toujours visible : le replier
  // faisait croire que la page n'avait que des champs de référencement.
  document.querySelectorAll('.groupe[data-repliable]').forEach((groupe) => {
    groupe.setAttribute('data-replie', '');
    groupe.querySelector('h2').addEventListener('click', () => {
      groupe.toggleAttribute('data-replie');
    });
  });

  // Compteur de caractères pour la description de référencement.
  document.querySelectorAll('.compteur').forEach((compteur) => {
    const champ = document.getElementById(compteur.dataset.pour);
    const ideal = Number(compteur.dataset.ideal);
    const rafraichir = () => {
      const n = champ.value.length;
      compteur.textContent = `${n} caractères — Google en affiche environ ${ideal}`;
      compteur.classList.toggle('long', n > ideal);
    };
    champ.addEventListener('input', rafraichir);
    rafraichir();
  });

  // Confirmation des actions irréversibles.
  document.querySelectorAll('[data-confirmer]').forEach((bouton) => {
    bouton.addEventListener('click', (evenement) => {
      if (!confirm(bouton.dataset.confirmer)) evenement.preventDefault();
    });
  });

  const formulaire = document.getElementById('formulaire-page');
  if (!formulaire) return;

  let modifie = false;
  formulaire.addEventListener('input', () => {
    modifie = true;
  });

  formulaire.addEventListener('submit', (evenement) => {
    // Les éditeurs riches encore ouverts doivent livrer leur contenu.
    document.querySelectorAll('.zone-riche').forEach((zone) => zone.dispatchEvent(new Event('blur')));
    modifie = false;
    const bouton = evenement.target.querySelector('button[type=submit]');
    if (bouton) {
      bouton.disabled = true;
      bouton.textContent = 'Enregistrement…';
    }
  });

  window.addEventListener('beforeunload', (evenement) => {
    if (!modifie) return;
    evenement.preventDefault();
    evenement.returnValue = '';
  });
});
