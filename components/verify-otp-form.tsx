'use client'

import { createClient } from '@/lib/supabase/client'
import { syncProfileRole } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

function VerifyOtpFormInner({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailVal = searchParams.get('email') || ''
  const typeParam = searchParams.get('type')
  const otpType = typeParam === 'recovery' ? 'recovery' : 'signup'
  
  const [email] = useState(emailVal)
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('No se encontró un correo electrónico válido. Inicia sesión de nuevo.')
      router.push('/auth/login')
      return
    }

    if (token.length < 6 || token.length > 8) {
      toast.error('El código debe tener entre 6 y 8 dígitos.')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      if (otpType === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'recovery',
        })

        if (error) {
          throw error
        }

        toast.success('Código verificado. Crea tu nueva contraseña.')
        router.push('/auth/reset-password')
        return
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      })

      if (error) {
        throw error
      }

      if (data.session) {
        const roleFromMeta = data.user?.user_metadata?.role as string | undefined
        const role = roleFromMeta ?? 'client'
        const userId = data.user?.id

        if (userId && role === 'admin') {
          await syncProfileRole(userId, 'admin')
        }

        toast.success('¡Cuenta verificada correctamente!')
        router.push(role === 'admin' ? '/admin/onboarding' : '/onboarding')
      }
    } catch (error: any) {
      const msg = error.message || ''
      console.error('[auth] verifyOtp failed:', error)
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        toast.error('El código es incorrecto o ya expiró.')
      } else {
        toast.error(msg || 'Ocurrió un error al verificar. Intenta de nuevo.')
      }
      setToken('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      toast.error('No se encontró tu correo electrónico.')
      return
    }

    setIsResending(true)
    const supabase = createClient()

    try {
      if (otpType === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password&type=recovery`,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        })
        if (error) throw error
      }

      toast.success('Te hemos enviado un nuevo código de verificación.')
    } catch (error: any) {
      const msg = error.message || ''
      console.error('[auth] resend OTP failed:', error)
      if (msg.includes('rate limit') || msg.includes('429')) {
        toast.error('Por favor, espera un minuto antes de pedir otro código.')
      } else {
        toast.error(msg || 'No pudimos reenviar el código. Intenta de nuevo.')
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6 w-full items-center', className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center overflow-hidden">
        <h1 className="text-2xl font-bold tracking-tight">
          {otpType === 'recovery' ? 'Recupera tu contraseña' : 'Verifica tu correo'}
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          {otpType === 'recovery' ? (
            <>
              Ingresa el código que enviamos a{' '}
              <span className="font-medium text-foreground">{email || 'tu correo'}</span>{' '}
              para restablecer tu contraseña.
            </>
          ) : (
            <>
              Enviamos un código de verificación a{' '}
              <span className="font-medium text-foreground">{email || 'tu correo'}</span>.
              Ingrésalo abajo para activar tu cuenta.
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col items-center gap-6 w-full">
        <InputOTP
          maxLength={8}
          value={token}
          onChange={setToken}
          disabled={isLoading || isResending}
          autoFocus
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-8 sm:w-10 h-11 sm:h-12 text-base font-semibold" />
            <InputOTPSlot index={1} className="w-8 sm:w-10 h-11 sm:h-12 text-base font-semibold" />
            <InputOTPSlot index={2} className="w-8 sm:w-10 h-11 sm:h-12 text-base font-semibold" />
            <InputOTPSlot index={3} className="w-8 sm:w-10 h-11 sm:h-12 text-base font-semibold" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={4} className="w-8 sm:w-10 h-11 sm:h-12 text-base font-semibold" />
            <InputOTPSlot index={5} className="w-8 sm:w-10 h-11 sm:h-12 text-base font-semibold" />
            <InputOTPSlot index={6} className="w-8 sm:w-10 h-11 sm:h-12 text-base font-semibold" />
            <InputOTPSlot index={7} className="w-8 sm:w-10 h-11 sm:h-12 text-base font-semibold" />
          </InputOTPGroup>
        </InputOTP>

        <Button
          type="submit"
          disabled={isLoading || token.length < 6}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-all duration-200"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Validando...
            </span>
          ) : (
            'Verificar código'
          )}
        </Button>
      </form>

      <div className="text-center mt-4 border-t pt-6 w-full border-border/50">
        <p className="text-sm text-muted-foreground mb-4">
          ¿No recibiste el correo o se te pasó el tiempo?
        </p>
        <Button
          variant="outline"
          onClick={handleResendCode}
          disabled={isResending || isLoading}
          className="w-full h-11 font-semibold text-muted-foreground"
        >
          {isResending ? 'Reenviando...' : 'Reenviar código de verificación'}
        </Button>
      </div>
    </div>
  )
}

export function VerifyOtpForm(props: React.ComponentProps<'div'>) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-muted-foreground animate-pulse">
          Cargando entorno seguro...
        </div>
      }
    >
      <VerifyOtpFormInner {...props} />
    </Suspense>
  )
}
