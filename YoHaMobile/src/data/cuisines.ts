export type Cuisine = { id: string; label: string; emoji: string };

export const CUISINES: Cuisine[] = [
  { id: 'all', label: 'Tout', emoji: '✨' },
  { id: 'promos', label: 'Offres 🔥', emoji: '🎁' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'tacos', label: 'Tacos', emoji: '🌮' },
  { id: 'kebab', label: 'Kebab', emoji: '🥙' },
  { id: 'burger', label: 'Burger', emoji: '🍔' },
  { id: 'healthy', label: 'Healthy', emoji: '🥗' },
  { id: 'asian', label: 'Asiatique', emoji: '🍜' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣' },
  { id: 'medical', label: 'MedEat', emoji: '🏥' },
  { id: 'pharmacy', label: 'Pharmacies', emoji: '💊' },
  { id: 'parapharmacy', label: 'Parapharma', emoji: '🌿' },
  { id: 'supermarket', label: 'Supermarché', emoji: '🛒' },
  { id: 'shop', label: 'Magasins', emoji: '🛍️' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
  { id: 'drinks', label: 'Boissons', emoji: '🥤' },
];

export type CategoryBanner = {
  id: string;
  label: string;
  emoji: string;
  colors: [string, string];
};

export const CATEGORIES_BANNERS: CategoryBanner[] = [
  { label: 'Offres 🔥', emoji: '🎁', id: 'promos', colors: ['#f43f5e', '#e11d48'] },
  { label: 'Pizza', emoji: '🍕', id: 'pizza', colors: ['#fb923c', '#ef4444'] },
  { label: 'Tacos', emoji: '🌮', id: 'tacos', colors: ['#facc15', '#d97706'] },
  { label: 'Kebab', emoji: '🥙', id: 'kebab', colors: ['#a8a29e', '#c2410c'] },
  { label: 'Healthy', emoji: '🥗', id: 'healthy', colors: ['#34d399', '#14b8a6'] },
  { label: 'Burger', emoji: '🍔', id: 'burger', colors: ['#fbbf24', '#f97316'] },
  { label: 'Sushi', emoji: '🍣', id: 'sushi', colors: ['#fb7185', '#ec4899'] },
  { label: 'Asiatique', emoji: '🍜', id: 'asian', colors: ['#e879f9', '#a855f7'] },
  { label: 'MedEat', emoji: '🏥', id: 'medical', colors: ['#38bdf8', '#6366f1'] },
  { label: 'Parapharma', emoji: '🌿', id: 'parapharmacy', colors: ['#059669', '#10b981'] },
  { label: 'Supermarché', emoji: '🛒', id: 'supermarket', colors: ['#4f46e5', '#6366f1'] },
  { label: 'Magasins', emoji: '🛍️', id: 'shop', colors: ['#db2777', '#f43f5e'] },
  { label: 'Dessert', emoji: '🍰', id: 'dessert', colors: ['#f472b6', '#d946ef'] },
  { label: 'Boissons', emoji: '🥤', id: 'drinks', colors: ['#22d3ee', '#3b82f6'] },
];

export const TESTIMONIALS = [
  { name: 'Sara M.', text: 'Livré en 18 min au CHU — incroyable !', stars: 5 },
  { name: 'Youssef K.', text: 'Commande invité sans stress, parfait.', stars: 5 },
  { name: 'Inès B.', text: 'Meilleure app food de Tanger campus.', stars: 5 },
];

export const SOCIAL_PROOF_MESSAGES = [
  { emoji: '🍕', text: 'Karim vient de commander une pizza' },
  { emoji: '🌮', text: '3 tacos commandés il y a 2 min' },
  { emoji: '🛵', text: '12 livraisons en cours sur le campus' },
  { emoji: '⭐', text: 'Nouveau : -20% sur Sushi Zen' },
];
