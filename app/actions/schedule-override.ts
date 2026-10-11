"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export type ScheduleOverrideType =
  | "skip_to_next"     // Adelantar: ir al siguiente día del ciclo
  | "repeat_previous"  // Repetir: hacer el mismo día de ayer
  | "choose_specific"; // Elegir un día específico por ID

export interface ScheduleOverrideInput {
  clientRoutineId: string;
  overrideType: ScheduleOverrideType;
  /** Requerido cuando overrideType = 'choose_specific' */
  specificRoutineDayId?: string;
  reason?: string;
}

/**
 * Permite al cliente desviarse del ciclo secuencial de su rutina.
 * Guarda override_next_day_id en client_routines y notifica al coach.
 *
 * El sistema de getNextWorkoutDay ya es por sesiones completadas
 * (no por fechas), por lo que si el cliente no entrenó ayer, mañana
 * automáticamente le toca el mismo día. Este override sirve para
 * cuando quiere SALTAR o REPETIR un día conscientemente.
 */
export async function setScheduleOverride(
  input: ScheduleOverrideInput,
): Promise<{ success: boolean; dayId?: string; error?: string }> {
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

  // Obtener todos los días de la rutina para calcular siguiente/anterior
  const { data: routineDays } = await supabase
    .from("routine_days")
    .select("id, day_number, day_name, is_rest_day, routine_exercises(id)")
    .eq("routine_id", cr.routine_id)
    .order("day_number", { ascending: true });

  const trainDays = (routineDays ?? []).filter(
    (d) =>
      !d.is_rest_day &&
      Array.isArray(d.routine_exercises) &&
      d.routine_exercises.length > 0,
  );
  if (!trainDays.length) {
    return { success: false, error: "La rutina no tiene días de entrenamiento" };
  }

  // Determinar qué día se está haciendo actualmente (el último completado)
  const { data: lastSession } = await supabase
    .from("workout_sessions")
    .select("routine_day_id")
    .eq("client_id", cr.client_id)
    .eq("status", "completed")
    .not("routine_day_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const dayIdSet = new Set(trainDays.map((d) => d.id));
  const lastDayId = lastSession?.routine_day_id
    ? dayIdSet.has(lastSession.routine_day_id as string)
      ? (lastSession.routine_day_id as string)
      : null
    : null;

  const lastDayIdx = lastDayId
    ? trainDays.findIndex((d) => d.id === lastDayId)
    : -1;

  let targetDayId: string;

  switch (input.overrideType) {
    case "skip_to_next": {
      // Siguiente en el ciclo (o el primero si es el último)
      const nextIdx = (lastDayIdx + 1) % trainDays.length;
      // El "skip_to_next" salta uno más (omite el actual pendiente)
      const skipIdx = (nextIdx + 1) % trainDays.length;
      targetDayId = trainDays[skipIdx].id;
      break;
    }
    case "repeat_previous": {
      // Mismo día que tocaba (el actual no completado = el "next")
      const nextIdx = (lastDayIdx + 1) % trainDays.length;
      targetDayId = trainDays[nextIdx].id;
      // En realidad "repetir el anterior" = usar el último completado
      targetDayId = lastDayId ?? trainDays[0].id;
      break;
    }
    case "choose_specific": {
      if (!input.specificRoutineDayId) {
        return { success: false, error: "Debes especificar el día" };
      }
      if (!dayIdSet.has(input.specificRoutineDayId)) {
        return { success: false, error: "El día no pertenece a esta rutina" };
      }
      targetDayId = input.specificRoutineDayId;
      break;
    }
    default:
      return { success: false, error: "Tipo de override inválido" };
  }

  // Guardar el override en client_routines
  const { error: updateErr } = await supabase
    .from("client_routines")
    .update({ override_next_day_id: targetDayId })
    .eq("id", input.clientRoutineId);

  if (updateErr) return { success: false, error: updateErr.message };

  // Construir mensaje al coach
  try {
    if (clientRow?.coach_id) {
      const targetDay = trainDays.find((d) => d.id === targetDayId);
      const dayLabel = targetDay?.day_name
        ? `Día ${targetDay.day_number} (${targetDay.day_name})`
        : `Día ${targetDay?.day_number ?? "?"}`;

      const typeLabels: Record<ScheduleOverrideType, string> = {
        skip_to_next: "Ha salteado al siguiente día de entrenamiento",
        repeat_previous: "Ha repetido el día anterior",
        choose_specific: "Ha elegido un día específico para su próxima sesión",
      };

      const reasonText = input.reason
        ? ` Motivo: "${input.reason}".`
        : "";

      const messageContent = `📅 ${typeLabels[input.overrideType]} → entrenar **${dayLabel}** en su próxima sesión.${reasonText}`;

      await supabase.from("messages").insert({
        from_user_id: user.id,
        to_user_id: clientRow.coach_id,
        content: messageContent,
      });
    }
  } catch (err) {
    console.warn("No se pudo notificar al coach sobre el cambio de día:", err);
  }

  revalidatePath("/client/routines");
  revalidatePath("/client/workout");

  return { success: true, dayId: targetDayId };
}

/**
 * Limpiar el override después de que el cliente completa la sesión.
 * Llamar desde el action de completar workout.
 */
export async function clearScheduleOverride(
  clientRoutineId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("client_routines")
    .update({ override_next_day_id: null })
    .eq("id", clientRoutineId);
}
