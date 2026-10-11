"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-utils";

export async function addMeasurement(data: {
  weight?: number;
  body_fat_pct?: number;
  waist_cm?: number;
  hip_cm?: number;
  chest_cm?: number;
  arm_cm?: number;
  thigh_cm?: number;
  recorded_at?: string;
}) {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, coach_id")
    .eq("user_id", user.id)
    .single();

  if (!client) return { success: false, error: "Cliente no encontrado" };

  let timeZone = "America/Mexico_City";
  if (client.coach_id) {
    const { data: gymSettings } = await supabase
      .from("gym_settings")
      .select("timezone")
      .eq("admin_id", client.coach_id)
      .single();
    if (gymSettings?.timezone) {
      timeZone = gymSettings.timezone;
    }
  }

  const recordedAtRaw = data.recorded_at;
  // en-CA format returns YYYY-MM-DD
  const recordedAt = recordedAtRaw
    ? recordedAtRaw.slice(0, 10)
    : new Date().toLocaleDateString("en-CA", { timeZone });

  const { error } = await supabase.from("body_measurements").insert({
    id: crypto.randomUUID(),
    client_id: client.id,
    recorded_at: recordedAt,
    weight: data.weight ?? null,
    body_fat_pct: data.body_fat_pct ?? null,
    waist_cm: data.waist_cm ?? null,
    hip_cm: data.hip_cm ?? null,
    chest_cm: data.chest_cm ?? null,
    arm_cm: data.arm_cm ?? null,
    thigh_cm: data.thigh_cm ?? null,
  });

  if (error) return { success: false, error: error.message };

  try {
    const { checkAchievements } = await import("@/lib/gamification");
    await checkAchievements(user.id);
  } catch {}

  revalidatePath("/client/measurements");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/achievements");
  revalidatePath(`/admin/clients/${client.id}`);

  return { success: true };
}

export async function deleteMeasurement(
  measurementId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!measurementId) {
    return { success: false, error: "ID de medición inválido" };
  }

  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) return { success: false, error: "Cliente no encontrado" };

  const { error } = await supabase
    .from("body_measurements")
    .delete()
    .eq("id", measurementId)
    .eq("client_id", client.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/client/measurements");
  revalidatePath("/client/dashboard");
  revalidatePath(`/admin/clients/${client.id}`);

  return { success: true };
}

