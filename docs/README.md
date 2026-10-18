# RU Coach — Documentación Oficial

## Descripción General

**RU Coach (Rodrigo Urbina Personal Coaching)** es una plataforma web progresiva (**PWA**) de entrenamiento personalizado y gestión de asesorados. Conecta en tiempo real el trabajo del **Coach** con la experiencia diaria de entrenamiento del **Asesorado**, cubriendo desde la prescripción de rutinas y el registro serie por serie en el gimnasio hasta la auto-progresión de cargas, control clínico de lesiones, evolución antropométrica, fotos comparativas y administración de pagos.

---

## Índice Rápido

- [**Índice Maestro (`docs/INDEX.md`)**](./INDEX.md) — Mapa completo de la documentación y rutas del proyecto
- [**Motor Anatómico y Fusión Biomecánica (`docs/ANATOMIA_Y_FUSION_OPEN_GYM.md`)**](./ANATOMIA_Y_FUSION_OPEN_GYM.md) — Arquitectura de mapa corporal SVG, balance de volumen, fatiga neuromuscular, retención 1RM y optimizaciones móviles nativas
- [**Arquitectura Técnica (`docs/ARCHITECTURE.md`)**](./ARCHITECTURE.md) — Stack, estructura de carpetas, flujo de datos, seguridad RLS, R2 y Web Push
- [**Guía de Base de Datos (`docs/DATABASE_GUIDE.md`)**](./DATABASE_GUIDE.md) — Esquema maestro (`supabase_schema_dump.sql`), datos semilla (`seed.sql`) y migración de los 1,324 ejercicios bilingües
- [**Guía de Despliegue (`docs/DEPLOYMENT.md`)**](./DEPLOYMENT.md) — Configuración paso a paso para producción en Vercel, Supabase, Cloudflare R2 y Resend
- [**Guía Maestra de Migración (`docs/MIGRACION_PRODUCCION_RUCOACH_APP.md`)**](./MIGRACION_PRODUCCION_RUCOACH_APP.md) — Migración a nueva cuenta de Supabase, dominio `rucoach.app` (Name.com → Cloudflare → Resend → Vercel) y MCPs
- [**Guía de Cloudflare R2 (`docs/R2_MIGRATION_GUIDE.md`)**](./R2_MIGRATION_GUIDE.md) — Configuración de bucket, CORS y carga masiva con Rclone
- [**Guía de Rutinas (`docs/ROUTINES.md`)**](./ROUTINES.md) — Constructor de rutinas continuas, biseries/superseries (A–E), series de aproximación, cobertura muscular y cambio de día
- [**Progresión de Carga (`docs/PROGRESSION.md`)**](./PROGRESSION.md) — Motor de auto-progresión, series efectivas vs. aproximación, detección de PRs, sensación post-entreno (1–5) y protección por reporte de dolor

---

## Estado Actual de Módulos (100% Implementados)

### 1. Flujo del Coach (`/admin/*`)
- **Dashboard Operativo (`/admin/dashboard`)**: Métricas semanales/mensuales, alertas de inactividad (+3 días sin entrenar), alertas de pagos por vencer y gráfica de sesiones.
- **Hub 360° del Asesorado (`/admin/clients/[clientId]`)**:
  - **Banner de Alerta Clínica**: Muestra reportes de dolor activos (`client_pain_reports`) con severidad `1–10`, zona corporal, notas y botón `"Resuelto"` (`resolveClientPainReport`).
  - **Resumen y Notas Privadas**: Nivel, XP, racha actual, perfil físico/médico y editor de notas privadas del coach con guardado directo.
  - **Rutina y Sustituciones Activas**: Visualización de la rutina asignada con tarjeta de **Cobertura Muscular Semanal (`WeeklyMuscleCoverage`)** y tarjeta de `client_exercise_overrides` con opción de restaurar el ejercicio original (`revertExerciseOverride`).
  - **Historial con Sensación Post-Entreno**: Sesiones completadas con badge semafórico de sensación (`feeling_score` 1–5), notas de la sesión (`feeling_note`), duración y volumen total.
  - **Progreso, Biomecánica y Medidas**:
    - **Balance Muscular y Fatiga (`MuscleBalanceCard`)**: Visualización 3-en-1 con mapa anatómico SVG, balance de volumen semanal (efectivo vs. planeado), cálculo de fatiga neuromuscular con horas estimadas para recuperación y retención de fuerza 1RM por ejercicio.
    - **Heatmap de Actividad 52 Semanas (`ActivityHeatmap`)**: Gráfica estilo GitHub con selector de Volumen vs. Sesiones en paleta ámbar/oro de la marca.
    - Curvas de fuerza por ejercicio, tabla/gráficas de las 7 medidas corporales y galería de fotos de progreso firmadas desde R2.
