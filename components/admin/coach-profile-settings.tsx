'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Bell, Camera, Download, Loader2, Lock, Send, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { getR2PresignedUrl } from '@/app/actions/r2-storage'
import {
  savePushSubscription,
  removePushSubscription,
  sendTestPushNotification,
} from '@/app/actions/web-push'
import { urlBase64ToUint8Array } from '@/lib/utils/web-push'
import {
  detectPWAPlatform,
  isRunningStandalone,
  openPWAInstallPrompt,
} from '@/components/pwa-install-cta'
import { R2_PUBLIC_URL } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export function CoachProfileSettings({
  userId,
  initialFullName,
  initialAvatarUrl,
}: {
  userId: string
  initialFullName?: string | null
  initialAvatarUrl?: string | null
}) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(initialFullName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Push notifications, PWA & Password state
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [testingPush, setTestingPush] = useState(false)
  const [standalone, setStandalone] = useState(true)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    setStandalone(isRunningStandalone())
    setIsIOSDevice(detectPWAPlatform().isIOS)
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      setPushSupported(true)
      if (Notification.permission === 'granted') {
        navigator.serviceWorker
          .getRegistration()
          .then((reg) => reg?.pushManager.getSubscription())
          .then((sub) => {
            setPushSubscribed(Boolean(sub))
          })
          .catch(() => {})
      }
    }
  }, [])

  const handleTogglePush = async (checked: boolean) => {
    if (!pushSupported) {
      toast.error('Tu navegador no soporta notificaciones Push.')
      return
    }

    setPushLoading(true)
    try {
      if (checked) {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
          toast.error('Permiso de notificaciones denegado en el navegador.')
          setPushSubscribed(false)
          return
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
          toast.error('Falta configurar la clave pública VAPID.')
          setPushSubscribed(false)
          return
        }

        const reg =
          (await navigator.serviceWorker.getRegistration()) ||
          (await navigator.serviceWorker.register('/sw.js', { scope: '/' }))
        const readyReg = reg.active ? reg : await navigator.serviceWorker.ready

        const subscription = await readyReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        const res = await savePushSubscription(subscription.toJSON())
        if (!res.success) {
          toast.error(res.error || 'No se pudo guardar la suscripción Push.')
          setPushSubscribed(false)
          return
        }

        setPushSubscribed(true)
        toast.success('Notificaciones Push activadas en este dispositivo.')
      } else {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        if (sub) {
          const endpoint = sub.endpoint
          await sub.unsubscribe()
          await removePushSubscription(endpoint)
        }
        setPushSubscribed(false)
        toast.success('Notificaciones Push desactivadas en este dispositivo.')
      }
    } catch (err) {
      console.error('Error configurando notificaciones push:', err)
      toast.error('No se pudieron configurar las notificaciones Push.')
    } finally {
      setPushLoading(false)
    }
  }

  const handleTestPush = async () => {
    setTestingPush(true)
    try {
      const res = await sendTestPushNotification()
      if (!res.success) {
        toast.error(res.error || 'No se pudo enviar la notificación de prueba.')
        return
      }
      toast.success('Notificación de prueba enviada a tu dispositivo')
    } catch {
      toast.error('Error al enviar la notificación de prueba.')
    } finally {
      setTestingPush(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) {
        toast.error(error.message || 'No se pudo actualizar la contraseña.')
        return
      }
      setNewPassword('')
      setConfirmPassword('')
      toast.success('¡Contraseña actualizada correctamente!')
    } catch {
      toast.error('Error inesperado al actualizar la contraseña.')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('La imagen supera 2 MB. Elige otra más pequeña.')
      return
    }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `avatars/${userId}/${Date.now()}.${ext}`
      const signedUrl = await getR2PresignedUrl(path, file.type || 'image/jpeg')

      const res = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'image/jpeg' },
      })

      if (!res.ok) {
        throw new Error('Error al subir imagen a R2')
      }

      const finalUrl = `${R2_PUBLIC_URL}/${path}`
      setAvatarUrl(finalUrl)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('id', userId)

      if (updateError) {
        toast.error('La imagen se subió pero no pudimos actualizar tu perfil.')
        return
      }

      toast.success('Foto de perfil actualizada')
    } catch (err) {
      console.error('Error uploading coach avatar:', err)
      toast.error('No pudimos subir la foto de perfil.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq('id', userId)

      if (error) {
        toast.error('No pudimos guardar el perfil.')
        return
      }

      toast.success('Perfil actualizado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Tu foto</CardTitle>
          <CardDescription>
            La verán tus asesorados en mensajes. JPG, PNG o WebP · máx. 2 MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-5">
            <div className="relative size-20 overflow-hidden rounded-full border-2 border-primary/20 bg-muted sm:size-24 shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
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
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="sr-only"
                id={`coach-avatar-${userId}`}
              />
              <div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="size-4 mr-2 animate-spin" aria-hidden />
                  ) : (
                    <Upload className="size-4 mr-2" aria-hidden />
                  )}
                  {uploadingAvatar ? 'Subiendo…' : 'Cambiar foto'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-pretty">
                Sube una imagen directamente o pega una URL abajo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Tu nombre</CardTitle>
          <CardDescription>Así apareces para tus asesorados en la app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="coach-full-name">Nombre completo</FieldLabel>
                <Input
                  id="coach-full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder="Tu nombre y apellido"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="coach-avatar-url">URL de foto de perfil (opcional)</FieldLabel>
                <Input
                  id="coach-avatar-url"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </FieldGroup>
            
            <div className="border-t pt-4">
              <Button type="submit" disabled={saving || uploadingAvatar} className="w-full sm:w-auto">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-4 text-primary" aria-hidden />
            Seguridad y Notificaciones del Coach
          </CardTitle>
          <CardDescription>
            Activa las alertas en este dispositivo para saber cuando tus asesorados terminen entrenos, rompan PRs, reporten molestias o te escriban.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {!standalone && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Instalar aplicación en este dispositivo
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Instala RU Coach en tu inicio (iOS, Android o computadora) para pantalla completa y notificaciones nativas.
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => openPWAInstallPrompt()}
                className="shrink-0 font-semibold"
              >
                Instalar App
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/15 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Notificaciones Push en este dispositivo
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {!pushSupported && isIOSDevice && !standalone
                      ? 'En iPhone/iPad, primero instala RU Coach en tu pantalla de inicio (botón «Instalar App» arriba) para activar las notificaciones.'
                      : 'Recibe avisos en tiempo real de entrenamientos completados, PRs, cambios de ejercicio, reportes de dolor y mensajes.'}
                  </span>
                </div>
              </div>
              <Switch
                checked={pushSubscribed}
                onCheckedChange={handleTogglePush}
                disabled={!pushSupported || pushLoading}
                aria-label="Activar notificaciones Push del Coach"
              />
            </div>

            {pushSubscribed && (
              <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
                <span className="text-xs text-muted-foreground">
                  ¿Quieres comprobar que tu dispositivo recibe alertas?
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTestPush}
                  disabled={testingPush || pushLoading}
                  className="shrink-0 rounded-xl text-xs font-semibold"
                >
                  {testingPush ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 size-3.5" />
                  )}
                  Probar notificación
                </Button>
              </div>
            )}
          </div>

          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="coach-new-password">Nueva contraseña</FieldLabel>
                <PasswordInput
                  id="coach-new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="coach-confirm-password">Confirmar contraseña</FieldLabel>
                <PasswordInput
                  id="coach-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword}
                className="w-full sm:w-auto"
              >
                {changingPassword ? 'Actualizando…' : 'Actualizar contraseña'}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
