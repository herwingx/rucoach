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
import { Upload, Loader2, X, Camera, Info, CheckCircle2 } from 'lucide-react'
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

export function PhotoUpload({
  clientId,
  onSuccess,
}: {
  clientId: string
  onSuccess: (photo: ProgressPhoto) => void
}) {
  const [viewType, setViewType] = React.useState<string>('front')
  const [weightKg, setWeightKg] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(f.type)) {
      setError('Formato no válido. Usa JPG, PNG o WebP.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máx 5MB)')
      return
    }
    
    setFile(f)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(f)
  }

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
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

      const signedUrl = await getR2PresignedUrl(path, file.type)

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadRes.ok) throw new Error('Error al subir a R2')

      const publicUrl = `${R2_PUBLIC_URL}/${path}`

      const now = new Date()
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      const { data: row, error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          client_id: clientId,
          photo_url: publicUrl,
          view_type: viewType,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          notes: notes || null,
          taken_at: localToday,
        })
        .select()
        .single()

      if (insertError) throw insertError

      onSuccess(row as ProgressPhoto)
      setFile(null)
      setPreviewUrl(null)
      setWeightKg('')
      setNotes('')
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen')
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
            Sube una foto de tu estado actual para trackear tu progreso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={cn(
              "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all aspect-[4/3] flex flex-col items-center justify-center p-6 text-center",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
              previewUrl && "border-solid border-primary/20 bg-muted/30"
            )}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {previewUrl ? (
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
                  <p className="text-sm text-muted-foreground">o haz clic para explorar tus archivos</p>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>JPG, PNG, WebP</span>
                  <span>•</span>
                  <span>Máx 5MB</span>
                </div>
              </div>
            )}
          </div>

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
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
            disabled={!file || isUploading}
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
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">1</div>
              <p className="text-sm text-muted-foreground">Usa la misma iluminación y hora del día (preferiblemente ayunas).</p>
            </li>
            <li className="flex gap-3">
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">2</div>
              <p className="text-sm text-muted-foreground">Mantén la misma distancia a la cámara y fondo neutro.</p>
            </li>
            <li className="flex gap-3">
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">3</div>
              <p className="text-sm text-muted-foreground">Usa la misma ropa para que la comparación sea más precisa.</p>
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
