"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendManualInvitationEmail } from "@/lib/email";

// Generate a random invitation code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new invitation code (admin only)
export async function createInvitationCode(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Solo administradores pueden crear codigos" };
  }

  const email = formData.get("email") as string | null;
  const expiresInDays =
    parseInt(formData.get("expires_in_days") as string) || 30;
  const forRole = (formData.get("for_role") as string) || "client";
  const roleToCreate = forRole === "admin" ? "admin" : "client";

  const adminClient = createAdminClient();

  if (email?.trim()) {
    const trimmedEmail = email.trim();

    // 1. Verificar si el correo ya tiene una cuenta
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", trimmedEmail)
      .single();

    if (existingProfile) {
      return { error: "Este correo ya tiene una cuenta registrada." };
    }

    // 2. Verificar si ya tiene un código de invitación pendiente
    const { data: existingCode } = await adminClient
      .from("invitation_codes")
      .select("id")
      .eq("email", trimmedEmail)
      .eq("is_active", true)
      .eq("times_used", 0)
      .gte("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (existingCode) {
      return { error: "Ya existe una invitación pendiente enviada a este correo." };
    }
  }

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { error } = await supabase.from("invitation_codes").insert({
    code,
    created_by: user.id,
    email: email?.trim() || null,
    expires_at: expiresAt.toISOString(),
    max_uses: 1,
    times_used: 0,
    is_active: true,
    for_role: roleToCreate,
  });

  if (error) {
    return { error: error.message };
  }

  let emailSent = false;
  if (email?.trim()) {
    const result = await sendManualInvitationEmail({
      to: email.trim(),
      code,
      forRole: roleToCreate,
    });
    emailSent = result.success;
    if (!result.success) {
      console.warn("No se pudo enviar el correo de invitación:", result.error);
    }
  }

  revalidatePath("/admin/invitations");
  return { success: true, code, emailSent };
}

// Validate an invitation code (for signup)
export async function validateInvitationCode(code: string) {
  const supabase = await createClient();

  const { data: invitation, error } = await supabase
    .from("invitation_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !invitation) {
    return { valid: false, error: "Codigo de invitacion invalido" };
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: "Codigo de invitacion expirado" };
  }

  // Check if max uses reached
  if (invitation.times_used >= invitation.max_uses) {
    return { valid: false, error: "Codigo de invitacion ya fue usado" };
  }

  return { valid: true, invitation };
}

// Mark invitation code as used
export async function useInvitationCode(
  code: string,
  userId: string,
  role?: "admin" | "client",
) {
  const normalizedCode = code.toUpperCase().trim();

  // ADMIN_SETUP_CODE: primer usuario que lo usa se convierte en admin
  const adminSetupCode = process.env.ADMIN_SETUP_CODE?.toUpperCase().trim();
  if (adminSetupCode && normalizedCode === adminSetupCode) {
    if (role === "admin") {
      const adminClient = createAdminClient();
      try {
        await adminClient
          .from("profiles")
          .update({ role: "admin" })
          .eq("id", userId);
      } catch {
        // Asegurar role=admin; ignorar si falla
      }
      try {
        await adminClient.from("gym_settings").insert({
          admin_id: userId,
          gym_name: "RU Coach",
          phone: "9612378473",
          setup_completed: false,
        });
      } catch {
        // gym_settings puede fallar si ya existe; no bloquear el registro
      }
    }
    return { success: true };
  }

  // 1. RPC atómica: usar admin para que funcione sin sesión (email confirm pendiente)
  const admin = createAdminClient();
  const { data: atomicResult, error: atomicError } = await admin.rpc(
    "use_invitation_code_atomic",
    {
      code_text: normalizedCode,
      user_id_val: userId,
    },
  );

  if (atomicError || !atomicResult || !atomicResult.success) {
    return {
      error:
        atomicResult?.error ||
        atomicError?.message ||
        "Error al procesar el código",
    };
  }

  const {
    client_id: clientId,
    created_by: coachId,
    for_role: forRole,
  } = atomicResult;

  // 2. Si el código es para admin, actualizar el perfil a admin
  if (forRole === "admin") {
    try {
      await admin.from("profiles").update({ role: "admin" }).eq("id", userId);
    } catch {
      // Ignorar si falla
    }
  }

  // 3. Vincular el perfil con el coach que lo invitó
  // Nota: La columna 'invited_by' no existe en 'profiles',
  // la vinculación principal es a través de la tabla 'clients'.

  // 4. Gestión del registro en la tabla 'clients'
  if (clientId) {
    // Escenario A: El código ya estaba vinculado a un cliente pre-creado (ej. Eduardo)
    const { data: existingClient } = await admin
      .from("clients")
      .select("status")
      .eq("id", clientId)
      .single();

    const newStatus =
      existingClient?.status === "suspended" ? "suspended" : "pending_payment";

    const { error } = await admin
      .from("clients")
      .update({
        user_id: userId,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    if (error) {
      console.error("[useInvitationCode] Error vinculando cliente:", error);
    }
  } else if (forRole === "client") {
    // Escenario B: Código genérico -> Crear registro automático en 'clients'
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();
    await admin.from("clients").insert({
      id: crypto.randomUUID(), // <--- FIX: Missing ID
      user_id: userId,
      coach_id: coachId,
      full_name: profile?.full_name || "Nuevo Asesorado",
      phone: "",
      email: profile?.email || "",
      status: "pending_payment",
    });
  }

  return { success: true };
}

// Deactivate an invitation code
export async function deactivateInvitationCode(codeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase
    .from("invitation_codes")
    .update({ is_active: false })
    .eq("id", codeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/invitations");
  return { success: true };
}

// Delete an invitation code (admin only, only if unused and inactive)
export async function deleteInvitationCode(codeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Solo administradores pueden eliminar codigos" };
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("invitation_codes")
    .select("times_used, is_active")
    .eq("id", codeId)
    .single();

  if (invitationError || !invitation) {
    return { error: "Código no encontrado" };
  }

  if (invitation.is_active && invitation.times_used === 0) {
    return { error: "Primero desactiva el código antes de eliminarlo" };
  }

  const { error } = await supabase
    .from("invitation_codes")
    .delete()
    .eq("id", codeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/invitations");
  return { success: true };
}

// Get all invitation codes for admin
export async function getInvitationCodes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitation_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, codes: [] };
  return { codes: data };
}

// Update user subscription status (admin only)
export async function updateUserSubscription(
  userId: string,
  status: "active" | "expired" | "suspended" | "trial",
  endsAt?: Date,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Solo administradores pueden modificar suscripciones" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_status: status,
      subscription_ends_at: endsAt?.toISOString() || null,
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  // Nota: La sincronización con la tabla 'clients' se maneja automáticamente
  // mediante un trigger de base de datos (tr_sync_profile_status_to_client).

  revalidatePath("/admin/clients");
  revalidatePath("/admin/users");
  return { success: true };
}
