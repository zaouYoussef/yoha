/**
 * Bio client : retire l'adresse collée en base (« Nom — adresse »).
 * Les livreurs gardent l'adresse via resolveRestaurantDisplayAddress.
 */
export function publicRestaurantBio(description, restaurantName = '') {
  const raw = String(description || '').trim();
  if (!raw) return '';

  let left = raw;
  let right = '';
  if (raw.includes('—')) {
    const i = raw.indexOf('—');
    left = raw.slice(0, i).trim();
    right = raw.slice(i + 1).trim();
  } else if (raw.includes(' - ')) {
    const i = raw.indexOf(' - ');
    left = raw.slice(0, i).trim();
    right = raw.slice(i + 3).trim();
  } else {
    return raw;
  }

  if (!right) return left;

  const looksLikeAddress =
    /\d/.test(right) ||
    /\+|Tanger|Tangier|Morocco|Maroc|Rue\b|Av\.|Avenue|Boulevard|Bd\b|Route\b|Quartier|Résidence|Residence/i.test(
      right,
    );

  if (!looksLikeAddress) return raw;

  const name = String(restaurantName || '').trim().toLowerCase();
  if (!left || (name && left.toLowerCase() === name)) return '';
  return left;
}
