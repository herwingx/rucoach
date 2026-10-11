import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Award,
  CalendarDays,
  Dumbbell,
  Flame,
  Medal,
  MessageCircle,
  Ruler,
  Scale,
  ShieldCheck,
  Star,
  Sunrise,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import type { Achievement } from '@/lib/types'
import type { ClientAchievementMetrics } from '@/lib/gamification'

const ICON_BY_KEY: Record<string, LucideIcon> = {
  trophy: Trophy,
  flame: Flame,
  medal: Medal,
  target: Target,
  dumbbell: Dumbbell,
  award: Award,
  star: Star,
  crown: Medal,
  zap: Zap,
  shield: ShieldCheck,
  scale: Scale,
  ruler: Ruler,
  sunrise: Sunrise,
  chat: MessageCircle,
}

export type DifficultyTierId = NonNullable<Achievement['rarity']>

export interface DifficultyTierMeta {
  id: DifficultyTierId
  order: number
  shortLabel: string
  fullLabel: string
  description: string
  gradientClass: string
  badgeClass: string
  medalSurfaceClass: string
}

export const DIFFICULTY_TIERS: Record<DifficultyTierId, DifficultyTierMeta> = {
  common: {
    id: 'common',
    order: 1,
    shortLabel: 'Bronce',
    fullLabel: 'Nivel I · Bronce',
    description: 'Hábitos iniciales y primeras marcas reales',
    gradientClass: 'from-amber-600 to-orange-700',
    badgeClass:
      'border-amber-700/35 bg-amber-500/10 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-300',
    medalSurfaceClass:
      'border-amber-600/45 bg-gradient-to-br from-amber-600/25 via-orange-500/10 to-background text-amber-700 dark:text-amber-400 shadow-md shadow-amber-600/15 ring-1 ring-amber-600/25',
  },
  rare: {
    id: 'rare',
    order: 2,
    shortLabel: 'Plata',
    fullLabel: 'Nivel II · Plata',
    description: 'Constancia probada y fuerza intermedia',
    gradientClass: 'from-sky-400 to-indigo-500',
    badgeClass:
      'border-sky-500/35 bg-sky-500/10 text-sky-700 dark:border-sky-400/35 dark:bg-sky-500/15 dark:text-sky-300',
    medalSurfaceClass:
      'border-sky-400/50 bg-gradient-to-br from-sky-400/25 via-slate-400/10 to-background text-sky-600 dark:text-sky-300 shadow-md shadow-sky-500/15 ring-1 ring-sky-400/30',
  },
  epic: {
    id: 'epic',
    order: 3,
    shortLabel: 'Oro',
    fullLabel: 'Nivel III · Oro',
    description: 'Rendimiento avanzado y disciplina sobresaliente',
    gradientClass: 'from-yellow-400 to-amber-600',
    badgeClass:
      'border-yellow-500/45 bg-yellow-500/15 text-yellow-800 dark:border-yellow-400/45 dark:bg-yellow-500/15 dark:text-yellow-300',
    medalSurfaceClass:
      'border-yellow-500/55 bg-gradient-to-br from-yellow-400/30 via-amber-500/15 to-background text-yellow-700 dark:text-yellow-300 shadow-md shadow-yellow-500/20 ring-1 ring-yellow-500/35',
  },
  legendary: {
    id: 'legendary',
    order: 4,
    shortLabel: 'Élite',
    fullLabel: 'Nivel IV · Élite',
    description: 'Maestría absoluta y marcas de alto rendimiento',
    gradientClass: 'from-violet-500 to-fuchsia-600',
    badgeClass:
      'border-violet-500/45 bg-violet-500/15 text-violet-700 dark:border-violet-400/45 dark:bg-violet-500/20 dark:text-violet-300',
    medalSurfaceClass:
      'border-violet-500/60 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/15 to-background text-violet-700 dark:text-violet-300 shadow-md shadow-violet-500/25 ring-1 ring-violet-500/40',
  },
}

export function achievementDifficultyMeta(
  rarity: Achievement['rarity'] | undefined,
): DifficultyTierMeta {
  return DIFFICULTY_TIERS[rarity ?? 'common'] ?? DIFFICULTY_TIERS.common
}

