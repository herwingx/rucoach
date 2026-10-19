"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendClientInvitationEmail, sendManualInvitationEmail } from "@/lib/email";

// Generate a random invitation code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export type CreateInvitationResponse = {
  success: boolean;
  code?: string;
  emailSent?: boolean;
  error?: string;
  invitation?: {
    id: string;
    code: string;
    email: string | null;
    for_role: string;
    expires_at: string | null;
    times_used: number;
    max_uses: number;
    is_active: boolean;
    created_at: string | null;
    created_by: string | null;
    linked_client_id: string | null;
    linked_name: string | null;
    linked_phone: string | null;
  };
};

// Create a new invitation code (admin only)
export async function createInvitationCode(
  formData: FormData,
): Promise<CreateInvitationResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { success: false, error: "Solo administradores pueden crear códigos" };
  }

  const email = formData.get("email") as string | null;
  const expiresInDays =
    parseInt(formData.get("expires_in_days") as string) || 30;
  const rawMaxUses = parseInt(formData.get("max_uses") as string) || 1;
  const maxUses = email?.trim() ? 1 : Math.min(100, Math.max(1, rawMaxUses));
  const forRole = (formData.get("for_role") as string) || "client";
  const roleToCreate = forRole === "admin" ? "admin" : "client";

  const adminClient = createAdminClient();

  if (email?.trim()) {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Verificar si el correo ya tiene una cuenta
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existingProfile) {
      return { success: false, error: "Este correo ya tiene una cuenta registrada." };
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
      return { success: false, error: "Ya existe una invitación pendiente enviada a este correo." };
    }
  }

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { data: inserted, error } = await adminClient
    .from("invitation_codes")
    .insert({
      code,
      created_by: user.id,
      email: email?.trim() || null,
      expires_at: expiresAt.toISOString(),
      max_uses: maxUses,
      times_used: 0,
      is_active: true,
      for_role: roleToCreate,
    })
    .select(
      "id, code, email, for_role, expires_at, times_used, max_uses, is_active, created_at, created_by, client_id, used_by_user_id",
    )
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message || "Error al generar el código" };
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
  return {
    success: true,
    code,
    emailSent,
    invitation: {
      id: inserted.id,
      code: inserted.code,
      email: inserted.email,
      for_role: inserted.for_role ?? roleToCreate,
      expires_at: inserted.expires_at,
      times_used: inserted.times_used ?? 0,
      max_uses: inserted.max_uses ?? 1,
      is_active: inserted.is_active ?? true,
      created_at: inserted.created_at ?? null,
      created_by: inserted.created_by ?? user.id,
      linked_client_id: null,
      linked_name: null,
      linked_phone: null,
    },
  };
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
    return { valid: false, error: "Código de invitación inválido" };
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: "Código de invitación expirado" };
  }

  // Check if max uses reached
  if (invitation.times_used >= invitation.max_uses) {
    return { valid: false, error: "Código de invitación ya fue usado" };
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

  // 4. Gestión del registro en la tabla 'clients'
  if (clientId) {
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
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();
    await admin.from("clients").insert({
      id: crypto.randomUUID(),
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

// Reactivate an inactive or expired invitation code (+30 days if expired)
export async function reactivateInvitationCode(codeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Solo administradores pueden reactivar códigos" };
  }

  const { data: invitation, error: fetchError } = await supabase
    .from("invitation_codes")
    .select("id, times_used, max_uses, expires_at")
    .eq("id", codeId)
    .single();

  if (fetchError || !invitation) {
    return { error: "Código no encontrado" };
  }

  if ((invitation.times_used ?? 0) >= (invitation.max_uses ?? 1)) {
    return { error: "Este código ya alcanzó su límite de usos" };
  }

  const isExpired =
    invitation.expires_at && new Date(invitation.expires_at) < new Date();
  const nextExpiresAt = isExpired
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : invitation.expires_at;

  const { error } = await supabase
    .from("invitation_codes")
    .update({
      is_active: true,
      expires_at: nextExpiresAt,
    })
    .eq("id", codeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/invitations");
  return { success: true, expires_at: nextExpiresAt };
}

// Resend invitation email for an existing invitation code
export async function resendInvitationCodeEmail(codeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Solo administradores pueden reenviar invitaciones" };
  }

  const { data: invitation, error: fetchError } = await supabase
    .from("invitation_codes")
    .select("id, code, email, for_role, client_id")
    .eq("id", codeId)
    .single();

  if (fetchError || !invitation) {
    return { error: "Código de invitación no encontrado" };
  }

  if (!invitation.email?.trim()) {
    return { error: "Este código no tiene un correo electrónico asociado" };
  }

  const targetEmail = invitation.email.trim();

  if (invitation.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("full_name")
      .eq("id", invitation.client_id)
      .maybeSingle();

    const res = await sendClientInvitationEmail({
      to: targetEmail,
      clientName: client?.full_name || "Atleta",
      code: invitation.code,
    });

    if (!res.success) {
      return { error: "No se pudo reenviar el correo. Verifica la configuración de Resend." };
    }
    return { success: true };
  }

  const res = await sendManualInvitationEmail({
    to: targetEmail,
    code: invitation.code,
    forRole: invitation.for_role === "admin" ? "admin" : "client",
  });

  if (!res.success) {
    return { error: "No se pudo reenviar el correo. Verifica la configuración de Resend." };
  }

  return { success: true };
}

// Delete an invitation code (admin only, 1-step delete)
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
    return { error: "Solo administradores pueden eliminar códigos" };
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
