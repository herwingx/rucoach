'use client'

import * as React from 'react'
import Image from 'next/image'
import { PhotoCard, type ProgressPhoto } from './photo-card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, Filter, Camera, LayoutGrid, List, Calendar, Weight } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const VIEW_LABELS: Record<string, string> = {
  front: 'Frente',
  side: 'Perfil',
  back: 'Espalda',
  other: 'Otra',
}

function parseTakenDate(dateStr: string): Date {
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
}

interface PhotoGalleryProps {
  photos: ProgressPhoto[]
  onDeleteSuccess?: (id: string) => void
  onView?: (photo: ProgressPhoto) => void
  showActions?: boolean
}

export function PhotoGallery({
  photos,
  onDeleteSuccess,
  onView,
  showActions = true,
}: PhotoGalleryProps) {
  const [filter, setFilter] = React.useState<string>('all')
  const [search, setSearch] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [viewingPhoto, setViewingPhoto] = React.useState<ProgressPhoto | null>(null)

  const handleViewPhoto = React.useCallback(
    (photo: ProgressPhoto) => {
      if (onView) onView(photo)
      setViewingPhoto(photo)
    },
    [onView],
  )

  const filteredPhotos = React.useMemo(() => {
    return photos
      .filter((p) => (filter === 'all' ? true : p.view_type === filter))
      .filter((p) => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
          p.notes?.toLowerCase().includes(searchLower) ||
          p.view_type?.toLowerCase().includes(searchLower) ||
          format(parseTakenDate(p.taken_at), 'MMMM', { locale: es }).includes(searchLower)
        )
      })
      .sort(
        (a, b) =>
          parseTakenDate(b.taken_at).getTime() -
          parseTakenDate(a.taken_at).getTime(),
      )
  }, [photos, filter, search])

  // Group by Month and Year
  const groupedPhotos = React.useMemo(() => {
    const groups: Record<string, ProgressPhoto[]> = {}
    filteredPhotos.forEach((photo) => {
      const monthYear = format(parseTakenDate(photo.taken_at), 'MMMM yyyy', { locale: es })
      if (!groups[monthYear]) groups[monthYear] = []
      groups[monthYear].push(photo)
    })
    return groups
  }, [filteredPhotos])

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Camera className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Sin fotos aún</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Comienza a documentar tu progreso subiendo tu primera foto.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <InputGroup>
            <InputGroupAddon>
              <Search data-icon="inline-start" className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Buscar por notas o mes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] md:w-[160px]">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Filtrar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="front">Frente</SelectItem>
              <SelectItem value="side">Perfil</SelectItem>
              <SelectItem value="back">Espalda</SelectItem>
              <SelectItem value="other">Otras</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex rounded-md border bg-muted/50 p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-8"
              onClick={() => setViewMode('grid')}
              aria-label="Vista de cuadrícula"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-8"
              onClick={() => setViewMode('list')}
              aria-label="Vista de lista"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery Groups */}
      <div className="space-y-10">
        <Accordion 
          type="multiple" 
          defaultValue={Object.keys(groupedPhotos).slice(0, 2)} 
          className="space-y-4"
        >
          {Object.entries(groupedPhotos).map(([monthYear, monthPhotos]) => (
            <AccordionItem 
              key={monthYear} 
              value={monthYear} 
              className="border border-border/50 rounded-[1.5rem] bg-card/40 px-5 overflow-hidden shadow-sm transition-all data-[state=open]:bg-card/60"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex flex-1 items-center gap-4 w-full pr-4">
                  <h4 className="text-[17px] font-bold tracking-tight capitalize">{monthYear}</h4>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {monthPhotos.length} {monthPhotos.length === 1 ? 'foto' : 'fotos'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                <div
                  className={cn(
                    'grid gap-4',
                    viewMode === 'grid' 
                      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                      : 'grid-cols-1 max-w-2xl mx-auto'
                  )}
                >
                  {monthPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onDelete={onDeleteSuccess}
                      onView={handleViewPhoto}
                      showActions={showActions}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredPhotos.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No se encontraron fotos con esos filtros.</p>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(viewingPhoto)}
        onOpenChange={(open) => {
          if (!open) setViewingPhoto(null)
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl overflow-hidden p-4 sm:p-6">
          {viewingPhoto && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 pr-6">
                  <span>
                    {VIEW_LABELS[viewingPhoto.view_type || ''] ||
                      viewingPhoto.view_type ||
                      'Progreso'}
                  </span>
                  {viewingPhoto.weight_kg && (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                      <Weight className="size-4" />
                      {viewingPhoto.weight_kg} kg
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1.5 text-xs">
                  <Calendar className="size-3.5" />
                  {format(
                    parseTakenDate(viewingPhoto.taken_at),
                    "d 'de' MMMM, yyyy",
                    { locale: es },
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={viewingPhoto.photo_url}
                  alt="Vista detallada de progreso"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 95vw, 500px"
                />
              </div>
              {viewingPhoto.notes && (
                <p className="text-sm italic text-muted-foreground bg-muted/30 p-3 rounded-xl border">
                  &ldquo;{viewingPhoto.notes}&rdquo;
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
