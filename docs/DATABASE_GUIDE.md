# Guía de Base de Datos (Supabase) — RU Coach

Este documento es la referencia principal para configurar, resetear o migrar la base de datos de **RU Coach**. Toda la estructura está consolidada en un único archivo SQL maestro acompañado de su archivo de semillas idempotentes.

## 1. Archivo Maestro de Esquema

El archivo `supabase/supabase_schema_dump.sql` contiene la definición completa de:
- **Extensiones**: `pg_stat_statements`, `uuid-ossp`, `supabase_vault`, `pgcrypto`, `pg_graphql`.
- **Esquema Público (19 tablas)**: Todas las tablas, columnas, tipos (incluyendo arrays y JSONB), llaves primarias y foráneas con `ON DELETE CASCADE` / `ON DELETE SET NULL`:
  - Perfiles, clientes, planes de membresía, pagos y códigos de invitación (`profiles`, `clients`, `membership_plans`, `payments`, `invitation_codes`, `admin_setup`, `gym_settings`).
  - Rutinas, días, ejercicios y overrides individuales por cliente (`routines`, `routine_days`, `routine_exercises`, `client_routines` con `override_next_day_id`, `client_exercise_overrides`, `routine_week_progress`).
  - Sesiones, bitácora de series, récords y reportes de dolor (`workout_sessions`, `exercise_logs`, `personal_records`, `pr_events`, `client_pain_reports`).
  - Gamificación, medidas, fotos, mensajería y notificaciones Web Push (`achievements`, `user_achievements`, `body_measurements`, `progress_photos`, `messages`, `push_subscriptions`).
- **Lógica de Servidor**: Funciones, procedimientos y triggers para gamificación (XP, niveles, rachas), creación automática de perfil (`on_auth_user_created`), sincronización de avatares/sesiones y gestión de invitaciones.
- **Seguridad (RLS)**: Políticas completas optimizadas con `(select auth.uid())` para asegurar que coaches y clientes solo accedan a los datos autorizados (incluyendo permisos para que el coach gestione reportes de dolor, overrides de ejercicios y pagos).
- **Storage y Realtime**: Creación idempotente de buckets (`progress-photos`, `avatars`), políticas de acceso y publicación Realtime para `public.messages`.
- **Catálogo de Ejercicios**: 1,324 ejercicios con esquema **bilingüe** (inglés + español):
  - Columnas `_es`: `name_es`, `equipments_es`, `body_parts_es`, `target_muscles_es`, `secondary_muscles_es`, `instructions_es`
  - Clasificación biomecánica: `exercise_type` (`strength`, `bodyweight`, `timed`, `cardio`, `mobility`) y `uses_external_load`.
  - La app usa lógica **"español primero, inglés como fallback"** en toda la UI.

---

## 2. Configuración Inicial o Reseteo (Entorno de Producción)

### A. Preparar el Proyecto en Supabase
1. Crea un nuevo proyecto en Supabase (o usa uno existente).
2. Los buckets de Storage (`progress-photos` privado y `avatars` público) se crean automáticamente al ejecutar el esquema, o puedes verificarlos manualmente en **Storage**.

### B. Ejecutar el Esquema y Datos Semilla
1. Copia el contenido de `supabase/supabase_schema_dump.sql`.
2. Ve al **SQL Editor** en el panel de Supabase, pega el contenido y ejecútalo. Esto crea toda la estructura: tablas, funciones, triggers, políticas RLS, buckets de Storage y Realtime.
3. A continuación, copia el contenido de `supabase/seed.sql` y ejecútalo en el **SQL Editor** para poblar de forma idempotente (`ON CONFLICT DO NOTHING`):
   - Catálogo completo de logros (`public.achievements`) requeridos por el motor de gamificación.
   - Planes base de membresía (`public.membership_plans`).

> **Nota:** El dump de esquema ya NO contiene INSERT de ejercicios. Los ejercicios se cargan en el paso siguiente.

### C. Cargar los 1,324 Ejercicios (bilingües EN/ES)

