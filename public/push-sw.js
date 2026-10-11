self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "RU Coach";
  const targetUrl = (data.data && data.data.url) || data.url || "/";
  const isChatMessage =
    Boolean(data.tag && String(data.tag).startsWith("msg-")) ||
    targetUrl.includes("/messages");

  const options = {
    body: data.body || "Tienes una nueva notificación en RU Coach.",
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    ...(data.tag ? { tag: data.tag, renotify: true } : {}),
    vibrate: [100, 50, 100],
    data: { url: targetUrl },
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          windowClients[i].postMessage({
            type: "CHAT_NEW_MESSAGE",
            payload: data,
          });
        }

        const hasVisibleClient = windowClients.some(
          (c) => c.focused || c.visibilityState === "visible",
        );

        if (hasVisibleClient && isChatMessage) {
          return;
        }

        return self.registration.showNotification(title, options);
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || "/";
  const targetHref = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === targetHref && "focus" in client) {
            return client.focus();
          }
        }
        if (windowClients.length > 0 && "focus" in windowClients[0]) {
          const client = windowClients[0];
          return client.navigate(targetHref).then((c) => (c || client).focus());
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetHref);
        }
      }),
  );
});

