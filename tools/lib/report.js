'use strict';

/** Texte brut d'un fragment HTML, pour comparer les volumes. */
function textOf(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Longueur de texte portée par une page extraite, blocs compris. */
function textLength(page) {
  let n = textOf(page.hero.title).length + textOf(page.hero.lead).length + textOf(page.hero.eyebrow).length;
  for (const btn of page.hero.buttons || []) n += textOf(btn.label).length;
  for (const crumb of page.hero.breadcrumb || []) n += textOf(crumb.label).length;

  for (const section of page.sections) {
    n += textOf(section.title).length + textOf(section.eyebrow).length;
    for (const block of section.blocks) n += blockTextLength(block);
  }
  return n;
}

function blockTextLength(block) {
  let n = textOf(block.html).length + textOf(block.title).length;
  for (const enfant of block.blocks || []) n += blockTextLength(enfant);
  for (const item of block.items || []) {
    if (typeof item === 'string') {
      n += textOf(item).length;
      continue;
    }
    n += ['question', 'answer', 'name', 'address', 'phone', 'linkLabel', 'title', 'html', 'badge', 'extra']
      .reduce((acc, key) => acc + textOf(item[key]).length, 0);
  }
  for (const row of Array.isArray(block.rows) ? block.rows : []) {
    for (const cell of Array.isArray(row) ? row : [row]) n += textOf(cell).length;
  }
  for (const cell of Array.isArray(block.head) ? block.head : []) n += textOf(cell).length;
  return n;
}

/** Part des blocs en champs structurés, par opposition au HTML libre. */
function blockStats(page) {
  const counts = {};
  let brut = 0;
  let total = 0;
  for (const section of page.sections) {
    for (const block of section.blocks) {
      counts[block.type] = (counts[block.type] || 0) + 1;
      total += 1;
      if (block.type === 'html') brut += blockTextLength(block);
    }
  }
  return { counts, brut, total };
}

module.exports = { textOf, textLength, blockTextLength, blockStats };
