'use client'

import { useEffect } from 'react'

const SW_RELOAD_GUARD_KEY = 'rucoach-sw-reload-guard-ts'
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
        try {
          const wasDismissed = localStorage.getItem(DISMISS_KEY) === '1'
          if (!wasDismissed) {
            e.preventDefault()
          }
        } catch {
          e.preventDefault()
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

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                const now = Date.now()
                const last = Number(sessionStorage.getItem(SW_RELOAD_GUARD_KEY) || 0)
                if (now - last < 8000) return
                sessionStorage.setItem(SW_RELOAD_GUARD_KEY, String(now))
                window.location.reload()
              }
            })
          })
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
