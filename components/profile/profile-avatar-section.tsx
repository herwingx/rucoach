'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import {
  PROFILE_AVATAR_ACCEPT,
  PROFILE_AVATAR_MAX_BYTES,
  uploadProfileAvatar,
} from '@/lib/profile-avatar-storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ProfileAvatarSectionProps = {
  userId: string
  initialUrl?: string | null
  onAvatarUrlChange?: (url: string) => void
  title?: string
  description?: string
}

export function ProfileAvatarSection({
  userId,
  initialUrl,
  onAvatarUrlChange,
  title = 'Foto de perfil',
  description = 'JPG, PNG o WebP · máx. 2 MB · se recortará en círculo en la app.',
}: ProfileAvatarSectionProps) {
  const supabase = createClient()
  const [url, setUrl] = useState(initialUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUrl(initialUrl ?? '')
  }, [initialUrl])

  const displayUrl = url || ''

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > PROFILE_AVATAR_MAX_BYTES) {
      toast.error('La imagen supera 2 MB.')
      return
    }

    setUploading(true)
    try {
      const result = await uploadProfileAvatar(supabase, userId, file)
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: result.publicUrl })
        .eq('id', userId)

      if (updateError) {
        toast.error('No pudimos guardar la URL en tu perfil.')
        return
      }

      setUrl(result.publicUrl)
      onAvatarUrlChange?.(result.publicUrl)
      toast.success('Foto de perfil actualizada')
    } catch {
      toast.error('No pudimos procesar la imagen.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="rounded-3xl border-border/80 shadow-md ring-1 ring-primary/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-5">
          <div className="relative size-20 overflow-hidden rounded-full border-2 border-primary/20 bg-muted sm:size-24">
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt="Foto de perfil"
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Camera className="size-8" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <input
              ref={inputRef}
              type="file"
              accept={PROFILE_AVATAR_ACCEPT}
              onChange={handleFile}
              disabled={uploading}
              className="sr-only"
              id={`profile-avatar-${userId}`}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload data-icon="inline-start" aria-hidden />
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground text-pretty">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
