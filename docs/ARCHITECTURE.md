# Arquitectura Técnica — RU Coach

## Resumen

**RU Coach (Rodrigo Urbina Personal Coaching)** es una aplicación web progresiva (**PWA**) de entrenamiento personalizado construida sobre **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Supabase (PostgreSQL + Auth + Realtime + Storage)**, **Cloudflare R2**, **Resend** y **Web Push (VAPID)**.

---

## Stack Tecnológico

```text
FRONTEND & UI
├── Next.js 16.2.1 (App Router, Server Components, Server Actions, proxy.ts)
├── React 19.2.4 + TypeScript 5.9 (target ES2022)
├── Tailwind CSS v4.2 (@tailwindcss/postcss) + variables OKLCH semánticas (Dark / Light)
├── shadcn/ui + Radix UI Primitives + Lucide React Icons
├── @dnd-kit (Drag & Drop en el Constructor de Rutinas)
├── Recharts + @tanstack/charts (Analítica de Fuerza, Volumen y Medidas)
└── @img-comparison-slider/react (Comparador Antes / Después de Fotos)

BACKEND & DATOS
├── Supabase Auth (PKCE, Token Hash, OTP de 6-8 dígitos, Roles en metadata y profiles)
├── Supabase PostgreSQL (19 tablas con RLS optimizado mediante InitPlan `(select auth.uid())`)
├── Supabase Realtime (Canal en vivo para `public.messages` con INSERT y UPDATE de lectura)
├── Cloudflare R2 (@aws-sdk/client-s3 + URLs pre-firmadas con control de acceso por rol/propietario)
├── Resend + @react-email/components (Correos transaccionales de invitación, bienvenida, rutina y pago)
└── Web Push (VAPID con `web-push` en `lib/push.ts` + Service Worker en `app/sw.ts`)
```

---

## Estructura de Directorios

