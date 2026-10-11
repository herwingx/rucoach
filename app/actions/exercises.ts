"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getUserProfile } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

function emptyToNull(s: string | null | undefined) {
  const t = s?.trim();
  return t ? t : null;
}

const MUSCLE_TO_BODY_PART_ES: Record<string, string[]> = {
  chest: ["pecho"],
  back: ["espalda"],
  shoulders: ["hombros"],
  biceps: ["brazos"],
  triceps: ["brazos"],
  forearms: ["brazos"],
  quadriceps: ["piernas"],
  hamstrings: ["piernas"],
  glutes: ["piernas"],
  calves: ["pantorrillas"],
  abs: ["abdomen"],
  cardio: ["cardio"],
  full_body: ["cuerpo completo"],
};

const MUSCLE_TO_ES: Record<string, string> = {
  chest: "pecho",
  back: "espalda",
  shoulders: "hombros",
  biceps: "bíceps",
  triceps: "tríceps",
  forearms: "antebrazos",
  quadriceps: "cuádriceps",
  hamstrings: "isquiotibiales",
  glutes: "glúteos",
  calves: "pantorrillas",
  abs: "abdomen",
  cardio: "cardio",
  full_body: "cuerpo completo",
};

const EQUIPMENT_TO_ES: Record<string, string> = {
  barbell: "barra",
  dumbbell: "mancuerna",
  machine: "máquina",
  cable: "polea",
  bodyweight: "peso corporal",
  kettlebell: "pesa rusa",
  bands: "bandas",
  other: "otro",
};

function translateMuscle(m: string): string {
  const key = m.trim().toLowerCase();
  return MUSCLE_TO_ES[key] ?? m.trim();
}

function translateEquipment(eq: string | null): string | null {
  if (!eq) return null;
  const key = eq.trim().toLowerCase();
  return EQUIPMENT_TO_ES[key] ?? eq.trim();
}

export async function createAdminExercise(formData: FormData) {
  const user = await getAuthUser();
  const profile = await getUserProfile();

  if (!user || profile?.role !== "admin") {
    throw new Error("No autorizado");
  }

  const name = emptyToNull(formData.get("name") as string);
  if (!name) {
    throw new Error("El nombre es obligatorio");
  }

  const primaryMuscle =
    emptyToNull(formData.get("primaryMuscle") as string) ?? "full_body";
  const secondaryMuscle = emptyToNull(
    formData.get("secondaryMuscle") as string,
  );
  const exerciseType =
    emptyToNull(formData.get("exerciseType") as string) ?? "strength";
  const equipment = emptyToNull(formData.get("equipment") as string);
  const techniqueNotes = emptyToNull(formData.get("techniqueNotes") as string);

  const bodyPartsEs = MUSCLE_TO_BODY_PART_ES[primaryMuscle] ?? [
    translateMuscle(primaryMuscle),
  ];
  const targetMusclesEs = [translateMuscle(primaryMuscle)];
  const secondaryMusclesEs = secondaryMuscle
    ? secondaryMuscle
        .split(",")
        .map((s) => translateMuscle(s))
        .filter(Boolean)
    : [];
  const equipmentEs = translateEquipment(equipment);
  const instructionsEs = techniqueNotes
    ? techniqueNotes
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  const supabase = await createClient();

  const row: Record<string, unknown> = {
    id: crypto.randomUUID(),
    name,
    name_es: name,
    primary_muscle: primaryMuscle,
    secondary_muscle: secondaryMuscle,
    exercise_type: exerciseType,
    equipment,
    equipment_es: equipmentEs,
    equipments: equipmentEs ? [equipmentEs] : [],
    body_parts_es: bodyPartsEs,
    target_muscles_es: targetMusclesEs,
    secondary_muscles_es: secondaryMusclesEs,
    instructions_es: instructionsEs,
    technique_notes: techniqueNotes,
    gif_url: emptyToNull(formData.get("gifUrl") as string),
    image_url: emptyToNull(formData.get("imageUrl") as string),
    demo_video_url: emptyToNull(formData.get("demoVideoUrl") as string),
  };

  const { data, error } = await supabase
    .from("exercises")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("createAdminExercise", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/exercises");
  revalidatePath("/admin/exercises/new");
  revalidatePath("/admin/routines/builder");

  return { id: data.id as string };
}

export async function getExercisesForSelector() {
  const supabase = await createClient();

  // Fetch all exercises (handling 1000 row limit)
  let allExercises: any[] = [];
  let from = 0;
  let to = 999;

  while (true) {
    const { data, error } = await supabase
      .from("exercises")
      .select(
        "id, name, name_es, gif_url, body_parts, body_parts_es, target_muscles, target_muscles_es, equipments, primary_muscle, exercise_type, equipment, equipment_es",
      )
      .order("name")
      .range(from, to);

    if (error || !data || data.length === 0) break;
    allExercises = [...allExercises, ...data];
    if (data.length < 1000) break;
    from += 1000;
    to += 1000;
  }

  return allExercises;
}
