'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type ExerciseMediaProps = {
  src?: string | null
  fallbackSrc?: string | null
  alt: string
  className?: string
  imgClassName?: string
  /** Square thumb vs fill parent */
  variant?: 'thumb' | 'fill'
}

/**
 * GIF / imagen de ejercicio con reserva de espacio (CLS), lazy decode y fallback si falla la URL o no hay archivo en /public.
 */
export function ExerciseMedia({ src, fallbackSrc, alt, className, imgClassName, variant = 'fill' }: ExerciseMediaProps) {
  const candidates = useMemo(
    () => [src, fallbackSrc].filter((u): u is string => !!u && u.trim().length > 0),
    [src, fallbackSrc],
  )
  const [sourceIndex, setSourceIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(candidates.length === 0)
  const currentSrc = candidates[sourceIndex]

  // Reset media lifecycle when source changes (exercise switch, fallback recoveries).
  useEffect(() => {
    setSourceIndex(0)
    setLoaded(false)
    setFailed(candidates.length === 0)
  }, [candidates])

  if (!currentSrc || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 bg-linear-to-br from-muted to-muted/50 text-muted-foreground',
          variant === 'thumb' && 'size-full min-h-0 rounded-xl',
          variant === 'fill' && 'size-full min-h-0',
          className,
        )}
        role="img"
        aria-label={alt ? `Sin animación: ${alt}` : 'Sin vista previa del ejercicio'}
      >
        <Dumbbell className="size-6 shrink-0 text-primary/50" aria-hidden />
        <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/90">
          Vista previa
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative isolate overflow-hidden bg-muted', className)}>
      {!loaded && (
        <Skeleton className="absolute inset-0 z-10 rounded-none" aria-hidden />
      )}
      { }
      <img
        src={currentSrc}
        alt={alt}
        width={variant === 'thumb' ? 128 : undefined}
        height={variant === 'thumb' ? 128 : undefined}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none',
          loaded ? 'opacity-100' : 'opacity-0',
          'mix-blend-multiply dark:mix-blend-normal',
          imgClassName,
        )}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (sourceIndex < candidates.length - 1) {
            setSourceIndex((idx) => idx + 1)
          } else {
            setFailed(true)
          }
          setLoaded(false)
        }}
      />
    </div>
  )
}