```text
gym-coaching/
├── proxy.ts                            # Proxy de Next.js 16 (refresco de sesión Supabase y cabeceras x-pathname)
├── next.config.mjs                     # Configuración Next.js 16 + Serwist PWA + Security Headers
├── app/
│   ├── layout.tsx                      # Root Layout (Geist Sans/Mono, ThemeProvider, Toaster, PWAInstallCTA)
│   ├── globals.css                     # Tokens de diseño OKLCH, contraste accesible en modo claro y utilidades safe-area
│   ├── sw.ts                           # Service Worker (caché offline Serwist + eventos push y notificationclick)
│   ├── manifest.ts                     # Web App Manifest para instalación PWA en iOS/Android/Desktop
│   ├── robots.ts / sitemap.ts          # SEO técnico dinámico
│   ├── error.tsx / not-found.tsx       # Páginas globales de error y 404
│   ├── offline/page.tsx                # Fallback sin conexión
│   ├── suspended/page.tsx              # Pantalla de cuenta pausada/vencida con contacto directo al Coach
│   ├── auth/
│   │   ├── login/page.tsx              # Inicio de sesión
│   │   ├── sign-up/page.tsx            # Registro con validación de código de invitación
│   │   ├── verify-otp/page.tsx         # Verificación de código OTP (registro y recuperación)
│   │   ├── forgot-password/page.tsx    # Solicitud de recuperación de contraseña
│   │   ├── reset-password/page.tsx     # Cambio de contraseña (soporta PKCE, token_hash y OTP)
│   │   ├── callback/route.ts           # Route Handler unificado para intercambiar código/token por sesión
│   │   └── admin-setup/page.tsx        # Creación del primer administrador protegido por ADMIN_SETUP_CODE
│   ├── onboarding/                     # Flujo guiado de 4 pasos para nuevos asesorados
│   ├── admin/                          # Portal del Coach / Administrador
│   │   ├── layout.tsx                  # Verificación de rol admin + redirección a /admin/onboarding si aplica
│   │   ├── onboarding/                 # Configuración inicial del gimnasio/marca en 2 pasos
│   │   ├── dashboard/                  # Vista ejecutiva de asesorados, alertas, KPIs y gráfica semanal
│   │   ├── clients/                    # Directorio, creación, asignaciones y Hub 360° (/admin/clients/[clientId])
│   │   ├── routines/                   # Catálogo de rutinas, detalle y Constructor Visual (/admin/routines/builder)
│   │   ├── exercises/                  # Catálogo bilingüe de 1,324 ejercicios y creación de ejercicios propios
│   │   ├── payments/                   # Gestión de cobros, estados de membresía y edición de pagos
│   │   ├── invitations/                # Generación y administración de códigos de invitación
│   │   ├── messages/                   # Inbox de chat en tiempo real con todos los asesorados
│   │   └── settings/                   # Configuración de marca, Planes y Tarifas, perfil del coach y Web Push
│   ├── client/                         # Portal del Asesorado
│   │   ├── layout.tsx                  # Verificación de rol client, vigencia de membresía y onboarding
│   │   ├── dashboard/                  # Nivel/XP, racha, próximo entrenamiento, gráfica e hitos
│   │   ├── routines/                   # Rutina activa, visor de técnica, cambio de ejercicio y cambio de día
│   │   ├── workout/start/              # Sesión de entrenamiento en vivo con cronómetro y sensación post-entreno (1–5)
│   │   ├── workout/summary/            # Resumen de sesión, PRs, desglose de series, logros y auto-progresión
│   │   ├── workouts/                   # Historial filtrable por rango de fechas
│   │   ├── progress/                   # Analítica de fuerza y volumen por ejercicio + insights
│   │   ├── measurements/               # Registro y gráficas de 7 medidas corporales
│   │   ├── photos/                     # Galería en R2 y comparador interactivo Antes / Después
│   │   ├── calendar/                   # Calendario mensual de entrenamientos
│   │   ├── achievements/               # Vitrina de logros, medallas y rachas
│   │   ├── messages/                   # Chat directo en tiempo real con el Coach
│   │   └── profile/                    # Perfil físico/médico, reporte de dolor, contraseña y Web Push
│   ├── receptionist/                   # Portal de Recepción (dashboard, check-in, clientes, pagos)
│   └── actions/                        # Server Actions protegidas en servidor
│       ├── clients.ts                  # Creación/edición/suspensión de clientes
│       ├── exercises.ts                # Creación de ejercicios personalizados con mapeo bilingüe
│       ├── gym-settings.ts             # Configuración del gym, perfil del coach y CRUD de membership_plans
│       ├── invitations.ts              # Generación y revocación de invitaciones
│       ├── measurements.ts             # Registro de medidas antropométricas y chequeo de logros
│       ├── messages.ts                 # Envío de mensajes, marcado de lectura y notificación Push
│       ├── onboarding.ts               # Finalización de onboarding (cliente/admin), email de bienvenida y Push
│       ├── payments.ts                 # Registro/actualización de pagos, vigencia de membresía, email y Push
│       ├── profile.ts                  # Actualización de perfil y avatar del cliente
│       ├── r2-storage.ts               # Generación de Presigned URLs (PUT/GET) y borrado seguro en Cloudflare R2
│       ├── routine-assignment.ts       # Asignación de rutinas y cálculo de `getNextWorkoutDay`
│       ├── routine-builder.ts          # Guardado y edición por lotes de rutinas, días y ejercicios
│       ├── routine-overrides.ts        # Sustitución de ejercicios, reportes de dolor y resolución clínica
│       ├── schedule-override.ts        # Cambio temporal del próximo día de entrenamiento (`override_next_day_id`)
│       ├── web-push.ts                 # Suscripción y baja de endpoints Web Push del usuario autenticado
│       └── workout.ts                  # Guardado de sesiones, series, PRs, XP/rachas y resumen de sesión
```

---

## Modelo de Base de Datos (19 Tablas en `public`)

Definido íntegramente en [`supabase/supabase_schema_dump.sql`](../supabase/supabase_schema_dump.sql):

