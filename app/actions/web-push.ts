"use server";

import { createClient } from "@/lib/supabase/server";

export interface PushSubscriptionInput {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
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

    await supabase
      .from("push_subscriptions")
      .delete()
      .match({ user_id: user.id, endpoint });

    const { error: insertError } = await supabase
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

    const { error } = await supabase
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
