'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Dumbbell, Activity, MessageCircle, Menu, Users, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'
import { useLayoutBasePath } from '@/hooks/use-layout-base-path'

const clientItems = [
  { label: 'Inicio', href: '/client/dashboard', icon: LayoutDashboard },
  { label: 'Rutinas', href: '/client/routines', icon: Dumbbell },
  { label: 'Historial', href: '/client/workouts', icon: Activity },
  { label: 'Mensajes', href: '/client/messages', icon: MessageCircle },
]

const adminItems = [
  { label: 'Inicio', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/admin/clients', icon: Users },
  { label: 'Builder', href: '/admin/routines/builder', icon: Layers },
  { label: 'Mensajes', href: '/admin/messages', icon: MessageCircle },
]

function activeMenuHref(path: string | null, items: {href: string}[]): string | null {
  if (!path) return null
  const ordered = [...items].sort((a, b) => b.href.length - a.href.length)
  for (const item of ordered) {
    if (path === item.href) return item.href
    if (item.href.endsWith('/dashboard') && path !== item.href) continue
    if (path.startsWith(`${item.href}/`)) return item.href
  }
  return null
}

export function MobileBottomNav({ type }: { type: 'client' | 'admin' }) {
  const path = useLayoutBasePath(`/${type}`)
  const items = type === 'client' ? clientItems : adminItems
  const activeHref = useMemo(() => activeMenuHref(path, items), [path, items])
  
  const { setOpenMobile } = useSidebar()

  return (
    <nav
      data-mobile-bottom-nav="true"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)] safe-area-pb"
    >
      <ul className="flex justify-around items-center h-[60px] px-1 sm:px-2">
        {items.map((item) => {
          const isActive = activeHref === item.href
          const Icon = item.icon
          return (
            <li key={item.href} className="flex-1 flex justify-center h-full">
              <Link
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-0.5 min-w-[44px] transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-xl",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center rounded-xl p-1 transition-all duration-300",
                  isActive ? "bg-primary/10 text-primary scale-110" : "bg-transparent text-muted-foreground scale-100"
                )}>
                  <Icon className="size-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium tracking-tight truncate px-1",
                  isActive ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
        <li className="flex-1 flex justify-center h-full">
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className="flex flex-col items-center justify-center w-full h-full gap-0.5 min-w-[44px] text-muted-foreground hover:text-foreground transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-xl"
            aria-label="Abrir menú"
          >
            <div className="flex items-center justify-center rounded-xl p-1 transition-all duration-300 bg-transparent text-muted-foreground scale-100">
              <Menu className="size-[22px]" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium tracking-tight truncate px-1 text-muted-foreground">
              Menú
            </span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
