# RU Coach — Registro de Auditoría y Mejoras Completadas

## Resumen Ejecutivo

Todas las mejoras funcionales, de arquitectura, base de datos, seguridad, diseño responsive y ciclo Coach $\leftrightarrow$ Asesorado identificadas en las auditorías del proyecto han sido **100% resueltas y verificadas con 0 deuda técnica**.

---

## Checklist de Módulos Cerrados al 100%

### 1. Base de Datos, Replicabilidad y Seguridad
- [x] **Esquema Maestro Único (`supabase/supabase_schema_dump.sql`)**: Incluye las 19 tablas del sistema (`profiles`, `clients`, `membership_plans`, `payments`, `invitation_codes`, `admin_setup`, `gym_settings`, `exercises`, `routines`, `routine_days`, `routine_exercises`, `client_routines`, `client_exercise_overrides`, `routine_week_progress`, `workout_sessions`, `exercise_logs`, `personal_records`, `pr_events`, `client_pain_reports`, `achievements`, `user_achievements`, `body_measurements`, `progress_photos`, `messages`, `push_subscriptions`).
- [x] **Semillas Idempotentes (`supabase/seed.sql`)**: Catálogo completo de logros (`achievements`) y planes base (`membership_plans`).
- [x] **Políticas RLS Optimizadas**: Uso de `(select auth.uid())` para evaluación InitPlan en PostgreSQL y permisos completos para que el coach gestione reportes de dolor, overrides de ejercicios y pagos.
- [x] **Control de Acceso en Cloudflare R2 (`app/actions/r2-storage.ts`)**: Validación de rol `admin` o propiedad estricta del prefijo del archivo antes de firmar URLs o eliminar objetos.

### 2. Autenticación, Onboarding y Correos
- [x] **Flujo Auth Unificado (`/auth/*`)**: Soporte simultáneo para enlaces PKCE (`?code=`), `token_hash` y códigos OTP de 6–8 dígitos en registro y recuperación de contraseña (`/auth/verify-otp`, `/auth/callback`, `/auth/reset-password`).
- [x] **Plantillas de Correo (`emails/*.tsx` y `emails/supabase/*.html`)**: Diseño unificado de RU Coach y envío garantizado con `await Promise.allSettled` en entornos Serverless.
- [x] **Notificaciones Web Push (`lib/push.ts` + `app/sw.ts`)**: Notificaciones reales en segundo plano para nuevos mensajes, rutinas asignadas, entrenamientos completados, pagos confirmados, cambios de ejercicio y reportes de dolor, con limpieza automática de suscripciones expiradas (`404`/`410`).

### 3. Ciclo Cerrado Coach $\leftrightarrow$ Asesorado
- [x] **Sesión de Entrenamiento Activa (`/client/workout/start`)**: Persistencia en `localStorage`, historial por ejercicio de la última sesión, soporte de biseries/superseries A–E, temporizador flotante con sonido/vibración y modal de finalización con **sensación post-entreno (`1–5`)** y nota para el coach.
- [x] **Visibilidad Clínica y de Rutina en el Hub del Cliente (`/admin/clients/[clientId]`)**:
  - Banner superior para **reportes de dolor activos** (`client_pain_reports`) con botón **"Resuelto"**.
  - Tarjeta de **ejercicios intercambiados por el asesorado** (`client_exercise_overrides`) en la pestaña *Rutina* con botón **"Restaurar original"**.
  - Visualización de **sensación post-entreno (`1–5`)** y notas de sesión en la pestaña *Historial*.
- [x] **Gestor de Planes y Tarifas (`/admin/settings`)**: Creación, edición y activación/desactivación de planes de membresía (`membership_plans`), además de activación de Web Push y cambio de contraseña para el coach.

### 4. Gestión Inteligente de Pagos y Vigencia de Membresías
- [x] **Estado Efectivo de Pagos (`lib/membership-utils.ts` + `/admin/payments`)**: Separación clara entre cobro registrado (`paid`) y vigencia real del periodo (`period_end` vencido, por vencer en $\le 5$ días o vigente), con filtros dedicados (*Vencidos*, *Por vencer*, *Vigentes*) y botón de **Renovar en 1 clic** (`/admin/payments/new?clientId=...&planId=...`).
- [x] **Descuentos Rápidos y Precios Personalizados (`/admin/payments/new`)**: Selector de plan base con píldoras de descuento (`-10%`, `-15%`, `-20%`, `-50%`) o precio especial editable sin alterar el catálogo base, calculando automáticamente el próximo periodo desde el vencimiento actual si el cliente aún está vigente.
- [x] **Sincronización Automática de Acceso (`syncClientMembershipFromPayments` + `app/client/layout.tsx`)**: Al registrar o marcar un pago como pagado, se reactiva automáticamente al cliente y al recargar `/suspended` redirige de inmediato a `/client/dashboard` si ya cuenta con membresía activa.
- [x] **Transparencia para el Asesorado (`/client/dashboard` y `/client/profile`)**: Banner de aviso cuando la membresía vence en $\le 5$ días y tarjeta completa de **Mi Membresía e Historial de Pagos** en el perfil del cliente.

### 5. Chat Móvil (`VisualViewport`) y Notificaciones Push en Tiempo Real
- [x] **Soporte de Teclado Virtual en iOS/Android (`components/chat/chat-view.tsx`)**: Ajuste dinámico con `window.visualViewport` para que al abrir el teclado móvil los mensajes nunca desaparezcan ni el header se desplace fuera de pantalla.
- [x] **Doble Canal en Tiempo Real + Puente Service Worker (`app/sw.ts` + `lib/push.ts`)**: Combinación de `postgres_changes`, canal Broadcast `chat_room` de baja latencia, resincronización automática al volver la app a primer plano (`visibilitychange` / `focus`) y puente `postMessage({ type: "CHAT_NEW_MESSAGE" })` desde el Service Worker al recibir un Push.
- [x] **Cliente Admin para Push (`createAdminClient` en `lib/push.ts`)**: Lectura de `push_subscriptions` con `service_role` para garantizar que el coach pueda enviar notificaciones Push al cliente (y viceversa) sin bloqueo por RLS.

### 6. Catálogo de Ejercicios, Constructor de Rutinas y Skeletons
- [x] **Editor de Ejercicios por Puntos (`components/admin/exercises/exercise-form-modal.tsx` + `app/actions/exercises.ts`)**: Creación y edición de cualquiera de los 1,324+ ejercicios con lista interactiva de **pasos numerados** (agregar, insertar, reordenar arriba/abajo, pegar múltiples líneas y eliminar) y subida directa de GIF/imagen a Cloudflare R2 (`exercises/`).
- [x] **Constructor y Gestión de Rutinas sin Deuda Técnica (`/admin/routines/*`)**:
  - Edición no destructiva (`updateRoutineFromBuilder`) que preserva `routine_days.id` y `client_exercise_overrides`.
  - Campos de **Enfoque del día (`focus`)** y **Notas por ejercicio (`notes`)** visibles tanto para el coach como para el asesorado.
  - Vista previa técnica (`ExerciseDetailDrawer`) dentro del Builder y del selector de catálogo.
  - Duplicado/clonación de rutinas en 1 clic (`cloneRoutine`) y modal de asignación rápida a asesorados (`AssignRoutineModal`).
- [x] **Sistema Unificado de Skeletons (`loading.tsx`)**: 33 pantallas de carga alineadas píxel a píxel con los contenedores reales (`ADMIN_DATA_PAGE_SHELL` / `CLIENT_DATA_PAGE_SHELL`) tanto en Desktop (1440px) como en Mobile (375px).

