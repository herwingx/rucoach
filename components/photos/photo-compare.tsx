'use client'

import * as React from 'react'
import { ImageCompareSlider } from '@/components/ui/image-compare-slider'
import { type ProgressPhoto } from './photo-card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Layers, Calendar, Weight, Filter } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PhotoCompareProps {
  photos: ProgressPhoto[]
}

function parseTakenDate(dateStr: string): Date {
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
}

export function PhotoCompare({ photos }: PhotoCompareProps) {
  const [beforeId, setBeforeId] = React.useState<string | null>(null)
  const [afterId, setAfterId] = React.useState<string | null>(null)

  const sortedPhotos = React.useMemo(() => {
    return [...photos].sort(
      (a, b) =>
        parseTakenDate(a.taken_at).getTime() -
        parseTakenDate(b.taken_at).getTime()
    )
  }, [photos])

  const availableMonths = React.useMemo(() => {
    const m = new Set<string>()
    sortedPhotos.forEach(p => m.add(format(parseTakenDate(p.taken_at), 'yyyy-MM')))
    return Array.from(m).sort().reverse()
  }, [sortedPhotos])

  const [beforeMonth, setBeforeMonth] = React.useState<string>('all')
  const [afterMonth, setAfterMonth] = React.useState<string>('all')

  const before = photos.find((p) => p.id === beforeId)
  const after = photos.find((p) => p.id === afterId)

  // Auto-select first and last if not set or if selected photo was deleted
  React.useEffect(() => {
    if (sortedPhotos.length < 2) return
    const hasBefore = beforeId && sortedPhotos.some((p) => p.id === beforeId)
    const hasAfter = afterId && sortedPhotos.some((p) => p.id === afterId)
    if (!hasBefore) {
      setBeforeId(sortedPhotos[0].id)
    }
    if (!hasAfter) {
      setAfterId(sortedPhotos[sortedPhotos.length - 1].id)
    }
  }, [sortedPhotos, beforeId, afterId])

  if (photos.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Layers className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Necesitas más fotos</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Sube al menos dos fotos para poder comparar tu evolución visual.
        </p>
      </div>
    )
  }

  const renderPhotoSelector = (
    label: string,
    currentId: string | null,
    setter: (id: string) => void,
    monthFilter: string,
    setMonthFilter: (m: string) => void
  ) => {
    const filtered = monthFilter === 'all' 
      ? sortedPhotos 
      : sortedPhotos.filter(p => format(parseTakenDate(p.taken_at), 'yyyy-MM') === monthFilter)

    const currentPhoto = currentId ? photos.find(p => p.id === currentId) : null

    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            {currentPhoto && (
              <span className="text-xs font-semibold text-primary">
                {format(parseTakenDate(currentPhoto.taken_at), "d MMM, yyyy", { locale: es })}
              </span>
            )}
          </div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <Filter className="size-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ver todas</SelectItem>
              {availableMonths.map(m => {
                const [year, month] = m.split('-')
                const date = new Date(parseInt(year), parseInt(month) - 1)
                return (
                  <SelectItem key={m} value={m}>
                    {format(date, 'MMMM yyyy', { locale: es })}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="w-full whitespace-nowrap rounded-[1.2rem] border border-border/50 bg-card/40 p-2.5 shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground italic">
              No hay fotos este mes
            </div>
          ) : (
            <div className="flex gap-2.5">
              {filtered.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setter(photo.id)}
                  className={cn(
                    'relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-[0.85rem] border-2 transition-all',
                    currentId === photo.id
                      ? 'border-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-background scale-[0.98]'
                      : 'border-transparent hover:border-border/80 opacity-70 hover:opacity-100 hover:scale-100'
                  )}
                >
                  <Image
                    src={photo.photo_url}
                    alt="Miniatura"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 pt-4 text-[9px] font-bold text-white text-center">
                    {format(parseTakenDate(photo.taken_at), 'dd/MM/yy')}
                  </div>
                </button>
              ))}
            </div>
          )}
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Selectors Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {renderPhotoSelector('Estado Inicial (Antes)', beforeId, setBeforeId, beforeMonth, setBeforeMonth)}
        {renderPhotoSelector('Estado Actual (Después)', afterId, setAfterId, afterMonth, setAfterMonth)}
      </div>

      {/* Comparison Tool */}
      {before && after && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border bg-card shadow-2xl max-w-md mx-auto w-full">
            <ImageCompareSlider
              beforeImage={before.photo_url}
              afterImage={after.photo_url}
              className="aspect-[3/4] max-w-md mx-auto w-full"
            />
          </div>

          {/* Stats Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                <span className="text-xs font-medium uppercase">Fecha Inicio</span>
              </div>
              <p className="text-lg font-bold">{format(parseTakenDate(before.taken_at), "d 'de' MMMM", { locale: es })}</p>
              {before.weight_kg && (
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <Weight className="size-4" />
                  <span>{before.weight_kg} kg</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                <span className="text-xs font-medium uppercase">Fecha Actual</span>
              </div>
              <p className="text-lg font-bold">{format(parseTakenDate(after.taken_at), "d 'de' MMMM", { locale: es })}</p>
              {after.weight_kg && (
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <Weight className="size-4" />
                  <span>{after.weight_kg} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Info */}
          {(before.notes || after.notes) && (
            <div className="grid gap-4 md:grid-cols-2">
               {before.notes && (
                 <div className="text-sm italic text-muted-foreground bg-muted/30 p-3 rounded-xl border">
                   &quot;{before.notes}&quot;
                 </div>
               )}
               {after.notes && (
                 <div className="text-sm italic text-muted-foreground bg-muted/30 p-3 rounded-xl border">
                   &quot;{after.notes}&quot;
                 </div>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