Todos los datos de ejercicios (inglés + español) se cargan con un solo comando.

**1. Agrega estas 2 líneas al final de tu `.env`:**
```env
TARGET_SUPABASE_URL=https://<nuevo_proyecto>.supabase.co
TARGET_SERVICE_ROLE_KEY=<service_role_key_del_nuevo_proyecto>
```

**2. Ejecuta:**
```bash
npx tsx scripts/migrate-exercises.ts
```

El script lee automáticamente tu `.env` actual como origen y usa las variables `TARGET_*` como destino.

- Descarga los 1,324 ejercicios completos del proyecto origen (inglés + español).
- Hace **UPSERT** en el destino (seguro: no duplica si el id ya existe, solo actualiza).
- Guarda un backup JSON local en `scripts/exercises-full-backup.json`.

> **¿Dónde obtengo el `TARGET_SERVICE_ROLE_KEY`?**
> En el panel de Supabase del proyecto nuevo: **Settings → API → service_role (secret)**.
> ⚠️ Nunca expongas esta clave en el frontend. Borra las líneas `TARGET_*` del `.env` después de migrar.

---

## 3. Migrar SOLO los Ejercicios (sin resetear todo)

Si ya tienes el proyecto configurado y solo necesitas cargar o actualizar las traducciones `_es`:

1. Asegúrate de tener `TARGET_SUPABASE_URL` y `TARGET_SERVICE_ROLE_KEY` en tu `.env`
2. Ejecuta: `npx tsx scripts/migrate-exercises.ts`

El UPSERT actualiza los registros existentes sin borrar datos de otras tablas.

---

## 4. Configuración de Entorno (Variables y CORS)

### A. Variables de Entorno (.env)
Actualiza las siguientes variables en tu plataforma de despliegue (ej. Vercel):
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
ADMIN_SETUP_CODE=tu-codigo-secreto
RESEND_API_KEY=re_xxx
EMAIL_FROM=RU Coach <noreply@tudominio.com>
R2_ACCOUNT_ID=tu-account-id
R2_ACCESS_KEY_ID=tu-access-key
R2_SECRET_ACCESS_KEY=tu-secret-key
R2_BUCKET_NAME=gymcoaching-exercises
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxx.r2.dev
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu-vapid-public-key
VAPID_PRIVATE_KEY=tu-vapid-private-key
```

### B. Configuración de Auth en Supabase
1. Ve a **Auth → URL Configuration**.
2. Configura la **Site URL** y las **Redirect URLs** con tu dominio de producción para que los correos de invitación y recuperación funcionen.

### C. Configuración de CORS en Supabase
1. Ve a **Settings → API**.
2. En **Allowed Origins**, agrega tu dominio (ej. `https://tu-dominio.com`).

---

## 5. Integración con Cloudflare R2

Para que las imágenes de los ejercicios y fotos de progreso funcionen correctamente:
1. Ve a **R2 → tu bucket → CORS Rules**.
2. Agrega la siguiente regla:
```json
[
  {
    "AllowedOrigins": ["https://tu-dominio.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]
```

---

## 6. Scripts Disponibles

| Script | Propósito |
|---|---|
| `supabase/supabase_schema_dump.sql` | Crea toda la estructura de la DB (tablas, funciones, triggers, RLS, Storage y Realtime) |
| `supabase/seed.sql` | Inserta datos semilla idempotentes (logros de gamificación y planes base de membresía) |
| `scripts/migrate-exercises.ts` | Carga los 1,324 ejercicios (EN+ES) desde un proyecto Supabase a otro |

---

## 7. Verificación Final
1. Usa el código definido en `ADMIN_SETUP_CODE` para crear el primer administrador en `/auth/admin-setup`.
2. Crea un código de invitación desde el panel de admin y prueba el registro de un cliente.
3. Sube una foto de perfil y una de progreso para validar las políticas de Storage.
4. Verifica en el **Catálogo de Ejercicios** que los nombres aparezcan en español.
