document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.aa-diaporama[data-aa-total]').forEach(function (diaporama) {
    var diapos = Array.prototype.slice.call(diaporama.querySelectorAll('.aa-diapo'));
    var puces = Array.prototype.slice.call(diaporama.querySelectorAll('.aa-puce'));
    if (diapos.length < 2) return;

    var index = 0;

    function afficher(nouvelIndex) {
      index = (nouvelIndex + diapos.length) % diapos.length;
      diapos.forEach(function (diapo, i) {
        var actif = i === index;
        diapo.classList.toggle('aa-active', actif);
        if (actif) diapo.removeAttribute('hidden');
        else diapo.setAttribute('hidden', '');
      });
      puces.forEach(function (puce, i) {
        puce.classList.toggle('aa-active', i === index);
      });
    }

    var boutonPrec = diaporama.querySelector('.aa-prec');
    var boutonSuiv = diaporama.querySelector('.aa-suiv');
    if (boutonPrec) boutonPrec.addEventListener('click', function () { afficher(index - 1); });
    if (boutonSuiv) boutonSuiv.addEventListener('click', function () { afficher(index + 1); });
    puces.forEach(function (puce, i) {
      puce.addEventListener('click', function () { afficher(i); });
    });
  });
});
