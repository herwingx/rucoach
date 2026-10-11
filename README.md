# RU Coach — Rodrigo Urbina Personal Coaching

Plataforma web progresiva (**PWA**) de entrenamiento personalizado y seguimiento deportivo de alto rendimiento, construida con **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Supabase (PostgreSQL + Auth + Realtime + Storage)**, **Cloudflare R2**, **Resend** y **Web Push (VAPID)**.

---

## Características Principales

### Portal del Coach / Administrador (`/admin/*`)
- **Dashboard Operativo (`/admin/dashboard`)**: KPIs en tiempo real (asesorados activos, sesiones completadas de la semana, récords personales del mes, alertas de inactividad +3 días y vencimientos próximos), gráfica interactiva de sesiones y tarjetas de estado por asesorado.
- **Hub 360° del Asesorado (`/admin/clients/[clientId]`)**:
  - **Alerta Clínica de Molestias**: Banner prioritario con reportes de dolor activos (`client_pain_reports`) reportados por el asesorado y botón de resolución clínica (`resolveClientPainReport`).
  - **Pestaña Resumen**: Rachas, nivel/XP, actividad reciente, perfil físico/médico y bloc de notas privadas del coach con guardado directo.
  - **Pestaña Rutina**: Desglose de la rutina activa por día con visualización de **sustituciones activas de ejercicios** (`client_exercise_overrides`) y botón para restaurar el ejercicio original (`revertExerciseOverride`).
  - **Pestaña Historial**: Sesiones completadas con duración, volumen total, series realizadas, **sensación post-entreno (`feeling_score` 1–5)** y notas del asesorado para el coach (`feeling_note`).
  - **Pestaña Progreso y Físico**: Evolución de cargas por ejercicio (`@tanstack/charts`), historial completo de 7 medidas corporales (Peso, % Grasa, Cintura, Cadera, Pecho, Brazo, Muslo) y galería de fotos de progreso firmadas desde Cloudflare R2 / Supabase Storage.
- **Constructor Visual de Rutinas (`/admin/routines/builder`)**:
  - Creación y edición de rutinas por objetivo (`goal`), nivel (`level`), duración en semanas y días de entrenamiento/descanso.
  - Drag & drop de ejercicios (`@dnd-kit`), soporte para **Biseries y Superseries (Grupos A–E)** con colores diferenciados, series, repeticiones, peso base, descanso y notas técnicas.
  - Asignación de rutinas a asesorados con notificación automática por correo (Resend) y Web Push.
- **Catálogo Bilingüe de Ejercicios (`/admin/exercises`)**:
  - **1,324 ejercicios** con esquema bilingüe (español prioritario `_es` + inglés como fallback), GIFs demostrativos en Cloudflare R2, clasificación por tipo (`strength`, `bodyweight`, `timed`, `cardio`, `mobility`) y bandera `uses_external_load`.
  - Creación de ejercicios personalizados con mapeo automático al esquema en español.
- **Pagos, Planes y Membresías (`/admin/payments` y `/admin/settings`)**:
  - Registro y edición de pagos (`paid`, `pending`, `overdue`), marcado rápido como pagado, actualización automática de fecha de vencimiento del cliente (`membership_end_date`) y envío de recibo por correo y Web Push.
  - Gestor completo de **Planes y Tarifas** (`membership_plans`) en `/admin/settings`: creación, edición de precios/duración/beneficios y activación/desactivación de planes.
- **Sistema de Invitaciones (`/admin/invitations`)**:
  - Generación de códigos únicos de acceso para nuevos asesorados o coaches, con envío por correo o enlace directo con código prellenado.
- **Mensajería en Tiempo Real (`/admin/messages`)**:
  - Bandeja de entrada multi-cliente con contadores de no leídos en vivo (`Supabase Realtime`), respuestas rápidas de coaching y notificaciones Push.
- **Configuración y Seguridad del Coach (`/admin/settings`)**:
  - Datos de marca/gimnasio, moneda, zona horaria, foto de perfil en R2, activación de **Notificaciones Push en el dispositivo del coach** y cambio de contraseña.

