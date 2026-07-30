import { apiFetch, getTokens } from './api';

let sessionId = null;
let sessionStart = null;
let pageStart = null;
let currentPath = null;
let pendingQueue = [];
let flushTimer = null;

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getSessionId() {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem('yoha-analytics-session');
    if (!sessionId) {
      sessionId = genId();
      sessionStorage.setItem('yoha-analytics-session', sessionId);
    }
  } catch {
    sessionId = genId();
  }
  return sessionId;
}

function getVisitorId() {
  try {
    let vid = localStorage.getItem('yoha-visitor-id');
    if (!vid) {
      vid = genId();
      localStorage.setItem('yoha-visitor-id', vid);
    }
    return vid;
  } catch {
    return getSessionId();
  }
}

function send(events) {
  const tokens = getTokens();
  const headers = { 'Content-Type': 'application/json' };
  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }
  fetch('/api/v1/analytics/track/', {
    method: 'POST',
    headers,
    body: JSON.stringify(events),
  }).catch(() => {});
}

function flush() {
  if (pendingQueue.length === 0) return;
  const batch = pendingQueue.splice(0);
  pendingQueue = [];
  send(...batch);
}

function enqueue(event) {
  pendingQueue.push(event);
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, 2000);
  }
  if (pendingQueue.length >= 10) flush();
}

export function trackEvent(category, opts = {}) {
  if (typeof window === 'undefined') return;
  try {
    enqueue({
      category,
      label: opts.label || '',
      path: opts.path || window.location.pathname,
      referrer: opts.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      metadata: opts.metadata || {},
      duration_ms: opts.duration_ms || null,
      session_id: getSessionId(),
    });
  } catch {}
}

export function trackPageView(path) {
  if (pageStart && currentPath) {
    const duration = Date.now() - pageStart;
    trackEvent('pageview', {
      path: currentPath,
      duration_ms: duration,
    });
  }
  currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  pageStart = Date.now();
}

export function trackClick(label, metadata = {}) {
  trackEvent('click', { label, metadata });
}

export function trackRestaurantView(restaurantName, restaurantId) {
  trackEvent('restaurant_view', {
    label: restaurantName,
    metadata: { restaurantId },
  });
}

export function trackSearch(query) {
  trackEvent('search', { label: query });
}

export function startSession() {
  if (sessionStart) return;
  sessionStart = Date.now();
  trackEvent('session', { label: 'start' });
}

export function endSession() {
  if (!sessionStart) return;
  const duration = Date.now() - sessionStart;
  trackEvent('session', {
    label: 'end',
    duration_ms: duration,
  });
  flush();
  sessionStart = null;
}

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  getSessionId();
  getVisitorId();
  trackPageView(window.location.pathname);
}
