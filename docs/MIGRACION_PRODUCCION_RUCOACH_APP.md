# Guía Maestra de Migración y Entrega a Producción (`rucoach.app`)

Esta guía describe paso a paso la migración técnica y la entrega «llave en mano» (turnkey) de la plataforma **RU Coach** desde el entorno de desarrollo actual hacia las cuentas de producción definitivas del cliente bajo el dominio **`rucoach.app`**.

---

## 1. Respuestas Estratégicas Clave

### 1.1 ¿Es estrictamente necesario instalar el MCP de Supabase?
**No, no es obligatorio.**
- **El MCP de Supabase** es simplemente una herramienta de automatización para que el agente de IA (Antigravity) ejecute queries SQL y configure tablas directamente mediante llamadas API sin que tú tengas que abrir el navegador.
- **Sin MCP**, la migración se realiza de forma limpia y directa en menos de 5 minutos utilizando los scripts y volcados que ya dejamos preparados en el repositorio:
  1. Pegar [`supabase/supabase_schema_dump.sql`](../supabase/supabase_schema_dump.sql) en el **SQL Editor** de Supabase (crea las 19 tablas, RLS, triggers, funciones y buckets).
  2. Pegar [`supabase/seed.sql`](../supabase/seed.sql) en el SQL Editor (puebla logros y membresías).
  3. Ejecutar en tu terminal:
     ```bash
     TARGET_SUPABASE_URL="https://nuevo-proyecto.supabase.co" TARGET_SERVICE_ROLE_KEY="sb_secret_..." npx tsx scripts/migrate-exercises.ts
     ```
     *(Migra automáticamente los 1,324 ejercicios con nombres en español y URLs de Cloudflare R2).*
- **¿Cuándo sí conviene el MCP?** Únicamente si deseas que el agente Antigravity cree tablas, verifique registros o ejecute migraciones de forma 100% desatendida. Para una migración normal de entrega al cliente, el script oficial y el SQL Editor son suficientes y más seguros.

---

### 1.2 ¿Conviene crear una cuenta nueva personal de GitHub o una Organización?
**Recomendación definitiva: Crea una ORGANIZACIÓN de GitHub gratuita (por ejemplo, `rucoach-org` o `rucoach-app`), NO una cuenta personal nueva.**

#### ¿Por qué NO crear una cuenta de usuario personal nueva?
1. **Conflicto de credenciales locales:** En tu computadora de desarrollo tendrías problemas constantes con llaves SSH (`~/.ssh/id_ed25519`), `git config user.name`, `git config user.email` y tokens personales (`gh auth`), requiriendo configurar perfiles de SSH complejos para poder hacer `git push`.
2. **Violación de los Términos de Servicio de GitHub:** Las políticas de GitHub prohíben explícitamente que una misma persona física cree y mantenga múltiples cuentas personales individuales (pueden ser suspendidas).
3. **Poco profesional para el cliente:** Si creas una cuenta personal para el cliente, tendrías que compartirle la contraseña o transferirle el login, lo cual es inseguro y propenso a bloqueos por 2FA.

#### Las ventajas de una Organización de GitHub:
- **100% Gratuita:** Repositorios privados y públicos ilimitados, GitHub Actions y despliegues sin coste para este tamaño de proyecto.
- **Propiedad intelectual separada:** El repositorio pertenece a la entidad corporativa (`rucoach`), no a tu cuenta de desarrollador personal.
- **Múltiples Propietarios (Owners):** Puedes añadir al cliente (Rodrigo) como **Owner** y mantenerte a ti mismo (`herwingx`) como **Owner / Technical Admin** sin compartir contraseñas.
- **Transferencia en 1 clic:** Desde tu repositorio actual en GitHub (`gym-coaching`), vas a **Settings** → **Danger Zone** → **Transfer Repository** → escribes el nombre de la organización (`rucoach-app`) y se transfiere instantáneamente conservando todos los commits, ramas e historial.
- **Integración transparente con Vercel:** Vercel se conecta a las Organizaciones de GitHub y despliega automáticamente cada push a `main`.

---

## 2. Mapa de Cuentas Necesarias para Producción

Para dejar el ecosistema 100% independiente de tus cuentas de desarrollador y entregarlo al cliente, se requieren las siguientes cuentas:

| Servicio | Propósito en Producción | Costo Base | Quién debe ser Owner |
| :--- | :--- | :--- | :--- |
| **GitHub** | Organización que aloja el repositorio de código fuente. | Gratis | El cliente y tú (ambos como Owners) |
| **Supabase** | Base de datos PostgreSQL, Auth, Realtime (Chat) y Storage. | Tier Gratuito / $25 Pro | Cliente (te invita como Admin) |
| **Resend** | Envío de correos transaccionales desde `@rucoach.app`. | Gratis (hasta 3,000 emails/mes) | Cliente (te invita como Admin) |
| **Cloudflare** | DNS oficial para `rucoach.app` y bucket R2 (`gymcoaching-exercises`). | DNS Gratis / R2 Gratis (hasta 10 GB) | Cliente (te invita como Admin) |
| **Vercel** | Hosting de Next.js, API Routes, PWA y dominio `rucoach.app`. | Hobby Gratis / Pro | Cliente (o equipo Vercel) |
| **Name.com** | Registrador donde se obtuvo el dominio `rucoach.app`. | Cubierto por GitHub Student Pack | Tu cuenta / Cliente |

---

## 3. Configuración del Dominio `rucoach.app`

### 3.1 Name.com → Cloudflare (Delegación de DNS)
1. Entra a tu cuenta de **Cloudflare** → haz clic en **Add a domain** → escribe **`rucoach.app`** → selecciona el plan **Free** → **Continue**.
2. Cloudflare te asignará **2 Servidores de Nombres (Nameservers)** (ejemplo: `ada.ns.cloudflare.com` y `bob.ns.cloudflare.com`).
3. Ve a **Name.com** → *My Domains* → selecciona **`rucoach.app`** → **Manage Nameservers**.
4. Elimina los servidores por defecto de Name.com y pega los **2 Nameservers de Cloudflare**. Guarda los cambios.
5. En Cloudflare, haz clic en **Check nameservers now** (suele propagarse entre 2 y 15 minutos).

---

### 3.2 Cloudflare DNS → Vercel (Apuntamiento Web)
1. En tu proyecto de **Vercel** → ve a **Settings** → **Domains**.
2. Escribe **`rucoach.app`** y haz clic en **Add**. Selecciona la opción recomendada:
   - Dominio principal: `rucoach.app`
   - Redirección automática: `www.rucoach.app` → `rucoach.app`
3. En **Cloudflare** → selecciona `rucoach.app` → menú **DNS** → **Records** → agrega estos dos registros:

| Tipo | Nombre | Contenido / Destino | Estado del Proxy (¡Crucial!) |
| :--- | :--- | :--- | :--- |
| **`A`** | `@` (o `rucoach.app`) | `76.76.21.21` | **DNS Only (Nube Gris)** |
| **`CNAME`** | `www` | `cname.vercel-dns.com` | **DNS Only (Nube Gris)** |

> [!IMPORTANT]
> Mantén la nube en **Gris (DNS Only)** en ambos registros hacia Vercel. Si activas la nube naranja de Cloudflare sin configurar modo SSL *Full (Strict)*, provocará un bucle de redirecciones infinitas (`ERR_TOO_MANY_REDIRECTS`) durante la generación de certificados SSL automáticos de Vercel.

---

