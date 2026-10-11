'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type AdminCardMenuItem = {
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: 'default' | 'destructive'
  className?: string
}

export type AdminCardMenuSection = {
  items: AdminCardMenuItem[]
  separatorBefore?: boolean
}

function renderMenuItems(sections: AdminCardMenuSection[], itemProps: { onClose?: () => void }) {
  const elements: React.ReactNode[] = []
  sections.forEach((section, sectionIdx) => {
    if (section.separatorBefore && sectionIdx > 0) {
      elements.push(<ContextMenuSeparator key={`sep-${sectionIdx}`} />)
    }
    section.items.forEach((item, itemIdx) => {
      const key = `${sectionIdx}-${itemIdx}`
      const content = (
        <>
          {item.icon}
          {item.label}
        </>
      )
      if (item.href) {
        elements.push(
          <ContextMenuItem key={key} asChild>
            <Link href={item.href}>{content}</Link>
          </ContextMenuItem>
        )
      } else {
        elements.push(
          <ContextMenuItem
            key={key}
            onClick={() => {
              item.onClick?.()
              itemProps.onClose?.()
            }}
            variant={item.variant}
            className={item.className}
          >
            {content}
          </ContextMenuItem>
        )
      }
    })
  })
  return elements
}

function renderDropdownItems(sections: AdminCardMenuSection[], itemProps: { onClose?: () => void }) {
  const elements: React.ReactNode[] = []
  sections.forEach((section, sectionIdx) => {
    if (section.separatorBefore && sectionIdx > 0) {
      elements.push(<DropdownMenuSeparator key={`sep-${sectionIdx}`} />)
    }
    section.items.forEach((item, itemIdx) => {
      const key = `${sectionIdx}-${itemIdx}`
      const content = (
        <>
          {item.icon}
          {item.label}
        </>
      )
      if (item.href) {
        elements.push(
          <DropdownMenuItem key={key} asChild>
            <Link href={item.href}>{content}</Link>
          </DropdownMenuItem>
        )
      } else {
        elements.push(
          <DropdownMenuItem
            key={key}
            onClick={() => {
              item.onClick?.()
              itemProps.onClose?.()
            }}
            variant={item.variant}
            className={item.className}
          >
            {content}
          </DropdownMenuItem>
        )
      }
    })
  })
  return elements
}

interface AdminCardWithActionsProps {
  children: React.ReactNode
  menuSections: AdminCardMenuSection[]
  className?: string
  cardClassName?: string
}

export function AdminCardWithActions({
  children,
  menuSections,
  className,
  cardClassName,
}: AdminCardWithActionsProps) {
  const contextContent = (
    <ContextMenuContent className="w-48">
      <ContextMenuGroup>{renderMenuItems(menuSections, { onClose: () => {} })}</ContextMenuGroup>
    </ContextMenuContent>
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className={cn(
            'py-0 gap-0 group overflow-hidden rounded-xl transition-[box-shadow,border-color,background-color] duration-200',
            'hover:border-border hover:bg-accent/25 hover:shadow-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            cardClassName,
            className,
          )}
        >
          {children}
        </Card>
      </ContextMenuTrigger>
      {contextContent}
    </ContextMenu>
  )
}

interface AdminCardHeaderWithActionsProps {
  children: React.ReactNode
  menuSections: AdminCardMenuSection[]
}

/** Renders CardHeader content with 3-dot DropdownMenu. Use inside AdminCardWithActions or standalone with ContextMenu. */
export function AdminCardHeaderWithActions({ children, menuSections }: AdminCardHeaderWithActionsProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  const dropdownContent = (
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuGroup>
        {renderDropdownItems(menuSections, { onClose: () => setDropdownOpen(false) })}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  )

  return (
    <CardHeader className="p-4 pb-0">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">{children}</div>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 -mr-2 shrink-0">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          {dropdownContent}
        </DropdownMenu>
      </div>
    </CardHeader>
  )
}
