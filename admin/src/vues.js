'use strict';

const { champsDeLaPage, echapper, lireChemin } = require('./formulaire');

function gabarit({ titre, contenu, session, actif }) {
  const onglets = session
    ? `<nav class="barre-liens">
         <a href="/"${actif === 'pages' ? ' class="actif"' : ''}>Pages</a>
         <a href="/page/article-du-mois">L’article du mois</a>
         <a href="/galerie"${actif === 'galerie' ? ' class="actif"' : ''}>Avant / Après</a>
         <a href="/parametres"${actif === 'parametres' ? ' class="actif"' : ''}>Réglages</a>
         <form method="post" action="/deconnexion" class="en-ligne">
           <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>
           <button type="submit" class="lien">Se déconnecter</button>
         </form>
       </nav>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="noindex, nofollow"/>
<title>${echapper(titre)} — Administration</title>
<link rel="stylesheet" href="/admin.css"/>
</head>
<body>
<header class="barre">
  <div class="marque">Dr Mattia Coda <span>administration</span></div>
  ${onglets}
</header>
<main>${contenu}</main>
<script src="/admin.js" defer></script>
</body>
</html>`;
}

function pageConnexion({ erreur }) {
  return gabarit({
    titre: 'Connexion',
    contenu: `
      <div class="connexion">
        <h1>Connexion</h1>
        ${erreur ? `<p class="erreur">${echapper(erreur)}</p>` : ''}
        <form method="post" action="/connexion">
          <label for="motdepasse">Mot de passe</label>
          <input type="password" id="motdepasse" name="motdepasse" autocomplete="current-password" autofocus required/>
          <button type="submit" class="bouton">Entrer</button>
        </form>
      </div>`,
  });
}

function pageListe({ pages, session, message, perimees }) {
  const lignes = pages
    .map(
      (p) => `
      <tr${p.propre ? ' class="mise-en-avant"' : ''}>
        <td>
            ${p.rubrique ? `<span class="rubrique">${echapper(p.rubrique)}</span>` : ''}
            <a href="/page/${echapper(p.slug)}">${echapper(p.libelle)}</a>
            ${p.propre ? '<span class="etiquette">à mettre à jour régulièrement</span>' : ''}
            <span class="url">${echapper(p.url)}</span></td>
        <td class="nombre">${p.sections}</td>
        <td class="nombre">${p.blocs}</td>
        <td class="date">${new Date(p.modifie).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td><a class="discret" href="/apercu/${echapper(p.slug)}" target="_blank" rel="noopener">Aperçu</a></td>
      </tr>`
    )
    .join('');

  return gabarit({
    titre: 'Pages',
    session,
    actif: 'pages',
    contenu: `
      <div class="entete">
        <h1>Pages du site</h1>
        <p class="aide">${pages.length} pages. Cliquez sur un titre pour modifier ses textes.</p>
      </div>
      ${message ? `<p class="succes">${echapper(message)}</p>` : ''}
      ${
        perimees && perimees.length
          ? `<p class="alerte"><strong>Redémarrage nécessaire :</strong> le code de rendu a été modifié
             depuis le lancement de l’administration (${echapper(perimees.join(', '))}).
             Tant qu’elle n’est pas relancée, chaque enregistrement régénère les pages avec
             l’ancienne version. Arrêtez-la (Ctrl-C) et relancez <code>npm run admin</code>.</p>`
          : ''
      }
      <table class="liste">
        <thead><tr><th>Page (nom dans le menu du site)</th><th class="nombre">Sections</th><th class="nombre">Blocs</th><th>Modifiée</th><th></th></tr></thead>
        <tbody>${lignes}</tbody>
      </table>`,
  });
}

