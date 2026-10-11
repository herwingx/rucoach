# RU Coach — Guía de Despliegue a Producción

## Requisitos Previos

- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com) u otro hosting compatible con Next.js 16
- Cuenta en [Cloudflare R2](https://cloudflare.com) para GIFs de ejercicios, fotos de progreso y avatares
- Cuenta en [Resend](https://resend.com) con dominio verificado para correos transaccionales
- Node.js 20+ y `pnpm`

---

## 1. Configurar Supabase

### A. Ejecutar el Esquema Maestro y Semillas
1. Crea un nuevo proyecto en Supabase.
2. Abre el **SQL Editor** en Supabase y ejecuta el contenido completo de [`supabase/supabase_schema_dump.sql`](file:///home/herwingx/Development/gym-coaching/supabase/supabase_schema_dump.sql).
   - Esto crea las **19 tablas**, funciones, triggers (`on_auth_user_created`, sincronización de avatares y última sesión), políticas RLS optimizadas, los buckets de Storage (`progress-photos` privado y `avatars` público) y habilita Realtime en `public.messages`.
3. En el mismo **SQL Editor**, ejecuta [`supabase/seed.sql`](file:///home/herwingx/Development/gym-coaching/supabase/seed.sql) para poblar el catálogo oficial de logros (`public.achievements`) y los planes base (`public.membership_plans`).

### B. Cargar los 1,324 Ejercicios (Bilingües EN/ES)
Agrega temporalmente en tu `.env.local`:
```env
TARGET_SUPABASE_URL=https://<nuevo_proyecto>.supabase.co
TARGET_SERVICE_ROLE_KEY=<service_role_key_nuevo>
```
Y ejecuta:
```bash
npx tsx scripts/migrate-exercises.ts
```
> Consulta [`docs/DATABASE_GUIDE.md`](./DATABASE_GUIDE.md) para más detalles.

### C. Configurar Authentication y Plantillas de Correo en Supabase
1. Ve a **Authentication → URL Configuration**:
   - **Site URL**: `https://tu-dominio.com`
   - **Redirect URLs**:
     - `https://tu-dominio.com/auth/callback`
     - `https://tu-dominio.com/auth/confirm`
     - `https://tu-dominio.com/auth/reset-password`
     - `http://localhost:3000/auth/callback` (para desarrollo local)
2. Ve a **Authentication → Email Templates** y pega las plantillas HTML personalizadas ubicadas en [`emails/supabase/`](file:///home/herwingx/Development/gym-coaching/emails/supabase):
   - `supabase-confirm-signup.html` (Confirm signup — incluye enlace y código OTP `{{ .Token }}`)
   - `supabase-reset-password.html` (Reset password — incluye botón y código OTP `{{ .Token }}`)
   - `supabase-magic-link.html` (Magic Link)
   - `supabase-invite-user.html` (Invite user)
   - `supabase-change-email.html` (Change Email Address)
   - `supabase-reauthentication.html` (Reauthentication)

---

## 2. Variables de Entorno en Producción

Configura las siguientes variables en el panel de tu plataforma de despliegue (ej. Vercel → Project Settings → Environment Variables):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable / Anon key de Supabase | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Secret / Service role key (solo servidor) | `sb_secret_...` |
| `NEXT_PUBLIC_APP_URL` | URL pública base de la aplicación | `https://ru-coach.app` |
| `ADMIN_SETUP_CODE` | Código secreto para registrar el primer admin | `RUCOACH2026` |
| `RESEND_API_KEY` | API Key de Resend para emails transaccionales | `re_xxxxxxxxx` |
| `EMAIL_FROM` | Remitente verificado en Resend | `RU Coach <noreply@tudominio.com>` |
| `R2_ACCOUNT_ID` | Account ID de Cloudflare | `a1b2c3d4e5...` |
| `R2_ACCESS_KEY_ID` | Access Key S3 de Cloudflare R2 | `xxxxxxxx` |
| `R2_SECRET_ACCESS_KEY` | Secret Key S3 de Cloudflare R2 | `xxxxxxxx` |
| `R2_BUCKET_NAME` | Nombre del bucket en Cloudflare R2 | `gymcoaching-exercises` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | URL pública del bucket o CDN de R2 | `https://pub-xxx.r2.dev` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave pública VAPID para Web Push (cliente + servidor) | `BExxx...` |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID para Web Push (solo servidor) | `xxx...` |

> **Nota sobre llaves VAPID:** Puedes generar un par nuevo ejecutando `npx web-push generate-vapid-keys`. El cliente lee `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y el servidor (`lib/push.ts`) acepta `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (o `VAPID_PUBLIC_KEY`) junto con `VAPID_PRIVATE_KEY`.

---

## 3. Primer Administrador (Coach)

1. Una vez desplegada la aplicación, visita `https://tu-dominio.com/auth/admin-setup`.
2. Ingresa el código configurado en `ADMIN_SETUP_CODE`.
3. Completa el registro inicial (nombre del gimnasio/marca, nombre del coach, correo y contraseña).
4. Completa el onboarding de 2 pasos en `/admin/onboarding` (datos del negocio, moneda, zona horaria).
5. En `/admin/settings`:
   - Revisa o personaliza tus **Planes y Tarifas** en la pestaña *Planes y Tarifas*.
   - Activa las **Notificaciones Push en este dispositivo** desde la pestaña *Perfil del Coach* para recibir alertas en tiempo real de tus asesorados.

---

## 4. Despliegue con Vercel CLI

```bash
# 1. Vincular el proyecto
vercel link

# 2. Verificar que el build de producción pasa localmente sin errores
pnpm exec tsc --noEmit
pnpm lint
pnpm build

# 3. Desplegar a producción
vercel --prod
```

---

## 5. Checklist Post-Despliegue

- [ ] `supabase/supabase_schema_dump.sql` ejecutado sin errores en Supabase SQL Editor.
- [ ] `supabase/seed.sql` ejecutado (logros y planes base creados).
- [ ] `scripts/migrate-exercises.ts` ejecutado (1,324 ejercicios bilingües disponibles).
- [ ] Plantillas HTML de `emails/supabase/*.html` configuradas en Supabase Auth.
- [ ] Regla CORS configurada en Cloudflare R2 permitiendo el dominio de producción.
- [ ] Todas las variables de entorno configuradas en Vercel (incluyendo R2 y VAPID).
- [ ] Primer administrador creado en `/auth/admin-setup` y onboarding completado.
- [ ] Notificaciones Web Push activadas en el navegador/PWA del Coach (`/admin/settings`).
- [ ] Prueba de ciclo completo: invitar cliente → onboarding cliente → asignar rutina → completar entrenamiento con sensación (1–5) → verificar recepción de Push y visualización en `/admin/clients/[clientId]`.
