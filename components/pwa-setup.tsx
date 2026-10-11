'use client'

import { useEffect } from 'react'

const DISMISS_KEY = 'rucoach-pwa-install-dismissed-v1'

export type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    __rucoachDeferredPrompt?: DeferredPromptEvent | null
  }
}

export function PWASetup() {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return

      // Capturar beforeinstallprompt lo antes posible (incluso en /auth/login)
      // para que esté disponible al entrar al dashboard o abrir el menú lateral.
      const handleBeforeInstall = (e: Event) => {
        const path = window.location.pathname || ''
        const isAuthOrPublic =
          path.startsWith('/auth') ||
          path === '/login' ||
          path === '/signup' ||
          path === '/welcome' ||
          path === '/offline' ||
          path === '/suspended'

        try {
          const wasDismissed = localStorage.getItem(DISMISS_KEY) === '1'
          if (!wasDismissed && !isAuthOrPublic) {
            e.preventDefault()
          }
        } catch {
          if (!isAuthOrPublic) {
            e.preventDefault()
          }
        }
        window.__rucoachDeferredPrompt = e as DeferredPromptEvent
        window.dispatchEvent(new CustomEvent('rucoach:pwa-prompt-ready'))
      }

      const handleAppInstalled = () => {
        window.__rucoachDeferredPrompt = null
        window.dispatchEvent(new CustomEvent('rucoach:pwa-installed'))
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstall)
      window.addEventListener('appinstalled', handleAppInstalled)

      if (!('serviceWorker' in navigator)) {
        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
          window.removeEventListener('appinstalled', handleAppInstalled)
        }
      }

      // En dev el SW + HMR provocan updates constantes; el reload automático puede buclear la app.
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
          .catch(() => {})

        if ('caches' in window) {
          caches
            .keys()
            .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
            .catch(() => {})
        }
        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
          window.removeEventListener('appinstalled', handleAppInstalled)
        }
      }

      let updateInterval: ReturnType<typeof setInterval> | null = null

      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          updateInterval = setInterval(() => {
            registration.update().catch(() => {})
          }, 60_000)
        })
        .catch(() => {})

      return () => {
        if (updateInterval) clearInterval(updateInterval)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    } catch {
      // PWA is optional - fail silently
    }
  }, [])

  return null
}