export function achievementLucideIcon(a: Achievement): LucideIcon {
  const key = (a.icon || '').toLowerCase().trim()
  if (ICON_BY_KEY[key]) return ICON_BY_KEY[key]
  switch (a.requirement_type) {
    case 'sessions':
      return CalendarDays
    case 'streak':
      return Flame
    case 'pr':
      return TrendingUp
    case 'volume':
      return Scale
    case 'level':
      return Activity
    case 'messages':
      return MessageCircle
    case 'early_workouts':
      return Sunrise
    case 'measurement_months':
      return Ruler
    case 'lifetime_volume':
      return Scale
    case 'lift_bench_bw':
    case 'lift_squat_bw15':
    case 'lift_deadlift_bw2':
      return Dumbbell
    default:
      return Trophy
  }
}

export function achievementCategoryLabel(cat: Achievement['category']): string {
  const labels: Record<Achievement['category'], string> = {
    consistency: 'Constancia',
    strength: 'Fuerza y marcas',
    volume: 'Volumen',
    milestone: 'Trayectoria',
    special: 'Hábitos',
  }
  return labels[cat] ?? cat
}

export function achievementRarityColor(rarity: Achievement['rarity'] | undefined): string {
  return achievementDifficultyMeta(rarity).gradientClass
}

export function achievementMilestoneBadgeLabel(rarity: Achievement['rarity'] | undefined): string {
  return achievementDifficultyMeta(rarity).fullLabel
}

function formatRatioMultiplier(percent: number): string {
  const ratio = percent / 100
  return `${ratio.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}x`
}

export function formatAchievementProgress(
  a: Achievement,
  current: number,
  unlocked: boolean,
): { line: string; percent: number } {
  const target = Math.max(1, Number(a.requirement_value) || 1)
  if (unlocked) {
    return { line: 'Completado', percent: 100 }
  }
  let percent = 0
  let line = ''
  switch (a.requirement_type) {
    case 'sessions':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} sesiones completadas`
      break
    case 'streak':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} días seguidos entrenando`
      break
    case 'level':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Nivel ${current} · objetivo Nivel ${target}`
      break
    case 'pr':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} récords personales registrados`
      break
    case 'volume':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Mejor sesión: ${formatKg(current)} / ${formatKg(target)}`
      break
    case 'messages':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} mensajes con tu coach`
      break
    case 'early_workouts':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} entrenos antes de las 8:00 AM`
      break
    case 'measurement_months':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} meses consecutivos midiendo progreso`
      break
    case 'lifetime_volume':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Tonelaje acumulado: ${formatKg(current)} / ${formatKg(target)}`
      break
    case 'lift_bench_bw':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Press Banca (1RM / peso): ${formatRatioMultiplier(current)} / ${formatRatioMultiplier(target)} (${current}% / ${target}%)`
      break
    case 'lift_squat_bw15':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Sentadilla (1RM / peso): ${formatRatioMultiplier(current)} / ${formatRatioMultiplier(target)} (${current}% / ${target}%)`
      break
    case 'lift_deadlift_bw2':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Peso Muerto (1RM / peso): ${formatRatioMultiplier(current)} / ${formatRatioMultiplier(target)} (${current}% / ${target}%)`
      break
    default:
      line = ''
      percent = 0
  }
  return { line, percent }
}

export function formatKg(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')} t`
  return `${Math.round(n).toLocaleString('es-MX')} kg`
}

export function sortAchievementsForDisplay(
  list: Achievement[],
  unlockedIds: Set<string>,
): Achievement[] {
  const categoryOrder: Achievement['category'][] = [
    'milestone',
    'consistency',
    'strength',
    'volume',
    'special',
  ]
  const weight = (c: Achievement['category']) => {
    const i = categoryOrder.indexOf(c)
    return i === -1 ? 99 : i
  }
  return [...list].sort((a, b) => {
    const ua = unlockedIds.has(a.id)
    const ub = unlockedIds.has(b.id)
    if (ua !== ub) return ua ? -1 : 1
    const wc = weight(a.category) - weight(b.category)
    if (wc !== 0) return wc
    const tierDiff =
      achievementDifficultyMeta(a.rarity).order - achievementDifficultyMeta(b.rarity).order
    if (tierDiff !== 0) return tierDiff
    return (a.xp_reward || 0) - (b.xp_reward || 0)
  })
}

