"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function updateGymSettings(data: {
  gym_name?: string;
  phone?: string;
  schedule?: string;
  currency?: string;
  timezone?: string;
}) {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      success: false,
      error: "Solo administradores pueden editar la configuración",
    };
  }

  const { data: existing } = await supabase
    .from("gym_settings")
    .select("id")
    .eq("admin_id", user.id)
    .single();

  const payload = {
    gym_name: data.gym_name ?? undefined,
    phone: data.phone ?? undefined,
    schedule: data.schedule ?? undefined,
    currency: data.currency ?? undefined,
    timezone: data.timezone ?? undefined,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("gym_settings")
      .update(payload)
      .eq("admin_id", user.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("gym_settings").insert({
      admin_id: user.id,
      ...payload,
    });
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/client/dashboard");
  revalidatePath("/suspended");

  return { success: true };
}

export interface MembershipPlanRecord {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  description: string | null;
  is_active: boolean;
  coach_id?: string | null;
}

export async function upsertMembershipPlan(input: {
  id?: string;
  name: string;
  duration_days: number;
  price: number;
  description?: string | null;
  is_active?: boolean;
}): Promise<{
  success: boolean;
  plan?: MembershipPlanRecord;
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      success: false,
      error: "Solo administradores pueden gestionar planes",
    };
  }

  const cleanName = input.name.trim();
  if (!cleanName) {
    return { success: false, error: "El nombre del plan es obligatorio" };
  }

  const durationDays = Math.max(1, Math.round(Number(input.duration_days) || 30));
  const price = Math.max(0, Number(input.price) || 0);
  const description = input.description?.trim() || null;

  if (input.id) {
    const { data, error } = await supabase
      .from("membership_plans")
      .update({
        name: cleanName,
        duration_days: durationDays,
        price,
        description,
        is_active: input.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select("id, name, duration_days, price, description, is_active, coach_id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Error al actualizar plan" };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin/payments/new");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/clients");

    return {
      success: true,
      plan: {
        ...data,
        price: Number(data.price),
        is_active: Boolean(data.is_active),
      },
    };
  }

  const slug = cleanName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const planId = `plan-${slug || "asesoria"}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await supabase
    .from("membership_plans")
    .insert({
      id: planId,
      name: cleanName,
      duration_days: durationDays,
      price,
      description,
      is_active: input.is_active ?? true,
      coach_id: user.id,
    })
    .select("id, name, duration_days, price, description, is_active, coach_id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Error al crear plan" };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/payments/new");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/clients");

  return {
    success: true,
    plan: {
      ...data,
      price: Number(data.price),
      is_active: Boolean(data.is_active),
    },
  };
}

export async function toggleMembershipPlanActive(
  id: string,
  is_active: boolean,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  const { error } = await supabase
    .from("membership_plans")
    .update({
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/admin/payments/new");
  revalidatePath("/admin/payments");

  return { success: true };
}

export async function deleteMembershipPlan(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  if (!id) {
    return { success: false, error: "ID de plan inválido" };
  }

  const { error } = await supabase
    .from("membership_plans")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error:
          "Este plan está asociado a pagos existentes. Desactívalo en lugar de eliminarlo.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/payments/new");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/clients");

  return { success: true };
}
