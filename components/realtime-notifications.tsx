"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getVapidPublicKey, savePushSubscription } from "@/app/actions/web-push";
import { urlBase64ToUint8Array } from "@/lib/utils/web-push";
import { toast } from "sonner";

const PUSH_SYNC_SESSION_KEY = "rucoach-push-synced-v2";
const PUSH_PROMPT_DISMISSED_KEY = "rucoach-push-prompt-dismissed-v1";

async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing?.active) return existing;

    const swUrl =
      process.env.NODE_ENV === "development" ? "/push-sw.js" : "/sw.js";
    try {
      const reg = await navigator.serviceWorker.register(swUrl, { scope: "/" });
      if (reg.active) return reg;
    } catch {
      const fallbackReg = await navigator.serviceWorker.register(
        "/push-sw.js",
        { scope: "/" },
      );
      if (fallbackReg.active) return fallbackReg;
    }

    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function syncCurrentPushSubscription(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return false;
  }

  try {
    const vapidKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || (await getVapidPublicKey());
    if (!vapidKey) return false;

    const registration = await ensureServiceWorkerRegistration();
    if (!registration) return false;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription && Notification.permission === "granted") {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    if (subscription) {
      const res = await savePushSubscription(subscription.toJSON());
      if (res.success) {
        try {
          sessionStorage.setItem(PUSH_SYNC_SESSION_KEY, "1");
        } catch {}
        return true;
      }
    }
  } catch {
    // Silencioso si el navegador no soporta Push en este contexto
  }
  return false;
}

