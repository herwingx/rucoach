/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  CacheFirst,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const r2ExerciseMediaCache = {
  matcher({ url }: { url: URL }) {
    return url.hostname.endsWith(".r2.dev");
  },
  handler: new CacheFirst({
    cacheName: "r2-exercise-media",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [r2ExerciseMediaCache, ...defaultCache],
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

// Web Push Notifications logic (compatible con Android, iOS 16.4+ PWA, Windows, macOS y Linux)
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

  const baseTitle = data.title || "RU Coach";
  const targetUrl = data.data?.url || data.url || "/";
  const isChatMessage =
    Boolean(data.tag?.startsWith("msg-")) || targetUrl.includes("/messages");
  const incomingBody =
    data.body || "Tienes una nueva actualización de tu entrenamiento.";

  const baseOptions: NotificationOptions & {
    vibrate?: number[];
    renotify?: boolean;
    timestamp?: number;
  } = {
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
  };

  /**
   * Estilo WhatsApp: varios mensajes seguidos de la misma persona se apilan en
   * UNA sola notificación ("Rodrigo (3 mensajes)") con las últimas líneas,
   * en lugar de que cada mensaje reemplace al anterior.
   */
  const buildNotification = async (): Promise<{
    title: string;
    options: NotificationOptions & { renotify?: boolean; vibrate?: number[] };
  }> => {
    if (!isChatMessage || !data.tag) {
      return {
        title: baseTitle,
        options: {
          ...baseOptions,
          body: incomingBody,
          ...(data.tag ? { tag: data.tag, renotify: true } : {}),
          data: { url: targetUrl },
        },
      };
    }

    const previous = await self.registration.getNotifications({
      tag: data.tag,
    });
    const prevMessages: string[] = Array.isArray(previous[0]?.data?.messages)
      ? previous[0].data.messages
      : [];
    const messages = [...prevMessages, incomingBody].slice(-5);
    const count = (Number(previous[0]?.data?.count) || 0) + 1;

    return {
      title: count > 1 ? `${baseTitle} (${count} mensajes)` : baseTitle,
      options: {
        ...baseOptions,
        body: messages.join("\n"),
        tag: data.tag,
        renotify: true,
        data: { url: targetUrl, messages, count },
      },
    };
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        for (const client of windowClients) {
          client.postMessage({
            type: "CHAT_NEW_MESSAGE",
            payload: data,
          });
        }

        const hasVisibleClient = windowClients.some(
          (c) =>
            c.focused ||
            (c as WindowClient & { visibilityState?: string })
              .visibilityState === "visible",
        );

        // Si el usuario tiene la app abierta en primer plano y es un mensaje de chat,
        // la app ya muestra el mensaje en vivo o el toast interno sin duplicar notificación del SO.
        if (hasVisibleClient && isChatMessage) {
          return;
        }

        const { title, options } = await buildNotification();
        return self.registration.showNotification(title, options);
      }),
  );
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
