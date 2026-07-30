'use client';

import { reviewsApi } from '../lib/api.js';

const STORAGE_KEY = 'yoha_order_reviews';

export async function saveReview(review) {
  try {
    const resp = await reviewsApi.create({
      order_id: review.orderId,
      customer_name: review.customerName,
      restaurant_name: review.restaurantName,
      courier_name: review.courierName,
      rating: review.rating,
      comment: review.comment,
    });
    const apiReview = {
      id: resp.id,
      orderId: review.orderId,
      createdAt: new Date(resp.created_at).getTime(),
      rating: resp.rating,
      comment: resp.comment,
      customerName: review.customerName,
      customerPhone: review.customerPhone,
      customerEmail: review.customerEmail,
      restaurantName: review.restaurantName,
      courierName: review.courierName,
    };
    const current = getStoredReviews();
    const updated = [apiReview, ...current.filter(r => r.orderId !== review.orderId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('yoha_reviews_updated'));
    return updated;
  } catch (e) {
    console.error('Error saving review:', e);
  }
}

export function getStoredReviews() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function fetchReviewsFromApi(params = {}) {
  try {
    const resp = await reviewsApi.list(params);
    return resp.results.map((r) => ({
      id: String(r.id),
      orderId: r.order_id,
      createdAt: new Date(r.created_at).getTime(),
      rating: r.rating,
      comment: r.comment,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email,
      restaurantName: r.restaurant_name,
      courierName: r.courier_name,
    }));
  } catch { return []; }
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
