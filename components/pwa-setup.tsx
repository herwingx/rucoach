'use client'

import { useEffect } from 'react'

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

      const handleBeforeInstall = (e: Event) => {
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

      // En desarrollo registramos únicamente el SW ligero de Push (/push-sw.js, sin caché Workbox)
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker
          .register('/push-sw.js', { scope: '/' })
          .catch(() => {})
        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
          window.removeEventListener('appinstalled', handleAppInstalled)
        }
      }

      let updateInterval: ReturnType<typeof setInterval> | null = null

      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() =>
          navigator.serviceWorker.register('/push-sw.js', { scope: '/' }),
        )
        .then((registration) => {
          if (!registration) return
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