### 3.3 Cloudflare DNS → Resend (Verificación de Dominio para Correos)
1. Entra a [https://resend.com/domains](https://resend.com/domains) → **Add Domain** → escribe **`rucoach.app`** → Región: **North Virginia (us-east-1)**.
2. Haz clic en **Sign in to Cloudflare** para que Resend vincule los registros automáticamente con un solo clic.
3. *(Si lo haces manual)* Agrega los registros `DKIM` (`resend._domainkey`), `SPF` (`send` MX y TXT) y `DMARC` (`_dmarc`) en Cloudflare con **Nube Gris (DNS Only)**.
4. En Resend, presiona **Verify DNS Records** hasta que el estado muestre **Verified** (verde).
5. Ve a **API Keys** en Resend → **Create API Key**:
   - Nombre: `RU Coach Production`
   - Permiso: `Sending access`
   - Dominio: `rucoach.app`
   - Guarda la clave resultante (`re_xxxxxxxxxxxxxxxxxxxx`).

---

## 4. Migración de Base de Datos a la Nueva Cuenta de Supabase

### 4.1 Crear el Proyecto Destino
1. Inicia sesión en la **nueva cuenta de Supabase** del cliente.
2. Crea un nuevo proyecto:
   - **Name:** `ru-coach-prod`
   - **Database Password:** Genera una clave segura de al menos 20 caracteres y guárdala en un gestor de contraseñas.
   - **Region:** **`East US (North Virginia) - us-east-1`** *(imprescindible para tener latencia de ~2ms con los servidores de Vercel y Resend)*.

---

### 4.2 Ejecutar Esquema Completo y Logros Base
Una vez aprovisionado el proyecto en Supabase (tarda ~90 segundos):
1. Ve a **SQL Editor** → **New Query**.
2. Abre en este repositorio el archivo [`supabase/supabase_schema_dump.sql`](../supabase/supabase_schema_dump.sql), copia todo su contenido (1,189 líneas), pégalo en el editor y haz clic en **Run**.
   - *Este archivo contiene la arquitectura completa: 19 tablas, funciones RPC seguras (`use_invitation_code_atomic`, `handle_new_user`, etc.), triggers automáticos, índices compuestos, políticas RLS, buckets de almacenamiento (`avatars` y `progress-photos`) y la publicación Realtime para el chat de mensajería.*
3. Abre una nueva pestaña en **SQL Editor**, copia el contenido de [`supabase/seed.sql`](../supabase/seed.sql), pégalo y presiona **Run**.
   - *Puebla el catálogo de 43 logros oficiales y las membresías base.*

---

### 4.3 Migrar el Catálogo de Ejercicios (`public.exercises`)
Tus 1,330 archivos multimedia (GIFs y videos de ejercicios) **ya están alojados en Cloudflare R2 (`gymcoaching-exercises`)**, por lo que **no hay que resubir archivos multimedia**. Solo se requiere copiar los 1,324 registros de la tabla `exercises`.

Para hacerlo en 1 comando automático:
1. En tu archivo `.env.local` (o temporalmente en la terminal), define las credenciales del proyecto nuevo:
   ```bash
   TARGET_SUPABASE_URL="https://tu-nuevo-id.supabase.co"
   TARGET_SERVICE_ROLE_KEY="sb_secret_o_service_role_key_del_nuevo"
   ```
2. Ejecuta el migrador automatizado del repositorio:
   ```bash
   npx tsx scripts/migrate-exercises.ts
   ```
3. El script leerá los 1,324 ejercicios del Supabase origen, generará un respaldo local en `supabase/exercises_backup.json` y los insertará en lotes de 200 en la nueva base de datos en ~15 segundos.

---

### 4.4 Configurar Authentication en la Nueva Cuenta de Supabase
En el panel del nuevo proyecto de Supabase:
1. Ve a **Authentication** → **URL Configuration**:
   - **Site URL:**
     ```text
     https://rucoach.app
     ```
   - **Redirect URLs (agregar estas 5):**
     ```text
     https://rucoach.app/auth/callback
     https://rucoach.app/auth/confirm
     https://rucoach.app/auth/reset-password
     https://*.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     ```
2. Haz clic en **Save**.

---

### 4.5 Conectar Resend como Servidor SMTP de Supabase Auth
Por defecto, Supabase limita los correos a 2 envíos por hora y salen desde una dirección genérica. Para que las confirmaciones de cuenta salgan inmediatamente desde `noreply@rucoach.app`:
1. En Supabase → **Authentication** → **SMTP Settings** (o **Project Settings → Authentication → SMTP Settings**).
2. Activa el interruptor **Enable Custom SMTP**:
   - **Sender email:** `noreply@rucoach.app`
   - **Sender name:** `RU Coach`
   - **Host:** `smtp.resend.com`
   - **Port number:** `465`
   - **Minimum interval per user:** `60`
   - **Username:** `resend` *(la palabra literal `resend`)*
   - **Password:** Pega tu API Key de Resend (`re_xxxxxxxxxxxxxxxxxxxx`)
3. Haz clic en **Save**.

---

### 4.6 Instalar las Plantillas HTML de Correo
En Supabase → **Authentication** → **Email Templates**, copia y pega el contenido HTML de cada archivo ubicado en [`emails/supabase/`](../emails/supabase/):
- **Confirm signup:** pega [`emails/supabase/supabase-confirm-signup.html`](../emails/supabase/supabase-confirm-signup.html)
- **Reset password:** pega [`emails/supabase/supabase-reset-password.html`](../emails/supabase/supabase-reset-password.html)
- **Magic link:** pega [`emails/supabase/supabase-magic-link.html`](../emails/supabase/supabase-magic-link.html)
- **Change email address:** pega [`emails/supabase/supabase-change-email.html`](../emails/supabase/supabase-change-email.html)
- **Invite user:** pega [`emails/supabase/supabase-invite-user.html`](../emails/supabase/supabase-invite-user.html)

---

## 5. Auditoría de Variables de Entorno en Vercel

En el panel de **Vercel** → Tu Proyecto → **Settings** → **Environment Variables**, actualiza la configuración:

### 5.1 Variables que DEBEN cambiar (4 variables)
| Variable | Valor Anterior | Nuevo Valor de Producción |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_APP_URL`** | `https://rucoach-development.vercel.app/` | **`https://rucoach.app`** *(sin barra al final)* |
| **`NEXT_PUBLIC_SUPABASE_URL`** | `https://antiguo.supabase.co` | **La nueva URL del proyecto** (`https://nuevo.supabase.co`) |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | `sb_publishable_antigua` | **La nueva `anon` / `publishable` key** |
| **`SUPABASE_SERVICE_ROLE_KEY`** | `sb_secret_antigua` | **La nueva `service_role` / `secret` key** *(marca Sensitive)* |

### 5.2 Variables de Envío de Correo (2 variables)
| Variable | Valor |
| :--- | :--- |
| **`RESEND_API_KEY`** | Tu API Key generada en Resend (`re_...`) *(marca Sensitive)* |
| **`EMAIL_FROM`** | `RU Coach <noreply@rucoach.app>` |

### 5.3 Variables que se mantienen IDÉNTICAS (No mover)
| Variable | Motivo |
| :--- | :--- |
| **`ADMIN_SETUP_CODE`** | Código secreto para autorizar el registro del Coach en `/auth/sign-up`. |
| **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** | Clave pública para notificaciones Web Push PWA. |
| **`VAPID_PRIVATE_KEY`** | Clave privada para notificaciones Web Push PWA *(marca Sensitive)*. |
| **`R2_ACCESS_KEY_ID`** | Credencial de Cloudflare R2. |
| **`R2_SECRET_ACCESS_KEY`** | Secreto de Cloudflare R2 *(marca Sensitive)*. |
| **`R2_ACCOUNT_ID`** | Identificador de cuenta Cloudflare. |
| **`R2_BUCKET_NAME`** | `gymcoaching-exercises` |
| **`NEXT_PUBLIC_R2_PUBLIC_URL`** | `https://pub-xxxxxx.r2.dev` (o tu dominio CDN de R2) |

> [!TIP]
> **Eliminar advertencias «Needs Attention» en Vercel:**
> Al guardar llaves privadas como `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` o `VAPID_PRIVATE_KEY`, activa la casilla **Sensitive** en Vercel. Esto encripta su visualización en el panel y elimina las advertencias visuales amarillas.

---

## 6. Actualizar CORS en Cloudflare R2

Para que las subidas directas de fotos de progreso y avatares funcionen desde el nuevo dominio sin bloqueos del navegador:
1. En **Cloudflare Dashboard** → **R2 Almacenamiento de objetos** → Selecciona el bucket **`gymcoaching-exercises`**.
2. Ve a la pestaña **Settings (Configuración)** → baja a **CORS Policy** → **Edit CORS Policy**.
3. Pega esta configuración actualizada:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://rucoach.app",
         "https://www.rucoach.app",
         "https://rucoach-development.vercel.app",
         "http://localhost:3000"
       ],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Guarda los cambios.

