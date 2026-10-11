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
  Star,
  Sunrise,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import type { Achievement } from '@/lib/types'

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
    milestone: 'Hitos',
    special: 'Desafíos',
  }
  return labels[cat] ?? cat
}

/** Copy for milestone emphasis (replaces “rarity / épico” tone). */
export function achievementRarityColor(rarity: Achievement['rarity'] | undefined): string {
  switch (rarity) {
    case 'legendary':
      return 'from-amber-400 to-orange-600'
    case 'epic':
      return 'from-purple-500 to-indigo-600'
    case 'rare':
      return 'from-blue-400 to-blue-600'
    case 'common':
    default:
      return 'from-slate-400 to-slate-600'
  }
}

export function achievementMilestoneBadgeLabel(rarity: Achievement['rarity'] | undefined): string {
  switch (rarity) {
    case 'legendary':
      return 'Alto impacto'
    case 'epic':
      return 'Exigente'
    case 'rare':
      return 'Progresión'
    case 'common':
    default:
      return 'Base'
  }
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
      line = `${current} / ${target} días seguidos con entreno`
      break
    case 'level':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Nivel ${current} · objetivo ${target}`
      break
    case 'pr':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} marcas personales distintas`
      break
    case 'volume':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Mejor sesión: ${formatKg(current)} / ${formatKg(target)}`
      break
    case 'messages':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} mensajes enviados a tu coach`
      break
    case 'early_workouts':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} entrenos antes de las 8:00`
      break
    case 'measurement_months':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `${current} / ${target} meses seguidos con medidas`
      break
    case 'lifetime_volume':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Volumen acumulado: ${formatKg(current)} / ${formatKg(target)}`
      break
    case 'lift_bench_bw':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Press (1RM est. / peso): ${current}% / ${target}% del peso corporal`
      break
    case 'lift_squat_bw15':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Sentadilla (1RM est. / peso): ${current}% / ${target}% del peso corporal`
      break
    case 'lift_deadlift_bw2':
      percent = Math.min(100, Math.round((current / target) * 100))
      line = `Peso muerto (1RM est. / peso): ${current}% / ${target}% del peso corporal`
      break
    default:
      line = ''
      percent = 0
  }
  return { line, percent }
}

function formatKg(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} t`
  return `${Math.round(n)} kg`
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
        tip: 'Entrena en días consecutivos según tu plan semanal para mantener activa tu racha.',
      }
    case 'pr':
    case 'lift_bench_bw':
    case 'lift_squat_bw15':
    case 'lift_deadlift_bw2':
      return {
        href: '/client/progress',
        label: 'Ver mis cargas y PRs',
        tip: 'Aplica sobrecarga progresiva controlada en tus ejercicios principales para superar tu marca.',
      }
    case 'volume':
    case 'lifetime_volume':
      return {
        href: '/client/routines',
        label: 'Iniciar entrenamiento',
        tip: 'Completa todas las series efectivas prescritas por tu coach para acumular tonelaje.',
      }
    case 'measurement_months':
      return {
        href: '/client/measurements',
        label: 'Registrar medidas',
        tip: 'Registra tu peso y perímetros corporales mes a mes para evaluar tu recomposición corporal.',
      }
    case 'messages':
      return {
        href: '/client/messages',
        label: 'Escribir a mi coach',
        tip: 'Comparte feedback de tus sesiones o dudas técnicas con tu coach en el chat.',
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
        tip: 'Gana XP completando entrenamientos, rompiendo récords personales y desbloqueando hitos.',
      }
  }
}

