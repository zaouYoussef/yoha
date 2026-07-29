'use client';

const STORAGE_KEY = 'yoha_order_reviews';

export const INITIAL_REVIEWS = [
  {
    id: 'rev-101',
    orderId: 'YH-8921',
    createdAt: Date.now() - 1000 * 60 * 45,
    rating: 5,
    comment: "Livré ultra rapidement aux urgences CHU Tanger. Repas bien chaud et livreur Yacine très courtois !",
    customerName: "Salma M.",
    restaurantName: "Burger House",
    courierName: "Yacine, livreur",
  },
  {
    id: 'rev-102',
    orderId: 'YH-8918',
    createdAt: Date.now() - 1000 * 60 * 180,
    rating: 5,
    comment: "Service parfait au pavillon FMPT. Emballage soigneux.",
    customerName: "Amine K.",
    restaurantName: "Pizza Napoli",
    courierName: "Karim, livreur",
  },
  {
    id: 'rev-103',
    orderId: 'YH-8910',
    createdAt: Date.now() - 1000 * 60 * 360,
    rating: 4,
    comment: "Très bonne paella, arrivée en 24 minutes chrono.",
    customerName: "Dr. Othmane B.",
    restaurantName: "Le Chef Tanger",
    courierName: "Yacine, livreur",
  }
];

export function getStoredReviews() {
  if (typeof window === 'undefined') return INITIAL_REVIEWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    }
    return JSON.parse(raw);
  } catch (_) {
    return INITIAL_REVIEWS;
  }
}

export function saveReview(review) {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredReviews();
    const updated = [review, ...current.filter(r => r.orderId !== review.orderId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('yoha_reviews_updated'));
    return updated;
  } catch (e) {
    console.error('Error saving review:', e);
  }
}

export function deleteReview(reviewId) {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredReviews();
    const updated = current.filter(r => r.id !== reviewId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('yoha_reviews_updated'));
    return updated;
  } catch (e) {
    console.error('Error deleting review:', e);
  }
}