### 1. Identidad, Administración y Pagos
- **`profiles`**: Extiende `auth.users` (`id`, `email`, `full_name`, `role` [`admin` | `client` | `receptionist`], `avatar_url`, `phone`, `birth_date`, `gender`, `bio`, `specialties`, `certifications`, `onboarding_completed`).
- **`clients`**: Ficha integral del asesorado (`user_id`, `coach_id`, `full_name`, `email`, `status`, `membership_plan_id`, `membership_status`, `membership_start_date`, `membership_end_date`, `assigned_routine_id`, `weight`, `height_cm`, `fitness_goal`, `experience_level`, `injuries`, `medical_conditions`, `notes`, `xp`, `level`, `current_streak`, `longest_streak`, `last_workout_date`, `last_session_at`).
- **`membership_plans`**: Planes y tarifas configurables por el coach (`name`, `description`, `price`, `duration_days`, `features`, `is_active`).
- **`payments`**: Historial financiero (`client_id`, `membership_plan_id`, `amount`, `payment_method`, `status`, `paid_at`, `period_start`, `period_end`, `notes`, `registered_by`).
- **`invitation_codes`**: Códigos de acceso para nuevos clientes o coaches (`code`, `coach_id`, `client_id`, `for_role`, `email`, `client_name`, `plan_id`, `status`, `expires_at`, `used_by`).
- **`gym_settings`**: Configuración del gimnasio/marca por coach (`coach_id`, `gym_name`, `phone`, `address`, `business_hours`, `currency`, `timezone`, `logo_url`).
- **`admin_setup`**: Registro de auditoría de activación del administrador inicial.

### 2. Rutinas, Ejercicios y Personalización Dinámica
- **`exercises`**: Catálogo de 1,324 ejercicios con columnas bilingües (`name` / `name_es`, `body_parts` / `body_parts_es`, `target_muscles` / `target_muscles_es`, `secondary_muscles` / `secondary_muscles_es`, `equipments` / `equipments_es`, `instructions` / `instructions_es`, `gif_url`, `exercise_type`, `uses_external_load`).
- **`routines`**: Programas de entrenamiento (`coach_id`, `name`, `description`, `duration_weeks`, `days_per_week`, `goal`, `level`, `is_template`, `is_active`).
- **`routine_days`**: Días dentro de una rutina (`routine_id`, `day_number`, `name`, `description`, `is_rest_day`).
- **`routine_exercises`**: Ejercicios prescritos en cada día (`routine_day_id`, `exercise_id`, `order_index`, `sets`, `reps`, `base_weight`, `rest_seconds`, `superset_group`, `notes`).
- **`client_routines`**: Asignación activa o histórica de una rutina a un cliente (`client_id`, `routine_id`, `assigned_by`, `start_date`, `end_date`, `current_week`, `status`, `notes`, `override_next_day_id`).
- **`client_exercise_overrides`**: Sustituciones individuales de ejercicios realizadas por el asesorado o el coach (`client_routine_id`, `original_routine_exercise_id`, `replacement_exercise_id`, `reason`, `changed_by`, `notified_coach`).
- **`routine_week_progress`**: Seguimiento semanal de adherencia y progresión de la rutina asignada.

### 3. Entrenamiento, Progresión Clínica y Gamificación
- **`workout_sessions`**: Sesiones de entrenamiento (`client_id`, `routine_id`, `routine_day_id`, `started_at`, `completed_at`, `duration_minutes`, `total_volume`, `exercises_completed`, `status`, `feeling_score` [1–5], `feeling_note`, `xp_earned`, `prs_count`).
- **`exercise_logs`**: Series registradas (`workout_session_id`, `routine_exercise_id`, `exercise_id`, `set_number`, `weight_kg`, `reps`, `duration_seconds`, `rpe`, `is_warmup`, `completed`, `is_pr`, `notes`).
- **`personal_records`**: Récord personal vigente por cliente y ejercicio (`client_id`, `exercise_id`, `max_weight`, `max_reps_at_weight`, `estimated_1rm`, `achieved_at`, `previous_max_weight`).
- **`pr_events`**: Historial cronológico de cada récord batido para gráficas de progreso.
- **`client_pain_reports`**: Reportes clínicos de dolor o molestia física (`client_id`, `body_part`, `severity` [1–10], `notes`, `active`, `reported_at`, `resolved_at`).
- **`achievements`** y **`user_achievements`**: Catálogo de medallas y logros desbloqueados por usuario.