### Portal del Asesorado (`/client/*`)
- **Dashboard del Atleta (`/client/dashboard`)**: Tarjeta de nivel y barra de XP, racha actual en días calendario, tarjeta del próximo entrenamiento programado, gráfica de sesiones (`7d` / `30d` / `90d`) y vitrina de hitos recientes.
- **Mi Rutina (`/client/routines`)**:
  - Consulta de todos los días del programa activo, visor de técnica paso a paso con GIF demostrativo, **intercambio inteligente de ejercicio** (`ExerciseSwapDrawer` por lesión, equipo ocupado o preferencia) y **cambio temporal del día a entrenar hoy** (`ScheduleOverrideDialog`).
- **Sesión de Entrenamiento Activa (`/client/workout/start`)**:
  - Navegación fluida por ejercicio con indicadores de progreso por serie, soporte de biseries/superseries, referencia de la **última sesión registrada en ese mismo ejercicio**, inputs táctiles optimizados para móvil (`44x44px`), soporte diferenciado para ejercicios con peso externo, peso corporal o por tiempo (`timed`).
  - **Temporizador de descanso flotante** con controles rápidos (`-15s`, `+15s`, pausar, saltar), alerta sonora Web Audio API + vibración háptica y persistencia local (`localStorage`) contra cierres accidentales.
  - **Modal de Finalización con Sensación Post-Entreno (`1–5`)**: Resumen de series/volumen/tiempo, alerta si quedan series pendientes, selector de esfuerzo percibido (*Ligero, Bien, Exigente, Intenso, Al límite*) y nota directa para el coach.
- **Resumen Post-Entrenamiento y Auto-Progresión (`/client/workout/summary`)**:
  - Celebración de sesión completada, XP ganado, **Nuevos Récords Personales (PRs)**, modales animados de desbloqueo de logros con opción de compartir (`navigator.share`) y desglose completo de series realizadas.
  - **Motor de Auto-Progresión (`lib/auto-progression.ts`)**: Ajusta automáticamente los pesos sugeridos cuando se alcanza el tope de repeticiones con RPE controlado, respetando una **barrera de seguridad clínica** que bloquea incrementos en tren superior/inferior si el cliente tiene un reporte de dolor activo (`severity >= 4`).
- **Progreso, Medidas, Fotos, Calendario y Logros**:
  - **Progreso (`/client/progress`)**: Curvas de fuerza máxima y volumen por ejercicio con insights automáticos de estancamiento o avance.
  - **Medidas (`/client/measurements`)**: Registro y gráficas de evolución + radar corporal para 7 métricas antropométricas.
  - **Fotos (`/client/photos`)**: Subida a Cloudflare R2, galería filtrable por ángulo (*Frente, Perfil, Espalda*), visor a pantalla completa y **comparador interactivo Antes / Después** (`ImageCompareSlider`).
  - **Calendario (`/client/calendar`)**: Vista mensual de adherencia con detalle de sesiones por día.
  - **Hitos y Logros (`/client/achievements`)**: Sistema de gamificación con rachas, niveles y medallas por constancia, fuerza, volumen y seguimiento físico.
- **Perfil y Seguridad (`/client/profile`)**:
  - Datos personales, objetivos, lesiones, **Reporte de Dolor o Molestia Física** directo al coach, cambio de contraseña y switch de **Notificaciones Web Push**.

### Portal de Recepción (`/receptionist/*`)
- **Dashboard, Check-in, Clientes y Pagos**: Consulta rápida de vigencia de membresías, registro de asistencia del día y estado de pagos.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Framework** | Next.js 16.2 (`App Router`, Server Components, Server Actions, `proxy.ts`) |
| **UI & Estilos** | React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), Radix UI / shadcn/ui, Lucide Icons |
| **Base de Datos & Auth** | Supabase (`@supabase/ssr`, PostgreSQL 17, RLS, Realtime, Storage) |
| **Almacenamiento Multimedia** | Cloudflare R2 (`@aws-sdk/client-s3` + Presigned URLs) + Supabase Storage |
| **Gráficas** | Recharts + `@tanstack/charts` |
| **PWA & Push** | `@serwist/next` (`app/sw.ts`) + `web-push` (VAPID) |
| **Emails Transaccionales** | Resend + `@react-email/components` + Plantillas HTML de Supabase Auth |
| **Testing & Calidad** | Vitest (`vitest run`), TypeScript 5 (`tsc --noEmit`), ESLint 9 (`pnpm lint`) |

