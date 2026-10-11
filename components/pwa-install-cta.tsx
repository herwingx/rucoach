'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Monitor,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
} from 'lucide-react'
import type { DeferredPromptEvent } from '@/components/pwa-setup'

const DISMISS_KEY = 'rucoach-pwa-install-dismissed-v1'

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches ||
    window.matchMedia?.('(display-mode: minimal-ui)')?.matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
    // iOS Safari standalone property
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function openPWAInstallPrompt(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('rucoach:open-install'))
}

type PlatformGuide =
  | 'ios-safari'
  | 'ios-other'
  | 'in-app'
  | 'android-manual'
  | 'desktop-macos-safari'
  | 'desktop-chromium'

export function detectPWAPlatform(): {
  isIOS: boolean
  isAndroid: boolean
  isDesktop: boolean
  isInAppBrowser: boolean
  guide: PlatformGuide
} {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      isInAppBrowser: false,
      guide: 'desktop-chromium',
    }
  }

  const ua = window.navigator.userAgent || ''
  // Detect iPhone, iPod, iPad, plus iPadOS 13+ (which reports MacIntel with touch points)
  const isIPadOS =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
  const isIOS = /iPad|iPhone|iPod/.test(ua) || isIPadOS
  const isAndroid = /Android/i.test(ua)
  const isDesktop = !isIOS && !isAndroid

  // Detect embedded in-app browsers (Instagram, Facebook, WhatsApp, TikTok, LinkedIn)
  const isInAppBrowser = /Instagram|FBAN|FBAV|WhatsApp|BytedanceWebview|TikTok|Line\//i.test(
    ua
  )

  if (isInAppBrowser) {
    return { isIOS, isAndroid, isDesktop, isInAppBrowser: true, guide: 'in-app' }
  }

  if (isIOS) {
    const isAltIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
    return {
      isIOS: true,
      isAndroid: false,
      isDesktop: false,
      isInAppBrowser: false,
      guide: isAltIosBrowser ? 'ios-other' : 'ios-safari',
    }
  }

  if (isAndroid) {
    return {
      isIOS: false,
      isAndroid: true,
      isDesktop: false,
      isInAppBrowser: false,
      guide: 'android-manual',
    }
  }

  const isMacSafari =
    /Macintosh/i.test(ua) &&
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|Edg|OPR|Brave/i.test(ua)

  return {
    isIOS: false,
    isAndroid: false,
    isDesktop: true,
    isInAppBrowser: false,
    guide: isMacSafari ? 'desktop-macos-safari' : 'desktop-chromium',
  }
}