/** Un champ, selon sa nature : ligne simple, zone, texte riche ou HTML. */
function rendreChamp(champ, valeur) {
  const identifiant = `c_${champ.cle.replace(/[^a-z0-9]/gi, '_')}`;
  const nom = echapper(champ.cle);

  if (champ.type === 'riche') {
    return `
      <div class="champ">
        <label for="${identifiant}">${echapper(champ.libelle)}</label>
        <div class="editeur" data-cible="${identifiant}">
          <div class="outils">
            <button type="button" data-commande="bold" title="Gras"><b>G</b></button>
            <button type="button" data-commande="italic" title="Italique"><i>I</i></button>
            <button type="button" data-commande="lien" title="Insérer un lien">🔗</button>
            <button type="button" data-commande="unlink" title="Retirer le lien">⛓️‍💥</button>
            <button type="button" data-commande="code" title="Voir le HTML">&lt;/&gt;</button>
          </div>
          <div class="zone-riche" contenteditable="true" spellcheck="true">${valeur}</div>
          <textarea class="zone-code" hidden>${echapper(valeur)}</textarea>
        </div>
        <input type="hidden" id="${identifiant}" name="${nom}" value="${echapper(valeur)}"/>
      </div>`;
  }

  if (champ.type === 'code') {
    return `
      <div class="champ">
        <label for="${identifiant}">${echapper(champ.libelle)}</label>
        <textarea id="${identifiant}" name="${nom}" class="code" rows="4">${echapper(valeur)}</textarea>
      </div>`;
  }

  if (champ.type === 'zone') {
    return `
      <div class="champ">
        <label for="${identifiant}">${echapper(champ.libelle)}</label>
        <textarea id="${identifiant}" name="${nom}" rows="3">${echapper(valeur)}</textarea>
        <span class="compteur" data-pour="${identifiant}" data-ideal="160"></span>
      </div>`;
  }

  return `
    <div class="champ">
      <label for="${identifiant}">${echapper(champ.libelle)}</label>
      <input type="text" id="${identifiant}" name="${nom}" value="${echapper(valeur)}"/>
    </div>`;
}

/**
 * Formulaire renvoyé quand le jeton a expiré : la saisie est réinjectée dans
 * des champs cachés, il ne reste qu'à confirmer. Rien n'est perdu.
 */
function pageJetonExpire({ session, action, valeurs }) {
  const champs = Object.entries(valeurs)
    .filter(([cle]) => cle !== 'csrf')
    .map(([cle, valeur]) => `<input type="hidden" name="${echapper(cle)}" value="${echapper(valeur)}"/>`)
    .join('\n        ');

  return gabarit({
    titre: 'Confirmer l’enregistrement',
    session,
    contenu: `
      <div class="entete">
        <h1>Votre session avait expiré</h1>
        <p class="aide">
          L’administration a redémarré pendant que vous écriviez. Votre texte est
          intact : confirmez pour l’enregistrer.
        </p>
      </div>
      <form method="post" action="${echapper(action)}">
        <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>
        ${champs}
        <div class="actions">
          <button type="submit" class="bouton">Enregistrer maintenant</button>
          <a class="discret" href="/">Abandonner ces modifications</a>
        </div>
      </form>`,
  });
}

function pageEdition({ page, session, message, ecarts, versions, libelle }) {
  const champs = champsDeLaPage(page);

  const groupes = [];
  for (const champ of champs) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.nom === champ.groupe) dernier.champs.push(champ);
    else groupes.push({ nom: champ.groupe, champs: [champ] });
  }

  const corps = groupes
    .map(
      (groupe, i) => `
      <section class="groupe"${groupes.length > 6 && i > 3 ? ' data-repliable' : ''}${groupe.nom.startsWith('Référencement') ? ' data-secondaire' : ''}>
        <h2>${echapper(groupe.nom)}</h2>
        <div class="contenu-groupe">
          ${groupe.champs.map((c) => rendreChamp(c, String(lireChemin(page, c.cle) ?? ''))).join('')}
        </div>
      </section>`
    )
    .join('');

  const historique = versions.length
    ? `<details class="historique">
         <summary>Versions précédentes (${versions.length})</summary>
         <ul>${versions
           .slice(0, 10)
           .map(
             (v) => `<li>
               <span>${v.date.toLocaleString('fr-FR')}</span>
               <form method="post" action="/page/${echapper(page.slug)}/restaurer" class="en-ligne">
                 <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>
                 <input type="hidden" name="fichier" value="${echapper(v.fichier)}"/>
                 <button type="submit" class="lien" data-confirmer="Restaurer cette version ? Le texte actuel sera archivé.">Restaurer</button>
               </form>
             </li>`
           )
           .join('')}</ul>
       </details>`
    : '';

  return gabarit({
    titre: page.seo.title,
    session,
    actif: 'pages',
    contenu: `
      <div class="entete">
        <p class="fil"><a href="/">Pages</a> › ${echapper(page.url)}</p>
        <h1>${echapper(libelle || page.seo.title.split('–')[0].trim())}</h1>
        <p class="aide">${champs.length} champs modifiables. L’enregistrement met le site à jour immédiatement.</p>
      </div>
      ${message ? `<p class="succes">${echapper(message)}</p>` : ''}
      ${
        ecarts && ecarts.length
          ? `<p class="alerte"><strong>Mise en page :</strong> ${echapper(ecarts.join(' · '))}</p>`
          : ''
      }
      <form method="post" action="/page/${echapper(page.slug)}" id="formulaire-page">
        <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>
        ${corps}
        <div class="actions">
          <button type="submit" class="bouton">Enregistrer</button>
          <a class="bouton secondaire" href="/apercu/${echapper(page.slug)}" target="_blank" rel="noopener">Aperçu</a>
          <a class="discret" href="/">Revenir sans enregistrer</a>
        </div>
      </form>
      ${historique}`,
  });
}