export function achievementActionMeta(a: Achievement): {
  href: string
  label: string
  tip: string
} {
  switch (a.requirement_type) {
    case 'sessions':
      return {
        href: '/client/routines',
        label: 'Ir a mi rutina',
        tip: 'Cada sesión completada suma 1 punto a este hito y otorga XP base + bono por volumen.',
      }
    case 'streak':
      return {
        href: '/client/routines',
        label: 'Mantener racha hoy',
        tip: 'Entrena de forma constante según tu plan semanal para construir el hábito sin interrupciones.',
      }
    case 'pr':
    case 'lift_bench_bw':
    case 'lift_squat_bw15':
    case 'lift_deadlift_bw2':
      return {
        href: '/client/progress',
        label: 'Ver mis cargas y PRs',
        tip: 'Aplica sobrecarga progresiva controlada en tus básicos y mantén actualizado tu peso corporal en Medidas.',
      }
    case 'volume':
    case 'lifetime_volume':
      return {
        href: '/client/routines',
        label: 'Iniciar entrenamiento',
        tip: 'Completa todas las series efectivas prescritas por tu coach para acumular tonelaje real.',
      }
    case 'measurement_months':
      return {
        href: '/client/measurements',
        label: 'Registrar medidas',
        tip: 'Registra tu peso y perímetros corporales mes a mes para evaluar tu recomposición corporal y fuerza relativa.',
      }
    case 'messages':
      return {
        href: '/client/messages',
        label: 'Escribir a mi coach',
        tip: 'Comparte sensaciones de tus sesiones, RPE o dudas técnicas con tu coach en el chat.',
      }
    case 'early_workouts':
      return {
        href: '/client/routines',
        label: 'Ver rutina matutina',
        tip: 'Inicia y completa tu entrenamiento antes de las 8:00 AM para sumar a este desafío.',
      }
    case 'level':
    default:
      return {
        href: '/client/routines',
        label: 'Sumar XP entrenando',
        tip: 'Gana XP completando entrenamientos, rompiendo récords personales y escalando de Bronce a Élite.',
      }
  }
}

// ─── SYMMETRY STRENGTH STANDARDS & CAREER TONNAGE ────────────────────────────

export interface SymmetryTierStep {
  tier: DifficultyTierId
  shortLabel: string
  ratio: number
  percent: number
  targetKg: number | null
  achieved: boolean
}

export interface SymmetryLiftStandard {
  key: 'bench' | 'squat' | 'deadlift' | 'ohp'
  name: string
  patternLabel: string
  estimated1RmKg: number
  bwPercent: number
  bwRatio: number
  currentTier: DifficultyTierId | null
  currentTierLabel: string
  nextTierLabel: string | null
  nextTargetRatio: number | null
  nextTargetKg: number | null
  kgNeededForNext: number | null
  scorePercent: number
  steps: SymmetryTierStep[]
}

export interface SymmetryOverview {
  bodyWeightKg: number | null
  lifts: SymmetryLiftStandard[]
  overallScore: number
  overallRankLabel: string
  overallTier: DifficultyTierId | null
  strongestLift: SymmetryLiftStandard | null
  focusLift: SymmetryLiftStandard | null
  balanceScore: number | null
}

