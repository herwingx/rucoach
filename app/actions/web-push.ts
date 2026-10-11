"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PushSubscriptionInput {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

let cachedPublicKey: string | null =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;

export async function getVapidPublicKey(): Promise<string | null> {
  if (cachedPublicKey) return cachedPublicKey;
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    cachedPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    return cachedPublicKey;
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("admin_setup")
      .select("admin_email")
      .eq("setup_code", "VAPID_KEYS_V1")
      .maybeSingle();

    if (data?.admin_email && data.admin_email.includes(":")) {
      const [dbPub] = data.admin_email.split(":");
      if (dbPub?.trim()) {
        cachedPublicKey = dbPub.trim();
        return cachedPublicKey;
      }
    }
  } catch {
    // Silencioso si no está disponible
  }

  return null;
}

export async function savePushSubscription(
  subscription: PushSubscriptionInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuario no autenticado." };
    }

    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return { success: false, error: "Suscripción Push incompleta." };
    }

    const admin = createAdminClient();

    await admin
      .from("push_subscriptions")
      .delete()
      .match({ user_id: user.id, endpoint });

    const { error: insertError } = await admin
      .from("push_subscriptions")
      .insert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
      });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al guardar suscripción";
    console.error("Error guardando suscripción push:", error);
    return { success: false, error: message };
  }
}

export async function removePushSubscription(
  endpoint: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuario no autenticado." };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .match({ user_id: user.id, endpoint });

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar suscripción";
    return { success: false, error: message };
  }
}

