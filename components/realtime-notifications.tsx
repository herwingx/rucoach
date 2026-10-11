"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { savePushSubscription } from "@/app/actions/web-push";
import { urlBase64ToUint8Array } from "@/lib/utils/web-push";
import { toast } from "sonner";

const PUSH_SYNC_SESSION_KEY = "rucoach-push-synced-v1";
const PUSH_PROMPT_DISMISSED_KEY = "rucoach-push-prompt-dismissed-v1";

async function syncCurrentPushSubscription(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return false;
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
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
    // Silencioso en desarrollo o si el SW aún no está activo
  }
  return false;
}

export function RealtimeNotifications({ role }: { role: "client" | "admin" }) {
  const pathname = usePathname();
  const router = useRouter();

  // 1. Auto-sincronizar suscripción Web Push (Android + iOS 16.4+ PWA) y sugerir activación si está en "default"
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

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

  // 2. Canal Supabase Realtime global para avisos instantáneos dentro de la app (iOS / Android / Desktop)
  useEffect(() => {
    const supabase = createClient();
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted || !user) return;

      const channel = supabase
        .channel(`global-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `to_user_id=eq.${user.id}`,
          },
          (payload) => {
            const newMsg = payload.new as {
              id?: string;
              from_user_id?: string;
              content?: string;
            };
            if (!newMsg || newMsg.from_user_id === user.id) return;

            // Si el usuario no está en la vista de mensajes, mostrar aviso interactivo inmediato
            if (! window.location.pathname.includes("/messages")) {
              const targetUrl =
                role === "admin"
                  ? `/admin/messages?clientId=${newMsg.from_user_id}`
                  : "/client/messages";

              toast(
                role === "admin"
                  ? "Nuevo mensaje de asesorado"
                  : "Nuevo mensaje de Rodrigo Urbina",
                {
                  description:
                    newMsg.content && newMsg.content.length > 90
                      ? `${newMsg.content.slice(0, 90)}…`
                      : newMsg.content || "Tienes un nuevo mensaje en el chat.",
                  action: {
                    label: "Responder",
                    onClick: () => router.push(targetUrl),
                  },
                },
              );
            }
          },
        )
        .subscribe();

      activeChannel = channel;
    });

    return () => {
      isMounted = false;
      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
      }
    };
  }, [role, router, pathname]);

  return null;
}