- **Constructor de Rutinas (`/admin/routines/builder` y `/admin/routines`)**:
  - Creación de rutinas continuas o con semanas definidas (`duration_weeks = null | number`), clonación en 1 clic (`cloneRoutine`), asignación rápida (`AssignRoutineModal`) y edición no destructiva (`updateRoutineFromBuilder`).
  - Soporte de objetivo (`goal`), nivel (`level`), enfoque del día (`focus`), notas por ejercicio (`notes`), vista previa técnica (`ExerciseDetailDrawer`), reordenamiento Drag & Drop (`@dnd-kit`) y agrupación en **Superseries A–E**.
  - **Series de Aproximación (`warmup_sets`)**: Configuración discreta por ejercicio en acordeón extensible sin saturar la vista.
  - **Cobertura Muscular en Vivo (`WeeklyMuscleCoverage`)**: Cálculo en tiempo real con mapa anatómico frontal/dorsal, barras de nivel de estimulación y alerta de grupos musculares no estimulados.
- **Catálogo y Editor de Ejercicios (`/admin/exercises`)**: 1,324+ ejercicios bilingües (`_es` prioritario), **filtro interactivo por mapa corporal (`BodyMap` + `MuscleExplorerPanel`)** sincronizado con la URL (`?muscle=...`), selector de grupos musculares primarios/secundarios y modal de creación/edición (`ExerciseFormModal`) con editor interactivo de instrucciones por puntos y subida directa de GIF a Cloudflare R2.
- **Pagos, Descuentos y Planes (`/admin/payments` y `/admin/settings`)**: Estado efectivo por vigencia (`period_end`), soporte de cobro libre/personalizado sin plan fijo, renovación en 1 clic, píldoras de descuento (`-10%`, `-15%`, `-20%`, `-50%`), recibos por email/Push y CRUD de **Planes y Tarifas (`membership_plans`)**.
- **Invitaciones (`/admin/invitations`)**: Códigos de invitación para clientes o coaches con validación de expiración y envío por Resend.
- **Chat en Tiempo Real (`/admin/messages` y `/client/messages`)**: Bandeja de entrada conectada a `Supabase Realtime` (`postgres_changes` + Broadcast `chat_room` + puente Service Worker `CHAT_NEW_MESSAGE`), soporte de teclado virtual móvil (`VisualViewport`), doble check (`is_read`) y respuestas rápidas.

### 2. Flujo del Asesorado (`/client/*`)
- **Dashboard (`/client/dashboard`)**: Nivel y progreso de XP, racha de días entrenados, acceso directo al entrenamiento del día y gráfica de actividad.
- **Mi Rutina (`/client/routines`)**:
  - Vista completa del plan continuo o por semanas, desglose visual **"Qué trabaja esta sesión"** con mapa corporal bare frontal/dorsal y chips de músculos objetivo antes de empezar.
  - Instrucciones paso a paso con GIF, **intercambio de ejercicio (`ExerciseSwapDrawer`)** con explorador muscular y **cambio del día programado para hoy (`ScheduleOverrideDialog`)**.
