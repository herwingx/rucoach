'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  Loader2,
  X,
  Camera,
  Info,
  CheckCircle2,
  Sparkles,
  Calendar,
} from 'lucide-react'
import { getR2PresignedUrl } from '@/app/actions/r2-storage'
import { R2_PUBLIC_URL } from '@/lib/constants'
import type { ProgressPhoto } from './photo-card'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

const VIEW_TYPES = [
  { value: 'front', label: 'Frente' },
  { value: 'side', label: 'Perfil' },
  { value: 'back', label: 'Espalda' },
  { value: 'other', label: 'Otra' },
] as const

const MAX_INPUT_FILE_SIZE = 25 * 1024 * 1024 // 25 MB
const MAX_FALLBACK_RAW_SIZE = 10 * 1024 * 1024 // 10 MB
const COMPRESS_THRESHOLD_BYTES = 1.2 * 1024 * 1024 // 1.2 MB
const MAX_IMAGE_DIMENSION = 1800

function getLocalToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function loadImageSource(file: File): Promise<{
  source: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      }
    } catch {
      // Fallback to HTMLImageElement if createImageBitmap fails on specific mobile formats
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo decodificar la imagen en el navegador'))
    }
    img.src = objectUrl
  })
}

export async function compressImageForUpload(file: File): Promise<File> {
  try {
    const { source, width, height, cleanup } = await loadImageSource(file)
    try {
      const longestSide = Math.max(width, height)
      const isWebReadyMime = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)

      if (
        longestSide <= MAX_IMAGE_DIMENSION &&
        file.size <= COMPRESS_THRESHOLD_BYTES &&
        isWebReadyMime
      ) {
        return file
      }

      const scale = longestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / longestSide : 1
      const targetWidth = Math.max(1, Math.round(width * scale))
      const targetHeight = Math.max(1, Math.round(height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Contexto 2D no disponible')
      }

      ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.85)
      })

      if (!blob) {
        throw new Error('No se pudo generar la imagen comprimida')
      }

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'progress-photo'
      return new File([blob], `${baseName}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })
    } finally {
      cleanup()
    }
  } catch {
    if (file.size < MAX_FALLBACK_RAW_SIZE) {
      return file
    }
    throw new Error(
      'No se pudo optimizar este formato de imagen automáticamente y supera los 10 MB. Intenta con JPG o PNG.'
    )
  }
}

export function PhotoUpload({
  clientId,
  onSuccess,
}: {
  clientId: string
  onSuccess: (photo: ProgressPhoto) => void
}) {
  const [viewType, setViewType] = React.useState<string>('front')
  const [takenAt, setTakenAt] = React.useState<string>(() => getLocalToday())
  const [weightKg, setWeightKg] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [originalSize, setOriginalSize] = React.useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isCompressing, setIsCompressing] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [dragActive, setDragActive] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ]
    const isImageFile =
      f.type.startsWith('image/') ||
      allowedMimeTypes.includes(f.type) ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)

    if (!isImageFile) {
      setError('Formato no válido. Usa una imagen (JPG, PNG, WebP o HEIC).')
      return
    }
    if (f.size > MAX_INPUT_FILE_SIZE) {
      setError('El archivo es demasiado grande (máx 25 MB).')
      return
    }

    setError(null)
    setIsCompressing(true)
    setOriginalSize(f.size)

    try {
      const optimizedFile = await compressImageForUpload(f)
      setFile(optimizedFile)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(optimizedFile)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'No se pudo procesar la foto seleccionada.'
      setError(message)
      setFile(null)
      setPreviewUrl(null)
    } finally {
      setIsCompressing(false)
    }
  }

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFile(e.dataTransfer.files[0])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${ext}`
      const path = `progress/clients/${clientId}/${fileName}`
      const contentType = file.type || 'image/jpeg'

      const signedUrl = await getR2PresignedUrl(path, contentType)

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
      })

      if (!uploadRes.ok) throw new Error('Error al subir a R2')

      const publicUrl = `${R2_PUBLIC_URL}/${path}`
      const selectedDate = takenAt || getLocalToday()

      const { data: row, error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          client_id: clientId,
          photo_url: publicUrl,
          view_type: viewType,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          notes: notes || null,
          taken_at: selectedDate,
        })
        .select()
        .single()

      if (insertError) throw insertError

      onSuccess(row as ProgressPhoto)
      setFile(null)
      setOriginalSize(null)
      setPreviewUrl(null)
      setWeightKg('')
      setNotes('')
      setTakenAt(getLocalToday())
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al subir la imagen'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Upload Area */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Nueva foto</h3>
          <p className="text-muted-foreground">
            Sube una foto de tu estado actual o de días anteriores para registrar tu progreso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={cn(
              'relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all aspect-[4/3] flex flex-col items-center justify-center p-6 text-center',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50',
              previewUrl && 'border-solid border-primary/20 bg-muted/30'
            )}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => !previewUrl && !isCompressing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.heic,.heif"
              onChange={(e) => {
                const selected = e.target.files?.[0]
                if (selected) void handleFile(selected)
                e.target.value = ''
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const selected = e.target.files?.[0]
                if (selected) void handleFile(selected)
                e.target.value = ''
              }}
            />

            {isCompressing ? (
              <div className="space-y-3">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                  <Loader2 className="size-7 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold">Optimizando foto...</p>
                  <p className="text-xs text-muted-foreground">
                    Ajustando resolución para una subida rápida sin perder nitidez
                  </p>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="relative w-full h-full group/preview">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain rounded-2xl"
                />
                <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    <Camera className="mr-2 size-4" />
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setOriginalSize(null)
                      setPreviewUrl(null)
                    }}
                  >
                    <X className="mr-2 size-4" />
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform">
                  <Upload className="size-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Suelta tu foto aquí</p>
                  <p className="text-sm text-muted-foreground">
                    o elige desde tu galería o cámara del teléfono
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs font-semibold"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    <Upload className="mr-1.5 size-3.5" />
                    Explorar galería
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-semibold sm:hidden"
                    onClick={(e) => {
                      e.stopPropagation()
                      cameraInputRef.current?.click()
                    }}
                  >
                    <Camera className="mr-1.5 size-3.5" />
                    Tomar foto
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <span>JPG, PNG, WebP, HEIC</span>
                  <span>•</span>
                  <span>Compresión automática (hasta 25 MB)</span>
                </div>
              </div>
            )}
          </div>

          {file && !isCompressing && (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2 text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="size-3.5 shrink-0" />
                <span>
                  Optimizada para subida rápida ({formatFileSize(file.size)})
                </span>
              </div>
              {originalSize && originalSize > file.size && (
                <span className="text-[11px] text-muted-foreground">
                  Original: {formatFileSize(originalSize)}
                </span>
              )}
            </div>
          )}

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel>Categoría de la vista</FieldLabel>
                <Select value={viewType} onValueChange={setViewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige vista" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIEW_TYPES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="taken-at" className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>Fecha de la foto</span>
                </FieldLabel>
                <Input
                  id="taken-at"
                  type="date"
                  max={getLocalToday()}
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="weight">Peso (kg - opcional)</FieldLabel>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="75.0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Notas / Sensaciones (opcional)</FieldLabel>
              <Input
                id="notes"
                placeholder="Ej: Ayunas, post-entreno, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </FieldGroup>

          {error && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            disabled={!file || isCompressing || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Subiendo progreso...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 size-5" />
                Guardar foto de progreso
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Guidance / Info */}
      <div className="hidden lg:flex flex-col justify-center space-y-8 p-8 rounded-3xl bg-muted/30 border border-muted">
        <div className="space-y-4">
          <h4 className="text-xl font-bold flex items-center gap-2">
            <Info className="size-5 text-primary" />
            Tips para mejores fotos
          </h4>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
                1
              </div>
              <p className="text-sm text-muted-foreground">
                Usa la misma iluminación y hora del día (preferiblemente ayunas).
              </p>
            </li>
            <li className="flex gap-3">
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
                2
              </div>
              <p className="text-sm text-muted-foreground">
                Mantén la misma distancia a la cámara y fondo neutro.
              </p>
            </li>
            <li className="flex gap-3">
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
                3
              </div>
              <p className="text-sm text-muted-foreground">
                Usa la misma ropa para que la comparación sea más precisa.
              </p>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-primary font-medium leading-relaxed">
            &quot;La constancia en las fotos es tan importante como la constancia en el entrenamiento. Es tu mejor herramienta para ver lo que la báscula no te dice.&quot;
          </p>
        </div>
      </div>
    </div>
  )
}

