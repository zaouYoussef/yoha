import { apiFetch, getTokens } from './api';

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var output = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export async function getVapidPublicKey() {
  var data = await apiFetch('/auth/push/web/vapid-key/', { auth: false });
  return data.publicKey;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] serviceWorker not available');
    return null;
  }
  if (!('PushManager' in window)) {
    console.warn('[Push] PushManager not available');
    return null;
  }
  try {
    var reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('[Push] SW registered', reg);
    return reg;
  } catch (e) {
    console.error('[Push] SW register error', e);
    return null;
  }
}

export async function subscribeWebPush() {
  var tokens = getTokens();
  if (!tokens || !tokens.access) {
    console.warn('[Push] No tokens');
    return null;
  }

  var reg = await registerServiceWorker();
  if (!reg) return null;

  var publicKey = await getVapidPublicKey();
  if (!publicKey) {
    console.warn('[Push] No VAPID public key');
    return null;
  }

  try {
    var sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    console.log('[Push] Subscribed', sub);
  } catch (e) {
    console.error('[Push] subscribe error', e);
    throw e;
  }

  var subscriptionJson = sub.toJSON();
  try {
    await apiFetch('/auth/push/web/subscribe/', {
      method: 'POST',
      body: {
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
      },
    });
    console.log('[Push] Subscription saved on server');
  } catch (e) {
    console.error('[Push] Failed to save subscription on server', e);
    throw e;
  }

  return true;
}

export async function unsubscribeWebPush() {
  var tokens = getTokens();
  if (!tokens || !tokens.access) return;

  try {
    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
    }
  } catch {}

  try {
    await apiFetch('/auth/push/web/unsubscribe/', { method: 'POST' });
  } catch {}
}

export async function isSubscribed() {
  try {
    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
