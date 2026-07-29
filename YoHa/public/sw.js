self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    var data = event.data.json();
  } catch (_) {
    return;
  }

  var title = data.title || "YoHa - Nouvelle Commande 🚀";
  var body = data.body || "Une nouvelle commande nécessite votre attention !";
  var tag = "yoha-order-" + (data.data && data.data.orderId ? data.data.orderId : Date.now());
  var icon = "/logo.png";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: icon,
      tag: tag,
      renotify: true,
      requireInteraction: true,
      vibrate: [500, 250, 500, 250, 500, 250, 500],
      data: data.data || {},
      actions: [
        { action: "open", title: "📱 Voir la commande" }
      ]
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/delivery";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) === 0 && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + url);
      }
    })
  );
});

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", function () {});
