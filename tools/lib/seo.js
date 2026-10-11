'use strict';

/**
 * Métadonnées de référencement d'une page. Elles sont déjà soignées dans les
 * fichiers d'origine (canonical, JSON-LD Physician) : on les conserve telles
 * quelles pour que la régénération ne dégrade pas le positionnement.
 */
function extractSeo($) {
  const meta = (name) => $(`meta[name="${name}"]`).attr('content') || '';
  const og = (prop) => $(`meta[property="${prop}"]`).attr('content') || '';

  const jsonLd = $('script[type="application/ld+json"]')
    .map((i, el) => {
      const raw = $(el).html();
      try {
        return JSON.parse(raw);
      } catch {
        return { _invalide: raw };
      }
    })
    .get();

  return {
    title: $('title').text().trim(),
    description: meta('description'),
    keywords: meta('keywords'),
    robots: meta('robots') || 'index, follow',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    lang: $('html').attr('lang') || 'fr',
    openGraph: {
      title: og('og:title'),
      description: og('og:description'),
      image: og('og:image'),
      type: og('og:type'),
    },
    jsonLd,
  };
}

/** Polices et feuilles externes référencées par la page. */
function extractExternalAssets($) {
  return $('link[rel="stylesheet"], link[rel="preconnect"]')
    .map((i, el) => ({ rel: $(el).attr('rel'), href: $(el).attr('href') }))
    .get()
    .filter((l) => l.href && l.href.startsWith('http'));
}

module.exports = { extractSeo, extractExternalAssets };
