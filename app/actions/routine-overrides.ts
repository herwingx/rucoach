"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/push";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ExerciseOverride {
  id: string;
  client_routine_id: string;
  original_routine_exercise_id: number;
  replacement_exercise_id: string;
  reason: string | null;
  changed_by: "client" | "coach";
  notified_coach: boolean;
  created_at: string;
}

export interface PainReportRecord {
  id: string;
  client_id: string;
  body_region: string;
  severity: number;
  notes: string | null;
  is_active: boolean;
  reported_at: string;
  resolved_at?: string | null;
}

const PAIN_REGION_LABELS: Record<string, string> = {
  hombro: "Hombro",
  codo: "Codo",
  muñeca: "Muñeca",
  espalda_baja: "Espalda baja",
  rodilla: "Rodilla",
  cadera: "Cadera",
  tobillo: "Tobillo",
  cuello: "Cuello",
  otro: "Otra zona",
};

function formatPainRegionLabel(region: string): string {
  return PAIN_REGION_LABELS[region] ?? region.replace(/_/g, " ");
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: overrides de un client_routine
// ─────────────────────────────────────────────────────────────────────────────
export async function getClientRoutineOverrides(
  clientRoutineId: string,
): Promise<ExerciseOverride[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("client_exercise_overrides")
    .select("*")
    .eq("client_routine_id", clientRoutineId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ExerciseOverride[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE: cliente cambia un ejercicio
// ─────────────────────────────────────────────────────────────────────────────
export async function swapExerciseForClient(input: {
  clientRoutineId: string;
  originalRoutineExerciseId: number;
  replacementExerciseId: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();

  // Verificar que el cliente es dueño de esta client_routine
  const { data: cr } = await supabase
    .from("client_routines")
    .select("id, client_id, routine_id")
    .eq("id", input.clientRoutineId)
    .single();

  if (!cr) return { success: false, error: "Rutina no encontrada" };

  const { data: clientRow } = await supabase
    .from("clients")
    .select("id, user_id, coach_id, full_name")
    .eq("id", cr.client_id)
    .single();

  if (clientRow?.user_id !== user.id) {
    return { success: false, error: "No autorizado" };
  }

  // Obtener info de los ejercicios para el mensaje
  const { data: origEx } = await supabase
    .from("routine_exercises")
    .select("id, exercises(name, name_es), routine_day_id, routine_days(day_number, day_name)")
    .eq("id", input.originalRoutineExerciseId)
    .single();

  const { data: newEx } = await supabase
    .from("exercises")
    .select("id, name, name_es")
    .eq("id", input.replacementExerciseId)
    .single();

  // Upsert del override (UNIQUE por client_routine + original_exercise)
  const { error } = await supabase
    .from("client_exercise_overrides")
    .upsert(
      {
        client_routine_id: input.clientRoutineId,
        original_routine_exercise_id: input.originalRoutineExerciseId,
        replacement_exercise_id: input.replacementExerciseId,
        reason: input.reason ?? null,
        changed_by: "client",
        notified_coach: false,
      },
      { onConflict: "client_routine_id,original_routine_exercise_id" },
    );

  if (error) return { success: false, error: error.message };

  // Notificar al coach vía mensaje automático en el chat + Push
  try {
    const origExData = origEx?.exercises as { name?: string; name_es?: string } | null;
    const rdData = origEx?.routine_days as { day_number?: number; day_name?: string } | null;

    const origName = origExData?.name_es || origExData?.name || "Ejercicio";
    const newName =
      (newEx as { name?: string; name_es?: string } | null)?.name_es ||
      (newEx as { name?: string; name_es?: string } | null)?.name ||
      "Ejercicio alternativo";
    const dayLabel = rdData?.day_name
      ? `Día ${rdData.day_number} (${rdData.day_name})`
      : `Día ${rdData?.day_number ?? "?"}`;

    const reasonText = input.reason ? ` Motivo: "${input.reason}".` : "";
    const messageContent = `📋 He cambiado **${origName}** por **${newName}** en ${dayLabel} de mi rutina.${reasonText} Por favor revisa si está bien.`;

    if (clientRow?.coach_id) {
      await supabase.from("messages").insert({
        from_user_id: user.id,
        to_user_id: clientRow.coach_id,
        content: messageContent,
      });

      await supabase
        .from("client_exercise_overrides")
        .update({ notified_coach: true })
        .eq("client_routine_id", input.clientRoutineId)
        .eq("original_routine_exercise_id", input.originalRoutineExerciseId);

      await notifyUser(clientRow.coach_id, {
        title: `🔄 Cambio de ejercicio · ${clientRow.full_name || "Asesorado"}`,
        body: `Cambió ${origName} por ${newName} (${dayLabel}).${reasonText}`,
        url: `/admin/clients/${clientRow.id}`,
        tag: `override-${clientRow.id}`,
      });
    }
  } catch (notifyErr) {
    console.warn("No se pudo notificar al coach:", notifyErr);
  }

  revalidatePath("/client/routines");
  revalidatePath("/client/workout");
  revalidatePath(`/admin/clients/${cr.client_id}`);

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE: coach cambia un ejercicio para un cliente específico
// ─────────────────────────────────────────────────────────────────────────────
export async function swapExerciseByCoach(input: {
  clientRoutineId: string;
  originalRoutineExerciseId: number;
  replacementExerciseId: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();

  // Verificar que es admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Solo admins pueden hacer cambios de coach" };
  }

  const { error } = await supabase
    .from("client_exercise_overrides")
    .upsert(
      {
        client_routine_id: input.clientRoutineId,
        original_routine_exercise_id: input.originalRoutineExerciseId,
        replacement_exercise_id: input.replacementExerciseId,
        reason: input.reason ?? null,
        changed_by: "coach",
        notified_coach: true,
      },
      { onConflict: "client_routine_id,original_routine_exercise_id" },
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/client/routines");

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE: revertir un override (coach o cliente)
// ─────────────────────────────────────────────────────────────────────────────
export async function revertExerciseOverride(
  overrideId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_exercise_overrides")
    .delete()
    .eq("id", overrideId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/client/routines");
  revalidatePath("/client/workout");

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAIN REPORTS: crear y resolver reportes de dolor/lesión con aviso al Coach
// ─────────────────────────────────────────────────────────────────────────────
export async function reportClientPain(input: {
  clientId: string;
  bodyRegion: string;
  severity: number;
  notes?: string;
}): Promise<{
  success: boolean;
  report?: PainReportRecord;
  error?: string;
}> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const supabase = await createClient();
  const { data: clientRow } = await supabase
    .from("clients")
    .select("id, user_id, coach_id, full_name")
    .eq("id", input.clientId)
    .single();

  if (!clientRow || clientRow.user_id !== user.id) {
    return { success: false, error: "No autorizado" };
  }

  const severity = Math.max(0, Math.min(10, Math.round(input.severity || 0)));
  const cleanNotes = input.notes?.trim() || null;

  const { data: inserted, error } = await supabase
    .from("client_pain_reports")
    .insert({
      client_id: input.clientId,
      body_region: input.bodyRegion,
      severity,
      notes: cleanNotes,
      is_active: true,
    })
    .select("id, client_id, body_region, severity, notes, is_active, reported_at")
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message || "No se pudo guardar el reporte" };
  }

  // Notificar al coach por chat y Push
  try {
    if (clientRow.coach_id) {
      const regionLabel = formatPainRegionLabel(input.bodyRegion);
      const notesSnippet = cleanNotes ? ` Nota: "${cleanNotes}".` : "";
      const chatText = `⚠️ Reporté una molestia/dolor en **${regionLabel}** (severidad ${severity}/10).${notesSnippet}`;

      await supabase.from("messages").insert({
        from_user_id: user.id,
        to_user_id: clientRow.coach_id,
        content: chatText,
      });

      await notifyUser(clientRow.coach_id, {
        title: `⚠️ Molestia reportada · ${clientRow.full_name || "Asesorado"}`,
        body: `${regionLabel} (${severity}/10).${notesSnippet}`,
        url: `/admin/clients/${clientRow.id}`,
        tag: `pain-${clientRow.id}`,
      });
    }
  } catch (notifyErr) {
    console.warn("No se pudo notificar reporte de dolor al coach:", notifyErr);
  }

  revalidatePath("/client/profile");
  revalidatePath(`/admin/clients/${input.clientId}`);

  return { success: true, report: inserted as PainReportRecord };
}

export async function resolveClientPainReport(
  reportId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "No autenticado" };

  const admin = createAdminClient();
  const { data: report } = await admin
    .from("client_pain_reports")
    .select("id, client_id, clients(user_id, coach_id)")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return { success: false, error: "Reporte no encontrado" };

  const clientInfo = report.clients as {
    user_id?: string | null;
    coach_id?: string | null;
  } | null;

  const isOwnerClient = clientInfo?.user_id === user.id;
  const isAssignedCoach = clientInfo?.coach_id === user.id;

  if (!isOwnerClient && !isAssignedCoach) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return { success: false, error: "No autorizado" };
    }
  }

  const { error } = await admin
    .from("client_pain_reports")
    .update({
      is_active: false,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/client/profile");
  revalidatePath(`/admin/clients/${report.client_id}`);
  revalidatePath("/admin/clients");

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: aplicar overrides sobre una lista de ejercicios de rutina
// Usado por getNextWorkoutDay y la vista de rutinas del cliente
// ─────────────────────────────────────────────────────────────────────────────
export async function applyExerciseOverrides<
  T extends { id: number; exercise_id?: string; exercises?: unknown },
>(
  clientRoutineId: string,
  routineExercises: T[],
  supabaseClient?: Awaited<ReturnType<typeof createClient>>,
): Promise<T[]> {
  const supabase = supabaseClient ?? (await createClient());

  const { data: overrides } = await supabase
    .from("client_exercise_overrides")
    .select(
      "original_routine_exercise_id, replacement_exercise_id, reason, exercises!replacement_exercise_id(*)",
    )
    .eq("client_routine_id", clientRoutineId);

  if (!overrides?.length) return routineExercises;

  const overrideMap = new Map(
    overrides.map((o) => [
      o.original_routine_exercise_id,
      {
        replacement_exercise_id: o.replacement_exercise_id,
        reason: o.reason ?? null,
        exercises: o.exercises,
      },
    ]),
  );

  return routineExercises.map((ex) => {
    const ov = overrideMap.get(ex.id);
    if (!ov?.exercises) return ex;
    return {
      ...ex,
      original_exercise_id: ex.exercise_id,
      exercise_id: ov.replacement_exercise_id,
      exercises: ov.exercises,
      is_overridden: true,
      override_reason: ov.reason,
    };
  });
}