### 4. Antropometría, Fotos, Chat y Notificaciones Push
- **`body_measurements`**: Historial de 7 medidas corporales (`weight`, `body_fat_pct`, `waist_cm`, `hip_cm`, `chest_cm`, `arm_cm`, `thigh_cm`, `recorded_at`).
- **`progress_photos`**: Metadatos de fotos de progreso (`client_id`, `photo_url`, `category` [`front` | `side` | `back`], `weight_kg`, `notes`, `taken_at`).
- **`messages`**: Mensajería directa en tiempo real (`from_user_id`, `to_user_id`, `content`, `is_read`, `created_at`).
- **`push_subscriptions`**: Suscripciones Web Push VAPID por dispositivo (`user_id`, `endpoint`, `p256dh`, `auth`).

---

## Flujos Clave de Ingeniería

### 1. Ciclo Cerrado Coach $\leftrightarrow$ Asesorado
1. **Prescripción**: El coach diseña la rutina en `/admin/routines/builder` (con soporte de biseries A–E) y la asigna al cliente (`assignRoutineToClient`). El cliente recibe correo por Resend y notificación Web Push (`notifyUser`).
2. **Adaptación en Piso**: Si una máquina está ocupada o el cliente siente molestia, puede intercambiar el ejercicio (`swapExerciseForClient`) o cambiar el día a entrenar hoy (`setNextRoutineDayOverride`). El coach recibe una notificación Push inmediata y ve las sustituciones activas en la pestaña **Rutina** del perfil del cliente, pudiendo revertirlas en cualquier momento (`revertExerciseOverride`).
3. **Ejecución y Feedback**: Al terminar su sesión en `/client/workout/start`, el cliente califica su sensación de esfuerzo (`1–5`) y deja una nota opcional. `completeWorkoutSession` guarda las series en lote, detecta PRs, otorga XP/racha, limpia `override_next_day_id`, avisa al coach por Push y muestra el resumen en `/client/workout/summary`.
4. **Protección Clínica por Dolor**: Si el cliente registra una molestia en `/client/profile` (`reportClientPain`), el motor de auto-progresión (`lib/auto-progression.ts`) bloquea aumentos automáticos de peso en los grupos musculares afectados cuando `severity >= 4`, y el coach visualiza una alerta roja en la parte superior de `/admin/clients/[clientId]` hasta marcarla como resuelta (`resolveClientPainReport`).

### 2. Seguridad y Almacenamiento en Cloudflare R2
- Todas las operaciones sobre Cloudflare R2 pasan por [`app/actions/r2-storage.ts`](../app/actions/r2-storage.ts).
- Antes de firmar una URL de subida/lectura (`getR2PresignedUrl`) o eliminar un objeto (`deleteR2Object`), el servidor verifica que el usuario sea `admin` o que el prefijo del archivo (`clients/{clientId}/`, `progress-photos/{clientId}/` o `avatars/{userId}/`) pertenezca estrictamente al usuario autenticado, bloqueando cualquier intento de *path traversal* (`..`).

### 3. Notificaciones Web Push (`lib/push.ts` + `app/sw.ts`)
- [`lib/push.ts`](../lib/push.ts) está protegido con `import "server-only"` y expone `notifyUser(userId, payload)` para ser invocado exclusivamente desde Server Actions autenticadas.
- Si un endpoint devuelve HTTP `404` o `410` (suscripción expirada o revocada en el navegador), se elimina automáticamente de `public.push_subscriptions`.
