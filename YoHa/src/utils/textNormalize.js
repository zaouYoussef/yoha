/** Helpers texte compatibles vieux WebViews (sans String.normalize). */

export function stripDiacritics(value) {
  const s = String(value ?? '');
  try {
    if (typeof s.normalize === 'function') {
      return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
  } catch {
    /* ignore */
  }
  return s;
}

export function foldText(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function collapseSpaces(value) {
  const s = String(value ?? '');
  try {
    if (typeof s.normalize === 'function') {
      return s.normalize('NFKC').trim().replace(/\s+/g, ' ');
    }
  } catch {
    /* ignore */
  }
  return s.trim().replace(/\s+/g, ' ');
}
