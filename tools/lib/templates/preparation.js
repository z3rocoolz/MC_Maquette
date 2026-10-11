'use strict';
const groups=[
 ['Les informations à réunir',[
  'La lettre du médecin ou du dentiste, si vous avez été adressé.',
  'Les ordonnances en cours et les informations sur vos allergies et vos antécédents.',
  'Les comptes rendus et examens déjà réalisés en lien avec votre demande.'
 ]],
 ['Les questions à préparer',[
  'Ce qui me gêne, depuis quand, et ce que j’attends de la consultation.',
  'Les possibilités, leurs limites et les alternatives, y compris ne pas intervenir.',
  'Les risques, les suites, le coût et les conditions éventuelles de prise en charge.'
 ]],
 ['L’organisation du rendez-vous',[
  'Le lieu exact, la date et les documents administratifs demandés.',
  'Les éventuels besoins d’accessibilité, de compréhension ou d’accompagnement.',
  'Le contact à conserver et la prochaine étape à l’issue de la consultation.'
 ]]
];
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
module.exports=()=>'<section class="consult-checklist" aria-labelledby="preparation-titre"><div class="checklist-heading"><div><p class="eyebrow">À garder avec vous</p><h2 id="preparation-titre">Ma consultation, en pratique.</h2></div><button class="button button-outline" type="button" data-print-checklist hidden>Imprimer ma fiche</button></div><p id="checklist-help">Cochez les repères qui vous sont utiles. Ces choix restent dans cette page : le site ne les enregistre pas et ne les transmet pas. Vous pouvez aussi imprimer la fiche depuis le menu de votre navigateur.</p><p class="checklist-status" data-checklist-status role="status" aria-live="polite" aria-atomic="true"></p>'+groups.map((group,g)=>'<fieldset aria-describedby="checklist-help"><legend>'+escape(group[0])+'</legend>'+group[1].map((label,i)=>'<div class="checklist-item"><input type="checkbox" id="preparation-'+g+'-'+i+'" data-consult-check><label for="preparation-'+g+'-'+i+'">'+escape(label)+'</label></div>').join('')+'</fieldset>').join('')+'<div class="print-notes"><h3>Mes questions personnelles</h3><p>À compléter sur votre exemplaire imprimé.</p><div class="notes-lines" aria-hidden="true"></div></div></section>';