function pageParametres({ liens, session, message, erreurs, photo }) {
  const doctolib = liens.doctolib || {};
  const villes = doctolib.parVille || {};

  const champVille = (ville) => `
    <div class="champ">
      <label for="v_${ville}">${echapper(ville)}</label>
      <input type="text" id="v_${ville}" name="ville_${echapper(ville)}"
             value="${echapper(villes[ville] || '')}"
             placeholder="Laisser vide pour utiliser la fiche principale"/>
    </div>`;

  return gabarit({
    titre: 'Réglages',
    session,
    actif: 'parametres',
    contenu: `
      <div class="entete">
        <h1>Réglages du site</h1>
        <p class="aide">Ces valeurs s’appliquent à toutes les pages. Les enregistrer régénère le site entier.</p>
      </div>
      ${message ? `<p class="succes">${echapper(message)}</p>` : ''}
      ${
        erreurs && erreurs.length
          ? `<p class="erreur">${erreurs.map(echapper).join('<br/>')}</p>`
          : ''
      }
      <form method="post" action="/parametres/photo" enctype="multipart/form-data">
        <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>

        <section class="groupe">
          <h2>Photo de la page d’accueil</h2>
          <div class="contenu-groupe">
            <p class="aide" style="margin-bottom:16px">
              Affichée sous le bandeau, en haut de la page d’accueil.
              Une image carrée donne le meilleur résultat ; les autres sont recadrées
              au centre. JPEG, PNG ou WebP, 6 Mo au maximum.
            </p>
            ${
              photo && photo.fichier
                ? `<div class="apercu-photo">
                     <img src="/medias/${echapper(photo.fichier)}" alt="${echapper(photo.alt || '')}"/>
                     <span>${echapper(photo.fichier)}</span>
                   </div>`
                : '<p class="aide">Aucune photo pour l’instant.</p>'
            }
            <div class="champ">
              <label for="photo">Remplacer la photo</label>
              <input type="file" id="photo" name="photo" accept="image/jpeg,image/png,image/webp"/>
            </div>
            <div class="champ">
              <label for="alt">Description de l’image (lue par les lecteurs d’écran et Google)</label>
              <input type="text" id="alt" name="alt" value="${echapper((photo && photo.alt) || '')}"/>
            </div>
            <div class="champ">
              <label for="taille">Taille affichée, en pixels (80 à 400)</label>
              <input type="text" id="taille" name="taille" value="${echapper(String((photo && photo.taille) || 200))}"/>
            </div>
          </div>
        </section>

        <div class="actions">
          <button type="submit" class="bouton">Enregistrer la photo et régénérer</button>
        </div>
      </form>

      <form method="post" action="/parametres">
        <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>

        <section class="groupe">
          <h2>Prise de rendez-vous Doctolib</h2>
          <div class="contenu-groupe">
            <p class="aide" style="margin-bottom:16px">
              Adresse de la fiche du praticien, celle qui s’affiche dans le navigateur
              une fois sur sa page Doctolib. Elle remplace les liens « Prendre rendez-vous »
              de tout le site.
            </p>
            <div class="champ">
              <label for="fiche">Fiche du praticien</label>
              <input type="text" id="fiche" name="fiche" value="${echapper(doctolib.fiche || '')}"
                     placeholder="https://www.doctolib.fr/..."/>
            </div>
          </div>
        </section>

        <section class="groupe">
          <h2>Agendas par cabinet</h2>
          <div class="contenu-groupe">
            <p class="aide" style="margin-bottom:16px">
              À renseigner seulement si Doctolib expose un agenda distinct par cabinet.
              Les boutons qui nomment une ville y renverront ; les autres gardent la fiche principale.
            </p>
            ${Object.keys(villes).map(champVille).join('')}
          </div>
        </section>

        <div class="actions">
          <button type="submit" class="bouton">Enregistrer et régénérer le site</button>
          <a class="discret" href="/">Revenir sans enregistrer</a>
        </div>
      </form>`,
  });
}