---

## Inicio Rápido (Desarrollo Local)

### 1. Clonar e instalar dependencias
```bash
git clone <url-del-repositorio>
cd gym-coaching
pnpm install
```

### 2. Configurar variables de entorno
Copia el archivo de ejemplo y completa tus credenciales:
```bash
cp .env.example .env.local
```

Variables principales en [`.env.example`](file:///home/herwingx/Development/gym-coaching/.env.example):
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`)
- `ADMIN_SETUP_CODE` (código secreto para registrar al primer administrador en `/auth/admin-setup`)
- `RESEND_API_KEY` y `EMAIL_FROM`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `NEXT_PUBLIC_R2_PUBLIC_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` (generables con `npx web-push generate-vapid-keys`)

### 3. Configurar la Base de Datos en Supabase
1. Ejecuta el esquema maestro [`supabase/supabase_schema_dump.sql`](file:///home/herwingx/Development/gym-coaching/supabase/supabase_schema_dump.sql) en el **SQL Editor** de Supabase.
2. Ejecuta los datos semilla [`supabase/seed.sql`](file:///home/herwingx/Development/gym-coaching/supabase/seed.sql) para inicializar el catálogo de logros (`achievements`) y planes base (`membership_plans`).
3. Carga el catálogo bilingüe de 1,324 ejercicios siguiendo [`docs/DATABASE_GUIDE.md`](file:///home/herwingx/Development/gym-coaching/docs/DATABASE_GUIDE.md).

### 4. Ejecutar el servidor de desarrollo
```bash
pnpm dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia el servidor de desarrollo en `http://localhost:3000` |
| `pnpm build` | Compila la aplicación y el Service Worker de producción (`next build --webpack`) |
| `pnpm start` | Inicia el servidor de producción |
| `pnpm lint` | Ejecuta ESLint sobre todo el repositorio |
| `pnpm exec tsc --noEmit` | Verifica tipos estáticos de TypeScript sin emitir archivos |
| `pnpm test` | Ejecuta la suite de pruebas unitarias con Vitest (`vitest run`) |
| `pnpm verify` | Ejecuta tests unitarios, chequeo de tipos TypeScript y build de producción |

---

## Documentación Detallada

Toda la documentación técnica y operativa se encuentra en la carpeta [`docs/`](file:///home/herwingx/Development/gym-coaching/docs/README.md):

- [**Índice General de Documentación (`docs/INDEX.md`)**](file:///home/herwingx/Development/gym-coaching/docs/INDEX.md)
- [**Resumen del Sistema (`docs/README.md`)**](file:///home/herwingx/Development/gym-coaching/docs/README.md)
- [**Arquitectura Técnica (`docs/ARCHITECTURE.md`)**](file:///home/herwingx/Development/gym-coaching/docs/ARCHITECTURE.md)
- [**Guía de Base de Datos y Replicación (`docs/DATABASE_GUIDE.md`)**](file:///home/herwingx/Development/gym-coaching/docs/DATABASE_GUIDE.md)
- [**Guía de Despliegue a Producción (`docs/DEPLOYMENT.md`)**](file:///home/herwingx/Development/gym-coaching/docs/DEPLOYMENT.md)
- [**Guía de Cloudflare R2 (`docs/R2_MIGRATION_GUIDE.md`)**](file:///home/herwingx/Development/gym-coaching/docs/R2_MIGRATION_GUIDE.md)
- [**Manual de Rutinas (`docs/ROUTINES.md`)**](file:///home/herwingx/Development/gym-coaching/docs/ROUTINES.md)
- [**Sistema de Progresión y PRs (`docs/PROGRESSION.md`)**](file:///home/herwingx/Development/gym-coaching/docs/PROGRESSION.md)