const LIFT_STANDARDS_CONFIG: {
  key: 'bench' | 'squat' | 'deadlift' | 'ohp'
  name: string
  patternLabel: string
  thresholds: { tier: DifficultyTierId; shortLabel: string; ratio: number }[]
}[] = [
  {
    key: 'bench',
    name: 'Press de Banca',
    patternLabel: 'Empuje Horizontal · Pecho',
    thresholds: [
      { tier: 'common', shortLabel: 'Bronce', ratio: 0.75 },
      { tier: 'rare', shortLabel: 'Plata', ratio: 1.0 },
      { tier: 'epic', shortLabel: 'Oro', ratio: 1.25 },
      { tier: 'legendary', shortLabel: 'Élite', ratio: 1.5 },
    ],
  },
  {
    key: 'squat',
    name: 'Sentadilla Libre',
    patternLabel: 'Dominante de Rodilla · Pierna',
    thresholds: [
      { tier: 'common', shortLabel: 'Bronce', ratio: 1.0 },
      { tier: 'rare', shortLabel: 'Plata', ratio: 1.25 },
      { tier: 'epic', shortLabel: 'Oro', ratio: 1.5 },
      { tier: 'legendary', shortLabel: 'Élite', ratio: 2.0 },
    ],
  },
  {
    key: 'deadlift',
    name: 'Peso Muerto',
    patternLabel: 'Cadena Posterior · Espalda/Glúteo',
    thresholds: [
      { tier: 'common', shortLabel: 'Bronce', ratio: 1.25 },
      { tier: 'rare', shortLabel: 'Plata', ratio: 1.5 },
      { tier: 'epic', shortLabel: 'Oro', ratio: 2.0 },
      { tier: 'legendary', shortLabel: 'Élite', ratio: 2.5 },
    ],
  },
  {
    key: 'ohp',
    name: 'Press Militar',
    patternLabel: 'Empuje Vertical · Hombros',
    thresholds: [
      { tier: 'common', shortLabel: 'Bronce', ratio: 0.5 },
      { tier: 'rare', shortLabel: 'Plata', ratio: 0.65 },
      { tier: 'epic', shortLabel: 'Oro', ratio: 0.8 },
      { tier: 'legendary', shortLabel: 'Élite', ratio: 1.0 },
    ],
  },
]

export function computeSymmetryStandards(
  metrics: ClientAchievementMetrics,
): SymmetryOverview {
  const bw = metrics.bodyWeightKg && metrics.bodyWeightKg > 0 ? metrics.bodyWeightKg : null

  const liftMetricsMap: Record<
    'bench' | 'squat' | 'deadlift' | 'ohp',
    { rm: number; pct: number }
  > = {
    bench: { rm: metrics.bench1RmKg, pct: metrics.benchBwPercent },
    squat: { rm: metrics.squat1RmKg, pct: metrics.squatBwPercent },
    deadlift: { rm: metrics.deadlift1RmKg, pct: metrics.deadliftBwPercent },
    ohp: { rm: metrics.ohp1RmKg, pct: metrics.ohpBwPercent },
  }

  const lifts: SymmetryLiftStandard[] = LIFT_STANDARDS_CONFIG.map((cfg) => {
    const { rm, pct } = liftMetricsMap[cfg.key]
    const bwRatio = bw && rm > 0 ? Number((rm / bw).toFixed(2)) : pct / 100
    const eliteRatio = cfg.thresholds[cfg.thresholds.length - 1].ratio

    const steps: SymmetryTierStep[] = cfg.thresholds.map((t) => {
      const percent = Math.round(t.ratio * 100)
      const targetKg = bw ? Math.round(bw * t.ratio) : null
      const achieved = pct >= percent && rm > 0
      return {
        tier: t.tier,
        shortLabel: t.shortLabel,
        ratio: t.ratio,
        percent,
        targetKg,
        achieved,
      }
    })

    const achievedSteps = steps.filter((s) => s.achieved)
    const highestAchieved =
      achievedSteps.length > 0 ? achievedSteps[achievedSteps.length - 1] : null
    const nextStep = steps.find((s) => !s.achieved) ?? null

    const currentTier = highestAchieved?.tier ?? null
    const currentTierLabel = highestAchieved
      ? highestAchieved.shortLabel
      : rm > 0
        ? 'Iniciado'
        : 'Sin marca'

    const nextTierLabel = nextStep?.shortLabel ?? null
    const nextTargetRatio = nextStep?.ratio ?? null
    const nextTargetKg = nextStep?.targetKg ?? null
    const kgNeededForNext =
      nextTargetKg !== null && rm < nextTargetKg
        ? Math.max(1, Math.ceil(nextTargetKg - rm))
        : null

    const scorePercent =
      rm > 0 && bw
        ? Math.min(100, Math.round((bwRatio / eliteRatio) * 100))
        : 0

    return {
      key: cfg.key,
      name: cfg.name,
      patternLabel: cfg.patternLabel,
      estimated1RmKg: rm,
      bwPercent: pct,
      bwRatio,
      currentTier,
      currentTierLabel,
      nextTierLabel,
      nextTargetRatio,
      nextTargetKg,
      kgNeededForNext,
      scorePercent,
      steps,
    }
  })

  const activeLifts = lifts.filter((l) => l.estimated1RmKg > 0)
  const overallScore =
    lifts.length > 0
      ? Math.round(lifts.reduce((acc, l) => acc + l.scorePercent, 0) / lifts.length)
      : 0

  let overallRankLabel = 'Sin clasificar'
  let overallTier: DifficultyTierId | null = null
  if (overallScore >= 85) {
    overallRankLabel = 'Simetría Élite'
    overallTier = 'legendary'
  } else if (overallScore >= 68) {
    overallRankLabel = 'Estándar Oro'
    overallTier = 'epic'
  } else if (overallScore >= 50) {
    overallRankLabel = 'Estándar Plata'
    overallTier = 'rare'
  } else if (overallScore >= 30) {
    overallRankLabel = 'Estándar Bronce'
    overallTier = 'common'
  } else if (activeLifts.length > 0) {
    overallRankLabel = 'En Construcción'
    overallTier = null
  }

  const sortedByScore = [...activeLifts].sort((a, b) => b.scorePercent - a.scorePercent)
  const strongestLift = sortedByScore[0] ?? null

  const sortedForFocus = [...lifts].sort((a, b) => a.scorePercent - b.scorePercent)
  const focusLift = activeLifts.length > 0 ? sortedForFocus[0] : null

  let balanceScore: number | null = null
  if (activeLifts.length >= 2) {
    const scores = activeLifts.map((l) => l.scorePercent)
    const maxS = Math.max(...scores)
    const minS = Math.min(...scores)
    balanceScore = Math.max(0, Math.min(100, 100 - Math.round((maxS - minS) * 0.85)))
  }

  return {
    bodyWeightKg: bw,
    lifts,
    overallScore,
    overallRankLabel,
    overallTier,
    strongestLift,
    focusLift,
    balanceScore,
  }
}

