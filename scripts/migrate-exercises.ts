#!/usr/bin/env npx tsx
/**
 * migrate-exercises.ts
 * ────────────────────
 * Migra los 1,324 ejercicios (con traducciones _es y URLs de Cloudflare R2)
 * de un proyecto Supabase a otro en un solo comando.
 *
 * CÓMO USAR:
 * ──────────
 * 1. Agrega estas 2 líneas a tu .env.local (o pásalas por terminal):
 *
 *      TARGET_SUPABASE_URL=https://<nuevo_proyecto>.supabase.co
 *      TARGET_SERVICE_ROLE_KEY=<service_role_o_secret_key_del_nuevo>
 *
 * 2. Ejecuta:
 *      npx tsx scripts/migrate-exercises.ts
 *
 * NOTA: Antes de ejecutar este script, asegúrate de haber ejecutado
 *       supabase/supabase_schema_dump.sql en el SQL Editor del proyecto destino.
 */

import "dotenv/config";
import { writeFile } from "fs/promises";

type ExerciseRow = Record<string, unknown> & {
  id: string;
  name?: string | null;
  name_es?: string | null;
};

// ── Config ──────────────────────────────────────────────────────────────────
// ORIGEN: tu proyecto actual (lee de .env / .env.local automáticamente)
const SOURCE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SOURCE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// DESTINO: el proyecto nuevo
const TARGET_URL = process.env.TARGET_SUPABASE_URL ?? "";
const TARGET_KEY =
  process.env.TARGET_SERVICE_ROLE_KEY ||
  process.env.TARGET_SUPABASE_SECRET_KEY ||
  "";

// ── Validación ──────────────────────────────────────────────────────────────
if (!SOURCE_URL || !SOURCE_KEY) {
  console.error(
    "❌  No se encontró NEXT_PUBLIC_SUPABASE_URL o clave de Supabase en tu .env / .env.local",
  );
  process.exit(1);
}

if (!TARGET_URL || !TARGET_KEY) {
  console.error("");
  console.error("❌  Faltan las variables del proyecto DESTINO:");
  console.error("");
  console.error("   Agrega estas 2 líneas a tu .env.local:");
  console.error("   ┌──────────────────────────────────────────────────────────┐");
  console.error("   │ TARGET_SUPABASE_URL=https://<nuevo>.supabase.co         │");
  console.error("   │ TARGET_SERVICE_ROLE_KEY=<service_role_key_del_nuevo>     │");
  console.error("   └──────────────────────────────────────────────────────────┘");
  console.error("");
  process.exit(1);
}

if (SOURCE_URL === TARGET_URL) {
  console.error(
    "❌  SOURCE y TARGET son el mismo proyecto. Verifica TARGET_SUPABASE_URL.",
  );
  process.exit(1);
}

const BATCH_SIZE = 200;

// ── Helpers ─────────────────────────────────────────────────────────────────
async function supabaseRest<T = unknown>(
  url: string,
  key: string,
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T | null> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: opts.method ?? "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: opts.headers?.Prefer ?? "return=minimal",
      ...opts.headers,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST ${res.status}: ${text}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("json")) return (await res.json()) as T;
  return null;
}

// ── 1. EXPORT ───────────────────────────────────────────────────────────────
async function fetchAllExercises(): Promise<ExerciseRow[]> {
  console.log("📥  Descargando ejercicios del proyecto origen...");
  const all: ExerciseRow[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const rows = await supabaseRest<ExerciseRow[]>(
      SOURCE_URL,
      SOURCE_KEY,
      `exercises?select=*&offset=${offset}&limit=${limit}`,
      {
        headers: { Prefer: "count=exact" },
      },
    );
    if (!Array.isArray(rows) || rows.length === 0) break;
    all.push(...rows);
    if (rows.length < limit) break;
    offset += limit;
  }
  console.log(`   ✅ ${all.length} ejercicios descargados.`);
  return all;
}

// ── 2. IMPORT (UPSERT) ─────────────────────────────────────────────────────
async function upsertExercises(exercises: ExerciseRow[]) {
  console.log(
    `📤  Subiendo ${exercises.length} ejercicios al proyecto destino...`,
  );
  const total = exercises.length;
  let uploaded = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);
    await supabaseRest(TARGET_URL, TARGET_KEY, "exercises", {
      method: "POST",
      body: batch,
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });
    uploaded += batch.length;
    const pct = Math.round((uploaded / total) * 100);
    process.stdout.write(`   ⏳ ${uploaded}/${total} (${pct}%)\r`);
  }
  console.log(`\n   ✅ ${uploaded} ejercicios importados correctamente.`);
}

// ── 3. BACKUP LOCAL ─────────────────────────────────────────────────────────
async function saveLocalBackup(exercises: ExerciseRow[]) {
  const path = "scripts/exercises-full-backup.json";
  await writeFile(path, JSON.stringify(exercises, null, 2), "utf8");
  console.log(`💾  Backup local guardado en ${path}`);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("  Migración de Ejercicios (EN + ES)               ");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Origen:  ${SOURCE_URL}`);
  console.log(`  Destino: ${TARGET_URL}`);
  console.log("");

  const exercises = await fetchAllExercises();
  if (exercises.length === 0) {
    console.log("⚠️  No se encontraron ejercicios en el origen. Abortando.");
    process.exit(0);
  }

  const withEs = exercises.filter((e) => Boolean(e.name_es));
  console.log(
    `   📊 ${withEs.length}/${exercises.length} tienen traducción al español`,
  );

  await saveLocalBackup(exercises);
  await upsertExercises(exercises);

  console.log("");
  console.log("🎉  ¡Migración completada!");
  console.log(
    "   Los 1,324 ejercicios (EN + ES) están en el proyecto destino.",
  );
  console.log("");
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("💥  Error:", message);
  if (message.includes("404") || message.includes("relation")) {
    console.error("");
    console.error(
      "   💡 ¿Ya ejecutaste supabase/supabase_schema_dump.sql en el SQL Editor?",
    );
    console.error(
      "      Las tablas deben existir antes de cargar los datos.",
    );
  }
  process.exit(1);
});

