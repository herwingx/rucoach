#!/usr/bin/env npx tsx
/**
 * enrich-exercises-from-opengym.ts
 * ────────────────────────────────
 * Enriches RU Coach's `exercises` table with openGym metadata:
 * - `muscle_weights` (precise anatomical load percentage)
 * - `description` (biomechanical cues & movement description)
 * - `default_increment_kg` (smart weight increment based on equipment)
 *
 * Generates `supabase/enrich_exercises.sql` which can be executed directly
 * in Supabase SQL Editor.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const OPEN_GYM_DIR = join(process.cwd(), '../open-gym')
const MUSCLE_MAP_PATH = join(OPEN_GYM_DIR, 'frontend/src/lib/exercise-muscle-map.json')
const CATALOGUE_PATH = join(OPEN_GYM_DIR, 'catalogue/exercises')
const OUTPUT_SQL_PATH = join(process.cwd(), 'supabase/enrich_exercises.sql')

function getIncrementForEquipment(eq?: string): number {
  if (!eq) return 2.5
  const norm = eq.toLowerCase()
  if (norm.includes('barbell') || norm.includes('barra')) return 2.5
  if (norm.includes('dumbbell') || norm.includes('mancuerna')) return 2.0
  if (norm.includes('kettlebell')) return 2.0
  if (norm.includes('cable') || norm.includes('polea')) return 2.5
  if (norm.includes('smith') || norm.includes('multipower')) return 2.5
  if (norm.includes('body weight') || norm.includes('corporal')) return 0
  return 2.5
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''")
}

async function run() {
  console.log('🔍 Reading openGym metadata...')

  if (!existsSync(MUSCLE_MAP_PATH)) {
    console.error(`❌ Could not find ${MUSCLE_MAP_PATH}`)
    process.exit(1)
  }

  const rawMap = readFileSync(MUSCLE_MAP_PATH, 'utf-8')
  const muscleMap = JSON.parse(rawMap) as Record<string, any>

  const sqlStatements: string[] = [
    '-- Enrichment of exercises with openGym muscle weights, descriptions and increments',
    'BEGIN;',
  ]

  let count = 0

  if (existsSync(CATALOGUE_PATH)) {
    const files = readdirSync(CATALOGUE_PATH).filter((f) => f.endsWith('.json'))

    for (const file of files) {
      const id = file.replace('.json', '')
      const content = JSON.parse(readFileSync(join(CATALOGUE_PATH, file), 'utf-8'))
      const meta = muscleMap[id]

      const muscleWeights = meta?.muscleWeights || null
      const desc = content.description ? escapeSqlString(content.description) : null
      const increment = getIncrementForEquipment(content.equipment)

      const updates: string[] = []
      if (muscleWeights) {
        updates.push(`muscle_weights = '${JSON.stringify(muscleWeights)}'::jsonb`)
      }
      if (desc) {
        updates.push(`description = '${desc}'`)
      }
      updates.push(`default_increment_kg = ${increment}`)

      if (updates.length > 0) {
        sqlStatements.push(
          `UPDATE public.exercises SET ${updates.join(', ')} WHERE id = '${id}';`,
        )
        count++
      }
    }
  }

  sqlStatements.push('COMMIT;')

  writeFileSync(OUTPUT_SQL_PATH, sqlStatements.join('\n'), 'utf-8')
  console.log(`✅ Generated ${OUTPUT_SQL_PATH} with ${count} exercise updates!`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