export function RealtimeNotifications({ role }: { role: "client" | "admin" }) {
  const router = useRouter();
  const pathname = usePathname();
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const senderNamesRef = useRef<Map<string, string>>(new Map());
  const toastCountRef = useRef<Map<string, number>>(new Map());
  const mountedAtIsoRef = useRef<string>(new Date().toISOString());

  // 0. Al abrir el chat, limpiar las notificaciones de mensajes del sistema (como WhatsApp)
  useEffect(() => {
    if (!pathname?.includes("/messages")) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const clearChatNotifications = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.getNotifications())
        .then((list) =>
          list?.forEach((n) => {
            if (n.tag?.startsWith("msg-")) n.close();
          }),
        )
        .catch(() => {});
    };

    clearChatNotifications();
    document.addEventListener("visibilitychange", clearChatNotifications);
    return () =>
      document.removeEventListener("visibilitychange", clearChatNotifications);
  }, [pathname]);

  // 1. Auto-sincronizar suscripción Web Push (Android + iOS 16.4+ PWA + Desktop)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    if (Notification.permission === "granted") {
      const alreadySynced = sessionStorage.getItem(PUSH_SYNC_SESSION_KEY);
      if (!alreadySynced) {
        void syncCurrentPushSubscription();
      }
      return;
    }

    if (Notification.permission === "default") {
      const dismissed = localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY);
      if (dismissed) return;

      const timer = setTimeout(() => {
        toast("Activa las notificaciones en tiempo real", {
          id: "rucoach-enable-push-prompt",
          description:
            role === "admin"
              ? "Recibe avisos al instante cuando tus asesorados entrenen o te escriban."
              : "Recibe avisos al instante cuando tu coach actualice tu rutina o te escriba.",
          duration: 12000,
          action: {
            label: "Activar",
            onClick: async () => {
              try {
                const perm = await Notification.requestPermission();
                if (perm === "granted") {
                  const ok = await syncCurrentPushSubscription();
                  if (ok) {
                    toast.success("¡Notificaciones en tiempo real activadas!");
                  }
                } else {
                  localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
                }
              } catch {
                toast.info(
                  "Puedes activarlas en cualquier momento desde tu Perfil.",
                );
              }
            },
          },
          cancel: {
            label: "Después",
            onClick: () => {
              try {
                localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
              } catch {}
            },
          },
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [role]);

  // 2. Canal Supabase Realtime autenticado + Broadcast + Sondeo ligero de respaldo
  useEffect(() => {
    const supabase = createClient();
    let pgChannel: ReturnType<typeof supabase.channel> | null = null;
    let broadcastChannel: ReturnType<typeof supabase.channel> | null = null;
    let pollInterval: number | null = null;
    let isMounted = true;

    const resolveSenderName = async (fromUserId?: string): Promise<string> => {
      const fallback = role === "admin" ? "Un asesorado" : "Tu coach";
      if (!fromUserId) return fallback;
      const cached = senderNamesRef.current.get(fromUserId);
      if (cached) return cached;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", fromUserId)
          .maybeSingle();
        const name = data?.full_name?.trim() || fallback;
        senderNamesRef.current.set(fromUserId, name);
        return name;
      } catch {
        return fallback;
      }
    };

    const handleIncomingMessage = async (newMsg: {
      id?: string;
      from_user_id?: string;
      to_user_id?: string;
      content?: string;
      created_at?: string;
    }) => {
      if (!newMsg?.id || notifiedIdsRef.current.has(newMsg.id)) return;
      notifiedIdsRef.current.add(newMsg.id);

      const isOnMessagesRoute = window.location.pathname.includes("/messages");
      const isHidden = document.visibilityState !== "visible";

      // Cuando la app está en segundo plano, la notificación del sistema la
      // envía Web Push (con apilado tipo WhatsApp). Aquí solo se atiende el
      // caso "app abierta en otra pantalla" con un aviso discreto dentro de la app.
      if (isHidden || isOnMessagesRoute) return;

      const senderName = await resolveSenderName(newMsg.from_user_id);
      const bodyText =
        newMsg.content && newMsg.content.length > 90
          ? `${newMsg.content.slice(0, 90)}…`
          : newMsg.content || "Te envió un mensaje.";
      const targetUrl =
        role === "admin"
          ? `/admin/messages?clientId=${newMsg.from_user_id}`
          : "/client/messages";

      // Un solo toast por persona: si escribe varias veces seguidas se actualiza
      // el contador en lugar de apilar avisos repetidos.
      const key = newMsg.from_user_id || "chat";
      const count = (toastCountRef.current.get(key) ?? 0) + 1;
      toastCountRef.current.set(key, count);

      toast(count > 1 ? `${senderName} · ${count} mensajes nuevos` : senderName, {
        id: `chat-toast-${key}`,
        description: bodyText,
        duration: 6000,
        onDismiss: () => toastCountRef.current.delete(key),
        onAutoClose: () => toastCountRef.current.delete(key),
        action: {
          label: "Responder",
          onClick: () => {
            toastCountRef.current.delete(key);
            router.push(targetUrl);
          },
        },
      });
    };

    const setup = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!isMounted || !user) return;

      // CRÍTICO: autenticar el socket de Supabase Realtime antes de suscribirse a tablas con RLS
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      pgChannel = supabase
        .channel(`global-pg-messages:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `to_user_id=eq.${user.id}`,
          },
          (payload) => {
            const m = payload.new as {
              id?: string;
              from_user_id?: string;
              to_user_id?: string;
              content?: string;
              created_at?: string;
            };
            if (!m || m.from_user_id === user.id) return;
            handleIncomingMessage(m);
          },
        )
        .subscribe();

      broadcastChannel = supabase
        .channel(`inbox-notify:${user.id}`)
        .on("broadcast", { event: "new_message" }, ({ payload }) => {
          const m = payload as {
            id?: string;
            from_user_id?: string;
            to_user_id?: string;
            content?: string;
            created_at?: string;
          };
          if (!m || m.from_user_id === user.id) return;
          handleIncomingMessage(m);
        })
        .subscribe();

      // Respaldo de sondeo cada 5s para redes móviles que bloquean WebSockets
      const checkRecentUnread = async () => {
        if (!isMounted) return;
        const { data: rows } = await supabase
          .from("messages")
          .select("id, from_user_id, to_user_id, content, created_at")
          .eq("to_user_id", user.id)
          .eq("is_read", false)
          .gt("created_at", mountedAtIsoRef.current)
          .order("created_at", { ascending: true })
          .limit(5);

        if (!rows?.length) return;
        for (const r of rows) {
          if (r.created_at && r.created_at > mountedAtIsoRef.current) {
            mountedAtIsoRef.current = r.created_at;
          }
          handleIncomingMessage(r);
        }
      };

      pollInterval = window.setInterval(() => {
        void checkRecentUnread();
      }, 5000);
    };

    void setup();

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    return () => {
      isMounted = false;
      authSub.unsubscribe();
      if (pollInterval) window.clearInterval(pollInterval);
      if (pgChannel) void supabase.removeChannel(pgChannel);
      if (broadcastChannel) void supabase.removeChannel(broadcastChannel);
    };
  }, [role, router]);

  return null;
}