export interface TonnageComparisonInfo {
  currentHeadline: string
  currentDetail: string
  nextMilestoneKg: number
  nextMilestoneLabel: string
  progressPercent: number
}

const TONNAGE_MILESTONES: {
  kg: number
  label: string
  equivalent: string
}[] = [
  { kg: 5000, label: '5 Toneladas', equivalent: 'el peso de un Elefante Asiático adulto' },
  { kg: 25000, label: '25 Toneladas', equivalent: 'el peso de un Camión de Carga pesada' },
  { kg: 50000, label: '50 Toneladas', equivalent: 'el peso de un Avión Boeing 737' },
  { kg: 100000, label: '100 Toneladas', equivalent: 'el peso de una Ballena Azul adulta' },
  { kg: 250000, label: '250 Toneladas', equivalent: 'el peso de la Estatua de la Libertad' },
  { kg: 500000, label: '500 Toneladas', equivalent: 'el peso de un Airbus A380 a máxima carga' },
]

export function computeCareerTonnageComparison(
  lifetimeVolumeKg: number,
): TonnageComparisonInfo {
  const vol = Math.max(0, Math.round(lifetimeVolumeKg))

  let achieved: (typeof TONNAGE_MILESTONES)[number] | null = null
  let next = TONNAGE_MILESTONES[0]

  for (let i = 0; i < TONNAGE_MILESTONES.length; i++) {
    if (vol >= TONNAGE_MILESTONES[i].kg) {
      achieved = TONNAGE_MILESTONES[i]
      next = TONNAGE_MILESTONES[i + 1] ?? TONNAGE_MILESTONES[i]
    } else {
      next = TONNAGE_MILESTONES[i]
      break
    }
  }

  const currentHeadline = achieved
    ? `Has movido más que ${achieved.equivalent}`
    : vol >= 1500
      ? 'Ya levantaste el equivalente a un SUV completo'
      : 'Cada serie efectiva construye tu tonelaje de carrera'

  const progressPercent = Math.min(100, Math.round((vol / next.kg) * 100))
  const remainingKg = Math.max(0, next.kg - vol)

  const currentDetail =
    remainingKg > 0
      ? `Te faltan ${formatKg(remainingKg)} para alcanzar ${next.label} (${next.equivalent}).`
      : `¡Superaste todas las escalas estándar con ${formatKg(vol)} acumulados!`

  return {
    currentHeadline,
    currentDetail,
    nextMilestoneKg: next.kg,
    nextMilestoneLabel: next.label,
    progressPercent,
  }
}