- **Entrenamiento en Vivo (`/client/workout/start`)**:
  - Registro de **Series de Aproximación (W)** separadas de las Series Efectivas de trabajo con un clic.
  - Registro serie por serie con referencia histórica de la última sesión de ese ejercicio.
  - Temporizador de descanso flotante con Web Audio API, vibración y controles `-15s` / `+15s`.
  - Persistencia automática en `localStorage` para evitar pérdida de datos si se bloquea el teléfono.
  - **Modal de Finalización**: KPIs en vivo (excluyendo series de aproximación del volumen total), advertencia de series incompletas, selector de esfuerzo percibido (`1–5`) y nota para el coach.
- **Resumen y Auto-Progresión (`/client/workout/summary`)**:
  - **Tarjeta "Músculos trabajados hoy"**: Mapa anatómico SVG con gradiente de activación según series completadas en la sesión.
  - Desglose de series realizadas, PRs batidos (evaluados exclusivamente en series efectivas), desbloqueo animado de logros y ajuste automático de cargas (`lib/auto-progression.ts`).
- **Progreso y Biomecánica (`/client/progress`)**:
  - **Balance Muscular y Fatiga (`MuscleBalanceCard`)**: Evaluación del balance entre músculos agonistas/antagonistas, semáforo de recuperación neuromuscular e índice de retención de 1RM.
  - **Heatmap de Actividad Anual (`ActivityHeatmap`)**: 52 semanas de consistencia de entrenamientos.
  - Gráficas de carga máxima y volumen total con insights automáticos (`lib/progress-insights.ts`).
- **Medidas (`/client/measurements`)**: Registro y visualización de Peso, % Grasa, Cintura, Cadera, Pecho, Brazo y Muslo (curva histórica + gráfico de radar).
- **Fotos (`/client/photos`)**: Subida directa a Cloudflare R2 con URLs pre-firmadas, galería por ángulo y comparador interactivo **Antes / Después**.
- **Calendario (`/client/calendar`)**: Historial mensual de entrenamientos con detalle por día.
- **Hitos (`/client/achievements`)**: Catálogo interactivo de medallas desbloqueadas y próximas metas.
- **Perfil y Seguridad (`/client/profile`)**: Edición de perfil, **Reporte de Dolor o Molestia Física** para proteger la auto-progresión y avisar al coach, cambio de contraseña y activación de **Notificaciones Web Push**.
- **Medidas (`/client/measurements`)**: Registro y visualización de Peso, % Grasa, Cintura, Cadera, Pecho, Brazo y Muslo (curva histórica + gráfico de radar).
- **Fotos (`/client/photos`)**: Subida directa a Cloudflare R2 con URLs pre-firmadas, galería por ángulo y comparador interactivo **Antes / Después**.
- **Calendario (`/client/calendar`)**: Historial mensual de entrenamientos con detalle por día.
- **Hitos (`/client/achievements`)**: Catálogo interactivo de medallas desbloqueadas y próximas metas.
- **Perfil y Seguridad (`/client/profile`)**: Edición de perfil, **Reporte de Dolor o Molestia Física** para proteger la auto-progresión y avisar al coach, cambio de contraseña y activación de **Notificaciones Web Push**.

---

## Cuentas y Acceso Inicial

1. **Primer Administrador (Coach)**:
   - Accede a `/auth/admin-setup` e ingresa el código configurado en la variable de entorno `ADMIN_SETUP_CODE`.
   - Completa el onboarding inicial en `/admin/onboarding` para configurar el nombre del gimnasio/marca, moneda y zona horaria.
2. **Registro de Asesorados**:
   - El coach crea al asesorado en `/admin/clients/new` o genera un código en `/admin/invitations`.
   - El asesorado se registra en `/auth/sign-up?code=CODIGO`, verifica su correo (enlace o código OTP de 6–8 dígitos en `/auth/verify-otp`) y completa su perfil inicial en `/onboarding`.
