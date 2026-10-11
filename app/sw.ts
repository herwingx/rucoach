/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Web Push Notifications logic (compatible con Android Chrome y iOS 16.4+ Standalone Web Push)
self.addEventListener("push", (event) => {
  let data: {
    title?: string;
    body?: string;
    tag?: string;
    data?: { url?: string };
    url?: string;
  } = {};

  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }

  const title = data.title || "RU Coach";
  const targetUrl = data.data?.url || data.url || "/";
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: data.body || "Tienes una nueva actualización de tu entrenamiento.",
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: { url: targetUrl },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";
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
          return client.navigate(targetHref).then((c) => (c ?? client).focus());
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetHref);
        }
      }),
  );
});
