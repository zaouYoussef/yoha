self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    var data = event.data.json();
  } catch (_) {
    return;
  }

  var payloadData = data.data || {};
  var isOffer = data.tag === "yoha-offer" || payloadData.type === "promo_offer";
  var title = data.title || (isOffer ? "Offre YoHa" : "YoHa - Nouvelle Commande");
  var body = data.body || (isOffer ? "Une offre t'attend sur YoHa." : "Une nouvelle commande nécessite votre attention !");
  var tag = data.tag
    || (isOffer
      ? "yoha-offer"
      : "yoha-order-" + (payloadData.orderId ? payloadData.orderId : Date.now()));
  var icon = "/logo.png";
  var actionTitle = isOffer ? "Voir l'offre" : "Voir la commande";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: icon,
      tag: tag,
      renotify: true,
      requireInteraction: !isOffer,
      vibrate: isOffer ? [200, 100, 200] : [500, 250, 500, 250, 500, 250, 500],
      data: payloadData,
      actions: [
        { action: "open", title: actionTitle }
      ]
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var data = event.notification.data || {};
  var tag = event.notification.tag || "";

  var isClient = tag.indexOf("yoha-client-") === 0;
  var isOffer = tag === "yoha-offer" || data.type === "promo_offer";
  var orderId = isClient && data.orderId
    ? data.orderId
    : (data.orderId || (tag.replace("yoha-client-", "") || null));

  var url = data.url
    ? data.url
    : isOffer
      ? "/browse"
      : isClient && orderId
        ? "/order/" + orderId
        : "/delivery";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) === 0 && "focus" in client) {
          if ("navigate" in client && url) {
            try {
              client.navigate(self.location.origin + url);
            } catch (_) { /* ignore */ }
          }
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
