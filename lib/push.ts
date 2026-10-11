import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Envío de notificaciones Web Push (solo servidor).
 *
 * Vive fuera de `app/actions/*` a propósito: todo lo exportado desde un archivo
 * `"use server"` se convierte en un endpoint invocable desde el navegador, lo
 * que permitiría a cualquier usuario autenticado enviar notificaciones a
 * cualquier otro `userId`. Este módulo solo puede importarse desde código de
 * servidor (Server Actions, Route Handlers, Server Components).
 */

export interface PushPayload {
  title: string;
  body: string;
  /** Ruta interna a abrir al tocar la notificación (p. ej. `/admin/clients/123`). */
  url?: string;
  /** Agrupa notificaciones del mismo tipo para que la nueva reemplace a la anterior. */
  tag?: string;
}

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:soporte@rucoach.app";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let vapidReady = false;

function ensureVapid(): boolean {
  if (vapidReady) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidReady = true;
  } catch (err) {
    console.warn("[push] Configuración VAPID inválida", err);
  }
  return vapidReady;
}

/**
 * Envía una notificación a todos los dispositivos suscritos de un usuario.
 * Nunca lanza: los fallos de push no deben romper el flujo principal.
 * Las suscripciones caducadas (404/410) se eliminan automáticamente.
 */
export async function notifyUser(
  userId: string | null | undefined,
  payload: PushPayload,
): Promise<{ success: boolean; delivered: number }> {
  if (!userId || !ensureVapid()) return { success: false, delivered: 0 };

  try {
    const admin = createAdminClient();
    const { data: subscriptions, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (error) throw error;
    if (!subscriptions?.length) return { success: false, delivered: 0 };

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      tag: payload.tag,
      data: { url: payload.url ?? "/" },
    });

    const expiredIds: string[] = [];
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
            { TTL: 86400, urgency: "high" },
          )
          .catch((err: { statusCode?: number }) => {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              expiredIds.push(sub.id);
            } else {
              console.error("[push] Error enviando notificación", err);
            }
            throw err;
          }),
      ),
    );

    if (expiredIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", expiredIds);
    }

    const delivered = results.filter((r) => r.status === "fulfilled").length;
    return { success: delivered > 0, delivered };
  } catch (err) {
    console.error("[push] notifyUser", err);
    return { success: false, delivered: 0 };
  }
}

