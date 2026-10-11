'use client'

import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'
import type { Achievement } from '@/lib/types'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  achievementLucideIcon,
  achievementMilestoneBadgeLabel,
  achievementRarityColor,
  formatAchievementProgress,
} from '@/lib/achievements-ui'

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showDetails?: boolean
  progress?: number
  showProgress?: boolean
  showMilestoneBadge?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'size-10',
  md: 'size-14',
  lg: 'size-20',
  xl: 'size-28',
}

const iconGlyphSize = {
  sm: 'size-5',
  md: 'size-7',
  lg: 'size-10',
  xl: 'size-14',
}

export function AchievementBadge({
  achievement,
  unlocked = false,
  size = 'md',
  showDetails = false,
  progress = 0,
  showProgress = false,
  showMilestoneBadge = false,
  className,
}: AchievementBadgeProps) {
  const Icon = achievementLucideIcon(achievement)
  const { percent } = formatAchievementProgress(achievement, progress, unlocked)
  const tierLabel = achievementMilestoneBadgeLabel(achievement.rarity)
  const rarityColor = achievementRarityColor(achievement.rarity)

  return (
    <div
      className={cn(
        'group/badge flex flex-col items-center transition-all duration-300',
        !unlocked && 'opacity-75',
        className,
      )}
    >
      <div className="relative flex flex-col items-center gap-2">
        {unlocked && (size === 'lg' || size === 'xl') && (
          <div
            className={cn(
              'pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-br blur-xl animate-pulse-glow',
              rarityColor,
            )}
            aria-hidden
          />
        )}

        {showMilestoneBadge && unlocked && (
          <Badge
            variant="outline"
            className="absolute -top-2.5 z-20 max-w-28 truncate border-primary/30 bg-background/95 px-2 py-0 text-[9px] font-black uppercase tracking-wider text-primary shadow-sm"
          >
            {tierLabel}
          </Badge>
        )}

        <div
          className={cn(
            'relative z-10 flex items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300 group-hover/badge:scale-105',
            sizeClasses[size],
            unlocked
              ? 'border-primary/40 bg-gradient-to-br from-primary/20 via-primary/10 to-background text-primary shadow-md shadow-primary/15 ring-1 ring-primary/20'
              : 'border-dashed border-muted-foreground/35 bg-muted/40 text-muted-foreground',
          )}
          aria-hidden={!showDetails}
        >
          {unlocked && (
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.22)_50%,transparent_75%)] opacity-0 transition-opacity duration-500 group-hover/badge:opacity-100 group-hover/badge:animate-shimmer"
              aria-hidden
            />
          )}
          {!unlocked && (
            <Lock
              className="absolute -right-1 -top-1 z-20 size-4 rounded-full bg-background p-0.5 text-muted-foreground ring-1 ring-border"
              aria-hidden
            />
          )}
          <Icon
            className={cn(
              'relative z-10 shrink-0 transition-transform duration-300 group-hover/badge:rotate-3',
              iconGlyphSize[size],
              unlocked && (size === 'lg' || size === 'xl') && 'animate-float',
            )}
          />
        </div>
      </div>

      {showDetails && (
        <div className="mt-2.5 flex max-w-[140px] flex-col items-center gap-1.5 text-center">
          <p
            className={cn(
              'line-clamp-2 font-bold leading-snug tracking-tight transition-colors group-hover/badge:text-primary',
              size === 'sm' ? 'text-[10px]' : 'text-xs',
            )}
          >
            {achievement.name}
          </p>

          {showProgress && !unlocked && (
            <div className="flex w-full flex-col gap-1">
              <Progress value={percent} className="h-1.5 bg-muted" />
              <p className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                {percent}%
              </p>
            </div>
          )}

          {unlocked && (
            <p className="text-[10px] font-black text-primary tabular-nums">
              +{achievement.xp_reward} XP
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface AchievementsGridProps {
  achievements: Achievement[]
  unlockedIds: Set<string>
}

export function AchievementsGrid({ achievements, unlockedIds }: AchievementsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          unlocked={unlockedIds.has(achievement.id)}
          size="md"
          showDetails
        />
      ))}
    </div>
  )
}
