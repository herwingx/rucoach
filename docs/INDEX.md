# Índice de Documentación — RU Coach

## Por Dónde Empezar

1. **[README Principal](../README.md)** — Visión general del proyecto, stack tecnológico, comandos y arranque rápido.
2. **[Resumen de Documentación (`docs/README.md`)](./README.md)** — Módulos implementados para el Coach, Asesorado y Recepción.
3. **[Guía de Base de Datos (`docs/DATABASE_GUIDE.md`)](./DATABASE_GUIDE.md)** — Cómo levantar el esquema completo (`supabase/supabase_schema_dump.sql`), los datos semilla (`supabase/seed.sql`) y los 1,324 ejercicios bilingües.
4. **[Guía de Despliegue (`docs/DEPLOYMENT.md`)](./DEPLOYMENT.md)** — Checklist completo para llevar la aplicación a producción en Vercel + Supabase + Cloudflare R2 + Resend.
5. **[Guía Maestra de Migración a Producción `rucoach.app` (`docs/MIGRACION_PRODUCCION_RUCOACH_APP.md`)](./MIGRACION_PRODUCCION_RUCOACH_APP.md)** — Paso a paso detallado para Name.com → Cloudflare → Resend → Nueva Cuenta de Supabase → Vercel y configuración de MCPs.

---

## Documentación Técnica y Operativa

### Arquitectura y Base de Datos
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**
  - Stack tecnológico (Next.js 16, React 19, Tailwind v4, Supabase, R2, Serwist PWA, Web Push)
  - Estructura completa del proyecto (`app/`, `components/`, `lib/`, `supabase/`, `emails/`)
  - Modelo de datos (19 tablas en PostgreSQL con RLS optimizado)
  - Flujos de autenticación, protección de rutas (`proxy.ts`) y notificaciones (`lib/push.ts` + `lib/email.ts`)
- **[`DATABASE_GUIDE.md`](./DATABASE_GUIDE.md)**
  - Esquema consolidado en `supabase/supabase_schema_dump.sql`
  - Semillas idempotentes en `supabase/seed.sql`
  - Script de migración de ejercicios bilingües (`scripts/migrate-exercises.ts`)
- **[`R2_MIGRATION_GUIDE.md`](./R2_MIGRATION_GUIDE.md)**
  - Configuración de Cloudflare R2, tokens S3, reglas CORS y subida masiva de GIFs con Rclone

### Manuales del Sistema de Entrenamiento y Biomecánica
- **[`ANATOMIA_Y_FUSION_OPEN_GYM.md`](./ANATOMIA_Y_FUSION_OPEN_GYM.md)**
  - Motor biomecánico y anatómico (`lib/anatomy/`) derivado de la fusión con Open-Gym
  - Arquitectura visual SVG y paleta de diseño integrada con la marca de RU Coach
  - Catálogo de componentes: `BodyMap`, `MuscleBalanceCard` (3 en 1), `ActivityHeatmap`, `MuscleExplorerPanel` y `WeeklyMuscleCoverage`
  - Requerimientos Mobile-First: rutinas continuas, series de aproximación y prevención de desbordes
  - Arquitectura de rendimiento Zero-Latency SPA
- **[`ROUTINES.md`](./ROUTINES.md)**
  - Creación y edición en el Constructor de Rutinas (`/admin/routines/builder`)
  - Rutinas continuas sin duración forzada y series de aproximación (`warmup_sets`)
  - Cobertura muscular en vivo y uso de Biseries/Superseries (`superset_group` A–E)
  - Asignación de rutinas, intercambio de ejercicios (`client_exercise_overrides`) y cambio de día (`override_next_day_id`)
- **[`PROGRESSION.md`](./PROGRESSION.md)**
  - Cómo funciona la sesión activa (`/client/workout/start`) y el registro serie por serie (con separación de calentamiento)
  - Resumen post-entrenamiento (`/client/workout/summary`) con músculos trabajados en vivo
  - Sensación post-entrenamiento (`feeling_score` 1–5) y notas al coach
  - Detección automática de Récords Personales (`personal_records` y `pr_events`)
  - Algoritmo de auto-progresión (`lib/auto-progression.ts`) y bloqueo de seguridad ante reportes de dolor (`client_pain_reports`)

### Historial de Auditorías y Mejoras Completadas
- **[`MEJORAS_PENDIENTES.md`](./MEJORAS_PENDIENTES.md)** — Registro histórico de fixes y mejoras cerradas al 100%
- **[`PLAN_MEJORAS_PREMIUM.md`](./PLAN_MEJORAS_PREMIUM.md)** — Hoja de ruta de funcionalidades premium (todas las fases 1 y 2 completadas)

---

## Mapa de Archivos Clave del Repositorio

```text
gym-coaching/
├── README.md                          # Guía principal del repositorio
├── proxy.ts                           # Middleware de sesión y rutas en Next.js 16
├── next.config.mjs                    # Configuración de Next.js 16, Serwist PWA y headers de seguridad
├── supabase/
│   ├── supabase_schema_dump.sql       # Esquema maestro PostgreSQL (19 tablas, triggers, RLS, Storage, Realtime)
│   └── seed.sql                       # Datos semilla (logros de gamificación y planes de membresía)
├── app/
│   ├── sw.ts                          # Service Worker (Serwist + receptor de notificaciones Web Push)
│   ├── actions/                       # Server Actions (workout, routines, overrides, payments, messages, R2, push)
│   ├── auth/                          # Flujos de login, registro, OTP, recuperación y admin-setup
│   ├── onboarding/                    # Onboarding de 4 pasos para el asesorado
│   ├── admin/                         # Portal del Coach (dashboard, clients, routines, exercises, payments, messages, settings)
│   ├── client/                        # Portal del Asesorado (dashboard, routines, workout, progress, measurements, photos, calendar, achievements, messages, profile)
│   └── receptionist/                  # Portal de Recepción (dashboard, check-in, clients, payments)
├── components/
│   ├── admin/                         # Componentes del panel de Coach
│   ├── client/                        # Componentes del portal del Asesorado
│   ├── chat/                          # Chat en tiempo real (Coach <-> Asesorado)
│   ├── charts/                        # Gráficas de progreso, volumen y medidas (Recharts / TanStack Charts)
│   ├── photos/                        # Subida a R2, galería y comparador Antes/Después
│   ├── routines/                      # Tarjetas de días y ejercicios con soporte de superseries
│   └── ui/                            # Sistema de componentes base (shadcn/ui + Radix UI)
├── lib/
│   ├── supabase/                      # Clientes Supabase (browser, server, admin, proxy)
│   ├── auto-progression.ts            # Motor de auto-progresión y protección por dolor
│   ├── gamification.ts                # Motor de XP, niveles, rachas y desbloqueo de logros
│   ├── push.ts                        # Envío de notificaciones Web Push (VAPID) en servidor
│   ├── email.ts                       # Envío de correos transaccionales con Resend
│   └── r2.ts                          # Cliente S3 para Cloudflare R2
└── emails/
    ├── *.tsx                          # Plantillas React Email (Bienvenida, Invitación, Nueva Rutina, Pago)
    └── supabase/*.html                # Plantillas HTML para pegar en Supabase Auth Dashboard
```