---

## 7. Despliegue y Puesta en Marcha (Checklist de Entrega)

1. **Redeploy en Vercel:**
   - En **Vercel** → **Deployments** → Menú de tres puntos del último commit → **Redeploy**.
   - Verifica que el build finalice con éxito (`Ready`).
2. **Crear la Cuenta del Coach Principal en Producción:**
   - Abre tu navegador en modo normal o incógnito y entra a:
     ```text
     https://rucoach.app/auth/sign-up
     ```
   - Ingresa el código maestro de administrador configurado en `ADMIN_SETUP_CODE`.
   - Registra el correo y contraseña del Coach titular.
   - Completa el onboarding de 2 pasos del Coach.
3. **Verificación de Flujos Críticos:**
   - [x] Crear un atleta de prueba y enviarle invitación por correo (comprobar que llegue desde `noreply@rucoach.app`).
   - [x] Asignar una rutina desde el catálogo de 1,324 ejercicios con URLs en R2.
   - [x] Probar el chat en vivo con Supabase Realtime entre Coach y Atleta.
   - [x] Registrar una medida física y verificar que la fecha y métricas se muestren consistentes en gráficos y calendarios.
   - [x] Instalar la PWA en un dispositivo móvil desde `rucoach.app`.
4. **Entrega de Roles de Administración al Cliente:**
   - En la **Organización de GitHub**: Invitar al usuario del cliente como `Owner`.
   - En **Supabase**: Invitar al cliente a la organización con rol `Owner`.
   - En **Resend**: Invitar al cliente en `Settings` → `Team`.
   - En **Cloudflare**: Invitar al cliente en `Manage Account` → `Members`.
   - En **Vercel**: Invitar al cliente a la cuenta o transferir el proyecto al equipo del cliente.