export function PWAInstallCTA() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [deferred, setDeferred] = useState<DeferredPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [platform, setPlatform] = useState<ReturnType<typeof detectPWAPlatform>>({
    isIOS: false,
    isAndroid: false,
    isDesktop: true,
    isInAppBrowser: false,
    guide: 'desktop-chromium',
  })

  const triggerInstallFlow = useCallback(
    async (promptEvent?: DeferredPromptEvent | null) => {
      const activePrompt =
        promptEvent ??
        deferred ??
        (typeof window !== 'undefined' ? window.__rucoachDeferredPrompt : null)

      if (!activePrompt) {
        setOpen(true)
        return
      }

      try {
        await activePrompt.prompt()
        const choice = await activePrompt.userChoice
        if (choice.outcome === 'accepted') {
          setInstalled(true)
        }
        if (typeof window !== 'undefined') {
          window.__rucoachDeferredPrompt = null
        }
        setDeferred(null)
        setDismissed(true)
        try {
          localStorage.setItem(DISMISS_KEY, '1')
        } catch {}
      } catch {
        // Si el navegador rechaza re-invocar prompt(), abrimos la guía visual
        setOpen(true)
      }
    },
    [deferred]
  )

  useEffect(() => {
    setMounted(true)
    try {
      setPlatform(detectPWAPlatform())
      setInstalled(isRunningStandalone())
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')

      if (window.__rucoachDeferredPrompt) {
        setDeferred(window.__rucoachDeferredPrompt)
      }

      const onPromptReady = () => {
        if (window.__rucoachDeferredPrompt) {
          setDeferred(window.__rucoachDeferredPrompt)
        }
      }
      const onAppInstalled = () => {
        setInstalled(true)
        setDeferred(null)
        setOpen(false)
      }
      const onDisplayModeChange = () => setInstalled(isRunningStandalone())

      const onBeforeInstall = (e: Event) => {
        try {
          const wasDismissed = localStorage.getItem(DISMISS_KEY) === '1'
          const alreadyInstalled = isRunningStandalone()
          if (!wasDismissed && !alreadyInstalled) {
            e.preventDefault()
          }
        } catch {
          e.preventDefault()
        }
        const promptEv = e as DeferredPromptEvent
        window.__rucoachDeferredPrompt = promptEv
        setDeferred(promptEv)
      }

      const onManualOpen = () => {
        void triggerInstallFlow(window.__rucoachDeferredPrompt ?? null)
      }

      window.addEventListener('beforeinstallprompt', onBeforeInstall)
      window.addEventListener('rucoach:pwa-prompt-ready', onPromptReady)
      window.addEventListener('rucoach:pwa-installed', onAppInstalled)
      window.addEventListener('rucoach:open-install', onManualOpen)
      window.addEventListener('appinstalled', onAppInstalled)
      window
        .matchMedia?.('(display-mode: standalone)')
        ?.addEventListener?.('change', onDisplayModeChange)

      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall)
        window.removeEventListener('rucoach:pwa-prompt-ready', onPromptReady)
        window.removeEventListener('rucoach:pwa-installed', onAppInstalled)
        window.removeEventListener('rucoach:open-install', onManualOpen)
        window.removeEventListener('appinstalled', onAppInstalled)
        window
          .matchMedia?.('(display-mode: standalone)')
          ?.removeEventListener?.('change', onDisplayModeChange)
      }
    } catch {
      // optional
    }
  }, [triggerInstallFlow])

  const isExcludedRoute =
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/offline') ||
    pathname?.startsWith('/welcome') ||
    false

  const canShowBanner = useMemo(() => {
    if (isExcludedRoute) return false
    if (installed) return false
    if (dismissed) return false
    // Android / Desktop Chromium: tenemos el evento nativo beforeinstallprompt
    if (deferred) return true
    // iOS / iPadOS (Safari, Chrome iOS, Edge iOS) o navegador integrado: mostramos guía de instalación
    if (platform.isIOS || platform.isInAppBrowser) return true
    return false
  }, [isExcludedRoute, installed, dismissed, deferred, platform.isIOS, platform.isInAppBrowser])

  const onDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  if (!mounted) return null

  const dialogTitle =
    platform.guide === 'in-app'
      ? 'Abrir en tu navegador'
      : platform.isIOS
        ? 'Instalar en iPhone / iPad'
        : platform.isDesktop
          ? 'Instalar en Computadora'
          : 'Instalar en Android'

  const HeaderIcon = platform.isDesktop ? Monitor : Smartphone

  return (
    <>
      {canShowBanner && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-50 px-3 sm:px-4">
          <div className="pointer-events-auto mx-auto w-full max-w-xl">
            <Alert
              role="region"
              aria-label="Instalar aplicación"
              className="border-border/80 shadow-2xl ring-1 ring-primary/20 bg-card/95 backdrop-blur-md"
            >
              <Download className="size-5 text-primary" aria-hidden />
              <AlertTitle className="text-base font-black uppercase tracking-tight">
                Instala RU Coach
              </AlertTitle>
              <AlertDescription className="mt-1">
                <p className="text-sm text-muted-foreground font-medium">
                  {platform.isIOS
                    ? 'Añade RU Coach a tu pantalla de inicio en iPhone/iPad para pantalla completa y notificaciones.'
                    : 'Acceso instantáneo, pantalla completa y experiencia nativa en tu dispositivo.'}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    onClick={() => void triggerInstallFlow()}
                    className="flex-1 h-10 font-bold uppercase tracking-tighter bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {deferred ? 'Instalar App' : 'Cómo instalar'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onDismiss}
                    className="h-10 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-transparent"
                  >
                    Ahora no
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-md rounded-2xl border-border/60 shadow-2xl">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="size-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <HeaderIcon className="size-5 text-primary" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
                {dialogTitle}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium">
              {platform.guide === 'in-app' ? (
                <>
                  Estás viendo <span className="text-foreground font-bold">RU Coach</span> desde un
                  navegador interno. Ábrelo en Safari o Chrome para instalar la app:
                </>
              ) : (
                <>
                  Sigue estos 3 pasos para instalar{' '}
                  <span className="text-foreground font-bold">RU Coach</span> como aplicación nativa
                  en tu dispositivo:
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {platform.guide === 'in-app' && (
            <div className="flex flex-col gap-3 py-3">
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <MoreVertical className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  1. Toca el icono de opciones <span className="text-primary font-bold">⋯</span> o{' '}
                  <span className="text-primary font-bold">⋮</span> en la esquina superior derecha.
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <ExternalLink className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  2. Elige{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Abrir en Safari / Chrome
                  </span>{' '}
                  para habilitar la instalación.
                </p>
              </div>
            </div>
          )}

          {(platform.guide === 'ios-safari' || platform.guide === 'ios-other') && (
            <div className="flex flex-col gap-3 py-3">
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <Share className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  1. Toca el botón{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Compartir
                  </span>{' '}
                  {platform.guide === 'ios-safari'
                    ? 'en la barra inferior de Safari.'
                    : 'en la esquina superior derecha de la barra de direcciones.'}
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <PlusSquare className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  2. Desliza hacia abajo y selecciona{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Añadir a pantalla de inicio
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  3. Pulsa{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Añadir
                  </span>{' '}
                  arriba a la derecha. ¡Listo!
                </p>
              </div>
            </div>
          )}

          {platform.guide === 'android-manual' && (
            <div className="flex flex-col gap-3 py-3">
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <MoreVertical className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  1. Toca el menú de opciones <span className="text-primary font-bold">⋮</span> en
                  la esquina superior derecha del navegador.
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <Download className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  2. Selecciona{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Instalar aplicación
                  </span>{' '}
                  o{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Añadir a pantalla de inicio
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  3. Confirma tocando <span className="text-primary font-bold">Instalar</span> para
                  agregar el ícono de RU Coach a tus aplicaciones.
                </p>
              </div>
            </div>
          )}

          {platform.guide === 'desktop-macos-safari' && (
            <div className="flex flex-col gap-3 py-3">
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <Share className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  1. Haz clic en el botón{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Compartir
                  </span>{' '}
                  en la barra superior de Safari (o en el menú{' '}
                  <span className="text-primary font-bold">Archivo</span>).
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <PlusSquare className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  2. Selecciona{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Añadir al Dock…
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  3. Confirma en <span className="text-primary font-bold">Añadir</span> para abrir
                  RU Coach como app independiente en tu Mac.
                </p>
              </div>
            </div>
          )}

          {platform.guide === 'desktop-chromium' && (
            <div className="flex flex-col gap-3 py-3">
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <Download className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  1. Busca el ícono de{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Instalar RU Coach
                  </span>{' '}
                  en el lado derecho de la barra de direcciones (o abre el menú{' '}
                  <span className="text-primary font-bold">⋮</span>).
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <Monitor className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  2. En el menú, elige{' '}
                  <span className="text-primary underline underline-offset-4 decoration-2">
                    Guardar y compartir → Instalar página como aplicación
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="size-10 shrink-0 rounded-lg bg-background flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <p className="text-sm font-semibold leading-snug">
                  3. Confirma en <span className="text-primary font-bold">Instalar</span> para abrir
                  RU Coach en su propia ventana de escritorio.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              className="w-full h-12 font-black uppercase tracking-tighter bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all duration-300"
            >
              ¡Entendido!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