function pageGalerie({ entrees, session, message, erreurs }) {
  const carte = (e) => `
      <div class="carte-aa">
        <div class="carte-aa-photos">
          <figure>
            <img src="/medias/${echapper(e.avant)}" alt="Avant"/>
            <figcaption>Avant</figcaption>
          </figure>
          <figure>
            <img src="/medias/${echapper(e.apres)}" alt="Après"/>
            <figcaption>Après</figcaption>
          </figure>
        </div>
        <form method="post" action="/galerie/${echapper(e.id)}/legende" class="carte-aa-texte">
          <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>
          <label for="legende-${echapper(e.id)}">Texte explicatif</label>
          <textarea id="legende-${echapper(e.id)}" name="legende" rows="3" maxlength="600" placeholder="Intervention, délai de cicatrisation, contexte du cas…">${echapper(e.legende || '')}</textarea>
          <button type="submit" class="discret">Enregistrer le texte</button>
        </form>
        <form method="post" action="/galerie/${echapper(e.id)}/supprimer" onsubmit="return confirm('Supprimer ce cas ? Les deux photos seront effacées.');">
          <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>
          <button type="submit" class="discret">Supprimer</button>
        </form>
      </div>`;

  return gabarit({
    titre: 'Avant / Après',
    session,
    actif: 'galerie',
    contenu: `
      <div class="entete">
        <h1>Galerie avant / après</h1>
        <p class="aide">
          Chaque cas affiche deux photos dans le diaporama de la page « Avant/Après » du site.
          Ajoutez-en, réorganisez en supprimant puis ré-ajoutant, ou retirez un cas.
        </p>
      </div>
      ${message ? `<p class="succes">${echapper(message)}</p>` : ''}
      ${
        erreurs && erreurs.length
          ? `<p class="erreur">${erreurs.map(echapper).join('<br/>')}</p>`
          : ''
      }

      <form method="post" action="/galerie" enctype="multipart/form-data">
        <input type="hidden" name="csrf" value="${echapper(session.csrf)}"/>

        <section class="groupe">
          <h2>Ajouter un cas</h2>
          <div class="contenu-groupe">
            <p class="aide" style="margin-bottom:16px">
              Deux photos obligatoires, prises dans des conditions similaires (même cadrage, même
              éclairage). JPEG, PNG ou WebP, 8 Mo au maximum chacune.
            </p>
            <div class="champ">
              <label for="avant">Photo « avant »</label>
              <input type="file" id="avant" name="avant" accept="image/jpeg,image/png,image/webp" required/>
            </div>
            <div class="champ">
              <label for="apres">Photo « après »</label>
              <input type="file" id="apres" name="apres" accept="image/jpeg,image/png,image/webp" required/>
            </div>
            <div class="champ">
              <label for="legende">Texte explicatif (facultatif — intervention, délai de cicatrisation, contexte du cas…)</label>
              <textarea id="legende" name="legende" rows="3" maxlength="600"></textarea>
            </div>
          </div>
        </section>

        <div class="actions">
          <button type="submit" class="bouton">Ajouter et régénérer le site</button>
        </div>
      </form>

      <div class="entete" style="margin-top:40px">
        <h2>${entrees.length} cas ${entrees.length > 1 ? 'enregistrés' : 'enregistré'}</h2>
      </div>
      ${
        entrees.length
          ? `<div class="grille-aa">${entrees.map(carte).join('')}</div>`
          : '<p class="aide">Aucun cas pour l’instant : le diaporama affichera un message d’attente sur le site.</p>'
      }`,
  });
}

module.exports = { gabarit, pageConnexion, pageEdition, pageGalerie, pageJetonExpire, pageListe, pageParametres };
