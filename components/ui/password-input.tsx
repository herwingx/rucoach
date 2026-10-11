'use client'

import * as React from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Button } from './button'

export interface PasswordRequirements {
  minLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  }
}

export function isPasswordValid(req: PasswordRequirements): boolean {
  return req.minLength && req.hasUpper && req.hasLower && req.hasNumber && req.hasSpecial
}

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  showValidation?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showValidation = false, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const strValue = typeof value === 'string' ? value : ''
    const requirements = getPasswordRequirements(strValue)

    return (
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            className={cn('pr-10 h-11 md:h-11', className)}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-11 w-10 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {showValidation && strValue.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">La contraseña debe incluir:</p>
            <ul className="flex flex-col gap-1 text-xs">
              <RequirementItem met={requirements.minLength} label="Mínimo 8 caracteres" />
              <RequirementItem met={requirements.hasUpper} label="Una mayúscula" />
              <RequirementItem met={requirements.hasLower} label="Una minúscula" />
              <RequirementItem met={requirements.hasNumber} label="Un número" />
              <RequirementItem met={requirements.hasSpecial} label="Un carácter especial (!@#$%^&*...)" />
            </ul>
          </div>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 transition-colors',
        met ? 'text-success' : 'text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
          met ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
        )}
      >
        {met ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      {label}
    </li>
  )
}

export { PasswordInput }
