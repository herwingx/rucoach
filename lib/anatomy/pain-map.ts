/**
 * Clinical Pain & Injury Mapping for RU Coach
 * Allows clients and coaches to log musculoskeletal discomfort and flags contraindicated exercises.
 */

import { type MuscleSlug } from './muscles'
import type { Exercise } from '@/lib/types'

export type PainSeverity = 'mild' | 'moderate' | 'severe'

export type PainZone =
  | MuscleSlug
  | 'knees'
  | 'ankles'
  | 'elbows'
  | 'wrists'
  | 'neck'

export interface PainEntry {
  zone: PainZone
  severity: PainSeverity
  notes?: string
  reportedAt?: string // ISO date
}

export const PAIN_ZONE_LABELS_ES: Record<PainZone, string> = {
  knees: 'Rodillas (articulación)',
  ankles: 'Tobillos',
  elbows: 'Codos / Tendón tríceps',
  wrists: 'Muñecas',
  neck: 'Cuello / Cervicales',
  trapezius: 'Trapecios',
  deltoids: 'Hombros / Manguito rotador',
  chest: 'Pectorales',
  'upper-back': 'Espalda alta / Dorsales',
  serratus: 'Serratos / Costillas',
  biceps: 'Bíceps / Tendón bicipital',
  triceps: 'Tríceps',
  forearm: 'Antebrazos',
  abs: 'Abdomen / Pubalgia',
  obliques: 'Oblicuos',
  'lower-back': 'Lumbar / Espalda baja',
  gluteal: 'Glúteos / Piramidal',
  quadriceps: 'Cuádriceps',
  hamstring: 'Isquios / Femorales',
  adductors: 'Aductores',
  'hip-flexors': 'Flexores de cadera / Psoas',
  calves: 'Gemelos / Tendón de Aquiles',
  tibialis: 'Tibial / Periostitis',
}

/**
 * Checks if an exercise impacts any active pain zones of the client
 */
export function checkExerciseContraindications(
  exercise: Partial<Exercise>,
  activePainEntries: PainEntry[],
): {
  hasContraindication: boolean
  highestSeverity?: PainSeverity
  conflictingZones: PainZone[]
} {
  if (!activePainEntries || activePainEntries.length === 0) {
    return { hasContraindication: false, conflictingZones: [] }
  }

  const conflicting: PainZone[] = []
  let highestSev: PainSeverity = 'mild'

  const painMap = new Map<PainZone, PainSeverity>()
  for (const p of activePainEntries) {
    painMap.set(p.zone, p.severity)
  }

  const primary = (exercise.primary_muscle || '').toLowerCase()
  const bodyPart = (exercise.body_part || exercise.body_parts?.[0] || '').toLowerCase()

  // Knee impact
  if (painMap.has('knees')) {
    if (
      primary.includes('quad') ||
      primary.includes('cuadri') ||
      bodyPart.includes('leg') ||
      bodyPart.includes('pierna')
    ) {
      conflicting.push('knees')
    }
  }

  // Lower back impact
  if (painMap.has('lower-back')) {
    if (
      primary.includes('spine') ||
      primary.includes('lower-back') ||
      primary.includes('lumbar') ||
      exercise.name?.toLowerCase().includes('deadlift') ||
      exercise.name?.toLowerCase().includes('squat')
    ) {
      conflicting.push('lower-back')
    }
  }

  // Shoulder / Deltoids impact
  if (painMap.has('deltoids')) {
    if (
      primary.includes('delt') ||
      primary.includes('shoulder') ||
      primary.includes('hombro') ||
      exercise.name?.toLowerCase().includes('overhead press') ||
      exercise.name?.toLowerCase().includes('bench press')
    ) {
      conflicting.push('deltoids')
    }
  }

  // Wrists
  if (painMap.has('wrists')) {
    if (
      primary.includes('forearm') ||
      exercise.name?.toLowerCase().includes('curl') ||
      exercise.name?.toLowerCase().includes('press')
    ) {
      conflicting.push('wrists')
    }
  }

  // Direct muscle matches
  for (const zone of painMap.keys()) {
    if (primary.includes(zone)) {
      if (!conflicting.includes(zone)) conflicting.push(zone)
    }
  }

  if (conflicting.length > 0) {
    for (const z of conflicting) {
      const s = painMap.get(z)
      if (s === 'severe') highestSev = 'severe'
      else if (s === 'moderate' && highestSev !== 'severe') highestSev = 'moderate'
    }
    return {
      hasContraindication: true,
      highestSeverity: highestSev,
      conflictingZones: conflicting,
    }
  }

  return { hasContraindication: false, conflictingZones: [] }
}
