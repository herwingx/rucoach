# Guía Maestra de Migración a Producción (`rucoach.app`)

Esta guía detalla paso a paso cómo:
1. Conectar tu dominio **`rucoach.app`** (obtenido en **Name.com** con GitHub Student Developer Pack) hacia **Cloudflare DNS** y **Vercel**.
2. Verificar **`rucoach.app`** en **Resend** para enviar correos transaccionales y de autenticación desde `noreply@rucoach.app`.
3. Migrar la base de datos a tu **nueva cuenta de Supabase** (esquema completo, funciones, triggers, RLS, buckets, semillas y catálogo de ejercicios en R2).
4. Actualizar las **Variables de Entorno en Vercel** (auditadas directamente contra tu configuración actual).
5. Instalar los **Servidores MCP opcionales** si deseas que el agente ejecute la migración y configuración automáticamente por ti.

---

## 0. ¿Qué MCPs puedes instalar para que yo lo haga por ti?

Si quieres que yo cree/configure el proyecto en la nueva cuenta de Supabase, ejecute todo el SQL, verifique los registros o configure Cloudflare/Vercel automáticamente desde aquí, puedes agregar estos **MCP Servers oficiales** en tu configuración de Antigravity (`/home/herwingx/.gemini/antigravity/mcp_config.json` o desde el panel MCP):

### 1. Supabase MCP Server (El más importante para migrar la DB automáticamente)
Con un **Personal Access Token (`sbp_...`)** generado en tu **nueva cuenta de Supabase** ([https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)), yo puedo ejecutar el esquema SQL completo, crear buckets, insertar semillas y darte las nuevas llaves listas:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_TU_TOKEN_DE_LA_NUEVA_CUENTA"
      ]
    }
  }
}
```

### 2. Cloudflare MCP Server (Opcional — para DNS y R2)
Permite gestionar tus zonas DNS (`rucoach.app`) y buckets R2 (`gymcoaching-exercises`):
```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "@cloudflare/mcp-server-cloudflare@latest"]
    }
  }
}
```

### 3. Vercel CLI (Ya disponible vía terminal con `npx vercel`)
No necesitas instalar nada extra: si ejecutas `npx vercel login` en tu terminal, yo puedo subir y actualizar todas las variables de entorno en Vercel con `npx vercel env`.

---

## Paso 1: Dominio `rucoach.app` (Name.com → Cloudflare → Vercel)

### 1.1 Reclamar el dominio en Name.com (GitHub Student Pack)
1. Entra a [education.github.com/pack](https://education.github.com/pack) → busca **Name.com** y abre tu enlace de beneficio.
2. Registra **`rucoach.app`**.

### 1.2 Pasar el DNS de Name.com a Cloudflare
1. Crea/entra a tu cuenta de **Cloudflare** (donde ya tienes tu bucket R2 `gymcoaching-exercises`).
2. En el menú principal de Cloudflare, haz clic en **"Add a domain"** (Agregar un dominio) → escribe **`rucoach.app`** → selecciona el plan **Free** → **Continue**.
3. Cloudflare te dará **2 Nameservers** (por ejemplo: `ada.ns.cloudflare.com` y `bob.ns.cloudflare.com`).
4. Ve a **Name.com** → *My Domains* → `rucoach.app` → **Manage Nameservers** → borra los de Name.com, pega los **2 Nameservers de Cloudflare** y guarda.
5. En Cloudflare, haz clic en **"Check nameservers now"** (tarda entre 2 y 15 minutos en activarse).

### 1.3 Conectar `rucoach.app` con Vercel
1. Entra a tu proyecto en **Vercel Dashboard** → **Settings** → **Domains**.
2. Escribe **`rucoach.app`** y haz clic en **Add**. Selecciona la opción recomendada (redirigir `www.rucoach.app` a `rucoach.app`).
3. En **Cloudflare** → `rucoach.app` → **DNS** → **Records**, agrega estos 2 registros:

| Tipo | Nombre (Name) | Contenido / Destino (Target) | Proxy Status (¡Importante!) |
| :--- | :--- | :--- | :--- |
| **`A`** | `@` (o `rucoach.app`) | `76.76.21.21` | **DNS Only (Nube Gris)** |
| **`CNAME`** | `www` | `cname.vercel-dns.com` | **DNS Only (Nube Gris)** |

> [!IMPORTANT]
> Deja la nube en **Gris (DNS Only)** en ambos registros hacia Vercel. Si activas la nube naranja sin configurar SSL *Full (Strict)* en Cloudflare, puede provocar un error de redirección infinita (`ERR_TOO_MANY_REDIRECTS`) al renovar certificados en Vercel.

---

## Paso 2: Configurar Resend con `rucoach.app` (Correos Transaccionales)

1. Entra a [https://resend.com/domains](https://resend.com/domains) → haz clic en **Add Domain**.
2. Escribe **`rucoach.app`** y elige la región **North Virginia (us-east-1)**.
3. **Conexión en 1 clic con Cloudflare**:
   - Resend tiene el botón **"Configure automáticamente con Cloudflare"** (*Sign in to Cloudflare*). Haz clic ahí y autoriza para que Resend inserte automáticamente los registros `DKIM` (`resend._domainkey`), `SPF` (`send` MX y TXT) y `DMARC` (`_dmarc`) en tu DNS de Cloudflare.
   - *(Si prefieres hacerlo manual, solo copia cada registro que muestra Resend en Cloudflare DNS con **Nube Gris / DNS Only**).*
4. Haz clic en **Verify DNS Records** en Resend hasta que el estado cambie a **Verified** (verde).
5. Ve a [https://resend.com/api-keys](https://resend.com/api-keys) → **Create API Key**:
   - **Name**: `RU Coach Production`
   - **Permission**: `Sending access`
   - **Domain**: `rucoach.app`
   - Copia la llave generada (`re_...`). La usaremos tanto en **Vercel** como en **Supabase SMTP**.

---

## Paso 3: Crear y Migrar a la Nueva Cuenta de Supabase

### 3.1 Crear el proyecto en la nueva cuenta
1. Inicia sesión en tu **nueva cuenta de Supabase** ([https://supabase.com/dashboard](https://supabase.com/dashboard)).
2. Haz clic en **New Project**:
   - **Name**: `ru-coach-prod`
   - **Database Password**: Genera una contraseña segura y guárdala.
   - **Region**: **`East US (North Virginia) - us-east-1`** *(recomendada porque Vercel y Resend corren por defecto en `us-east-1`, logrando latencia de ~2ms entre servidor y base de datos)*.

### 3.2 Ejecutar el Esquema Completo y Datos Semilla
Una vez que el proyecto termine de aprovisionarse (2 minutos):
1. En el menú lateral izquierdo de Supabase, abre **SQL Editor** → **New query**.
2. Abre el archivo [`supabase/supabase_schema_dump.sql`](../supabase/supabase_schema_dump.sql) de este repositorio, copia **todo su contenido**, pégalo en el SQL Editor y presiona **Run**.
   - *Esto crea las 17 tablas, vistas, funciones RPC (`use_invitation_code_atomic`, `handle_new_user`, `sync_client_last_session_from_workout`, etc.), triggers en `auth.users`, índices optimizados, políticas RLS completas, buckets de Storage (`avatars` y `progress-photos`) y la publicación de Supabase Realtime para el chat.*
3. Crea una segunda pestaña en **SQL Editor**, pega el contenido de [`supabase/seed.sql`](../supabase/seed.sql) y presiona **Run**.
   - *Esto poblará el catálogo oficial de logros (`public.achievements`) y los planes base (`public.membership_plans`).*

### 3.3 Poblar el Catálogo de Ejercicios (`public.exercises`)
Como tus GIFs de ejercicios **ya están en tu bucket de Cloudflare R2 (`gymcoaching-exercises` — 1,330 objetos / 388 MB)** como se ve en tu segunda captura:
- **No necesitas volver a subir las imágenes a R2**. Tu bucket R2 se queda exactamente igual y apunta a `https://pub-xxxxxx.r2.dev`.
- Para copiar las filas de la tabla `public.exercises` de tu Supabase anterior al nuevo:
  - **Opción A (Más rápida — 30 segundos)**: En tu cuenta vieja de Supabase ve a **Table Editor** → tabla **`exercises`** → botón **Export to CSV**. Luego en tu cuenta nueva de Supabase ve a **Table Editor** → **`exercises`** → **Insert** → **Import data from CSV**.
  - **Opción B (Por script)**: Si instalas el MCP de Supabase o actualizas `.env.local` con las llaves nuevas, yo puedo migrar todas las filas de `exercises` directamente de la cuenta vieja a la nueva sin que toques un solo CSV.

### 3.4 Configurar URLs de Autenticación en la Nueva Cuenta de Supabase
En el panel de la nueva cuenta de Supabase, ve a **Authentication** → **URL Configuration**:
1. **Site URL**:
   ```text
   https://rucoach.app
   ```
2. **Redirect URLs** (haz clic en *Add URL* y agrega estas 5):
   ```text
   https://rucoach.app/auth/callback
   https://rucoach.app/auth/confirm
   https://rucoach.app/auth/reset-password
   https://*.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
3. Haz clic en **Save**.

### 3.5 Conectar Resend como SMTP de Supabase Auth (¡Fundamental!)
Por defecto, el servidor de correo gratuito de Supabase solo permite enviar **2 correos por hora** y salen desde `noreply@mail.app.supabase.io`. Como ya tienes `rucoach.app` en Resend:
1. En tu nueva cuenta de Supabase, ve a **Authentication** → **SMTP Settings** (o **Project Settings → Authentication → SMTP Settings**).
2. Activa **Enable Custom SMTP** y llena estos datos:
   - **Sender email**: `noreply@rucoach.app`
   - **Sender name**: `RU Coach`
   - **Host**: `smtp.resend.com`
   - **Port number**: `465`
   - **Minimum interval per user**: `60`
   - **Username**: `resend` *(literalmente la palabra `resend`)*
   - **Password**: Pega tu **`RESEND_API_KEY`** (`re_xxxxxxxxx`)
3. Haz clic en **Save**.

### 3.6 Pegar las Plantillas HTML de Correo en Supabase
En tu nueva cuenta de Supabase, ve a **Authentication** → **Email Templates** y pega el HTML de cada plantilla ubicada en la carpeta [`emails/supabase/`](../emails/supabase/supabase-confirm-signup.html) *(ya actualizadas con el logo apuntando a `https://rucoach.app/android-chrome-512x512.png`)*:
- **Confirm signup**: pega [`emails/supabase/supabase-confirm-signup.html`](../emails/supabase/supabase-confirm-signup.html)
- **Reset password**: pega [`emails/supabase/supabase-reset-password.html`](../emails/supabase/supabase-reset-password.html)
- **Magic Link**: pega [`emails/supabase/supabase-magic-link.html`](../emails/supabase/supabase-magic-link.html)
- **Change Email Address**: pega [`emails/supabase/supabase-change-email.html`](../emails/supabase/supabase-change-email.html)
- **Invite user**: pega [`emails/supabase/supabase-invite-user.html`](../emails/supabase/supabase-invite-user.html)

---

## Paso 4: Qué datos copiar de la Nueva Cuenta de Supabase

En tu nueva cuenta de Supabase, ve a **Project Settings (ícono de engrane)** → **API** (y **API Keys**):
Necesitarás copiar estos **3 valores**:
1. **Project URL**: `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
2. **Publishable Key / `anon` `public` key**: `sb_publishable_...` (o `eyJ...`)
3. **Secret Key / `service_role` key**: `sb_secret_...` (o `eyJ...`)

---

## Paso 5: Auditoría y Actualización de tus Variables de Entorno en Vercel

Revisando la captura de pantalla de tus **Variables de Entorno actuales en Vercel**, aquí tienes exactamente qué hacer con cada una:

### A. Variables que DEBES ACTUALIZAR en Vercel (4 variables)

| Variable en tu Vercel | Valor Anterior | Nuevo Valor a Poner |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_APP_URL`** | `https://rucoach-development.vercel.app/` | **`https://rucoach.app`** *(sin barra `/` al final)* |
| **`NEXT_PUBLIC_SUPABASE_URL`** | `https://tu-proyecto-anterior.supabase.co` | **La nueva Project URL** (`https://xxxx.supabase.co`) |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | `sb_publishable_xxxxxxxxxxxx` | **La nueva `sb_publishable_...` (o `anon` key)** de la cuenta nueva *(nuestro código soporta tanto `NEXT_PUBLIC_SUPABASE_ANON_KEY` como `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)* |
| **`SUPABASE_SERVICE_ROLE_KEY`** | `sb_secret_xxxxxxxxxxxx` | **La nueva `sb_secret_...` (o `service_role` key)** de la cuenta nueva |

### B. Variables de Resend en Vercel (2 variables)

Asegúrate de tener configuradas las variables de Resend para el envío de correos de invitación, bienvenida, nueva rutina y recibos de pago:

| Variable | Valor | Entornos |
| :--- | :--- | :--- |
| **`RESEND_API_KEY`** | `re_xxxxxxxxxxxxxxxxxxxxxxxx` *(tu API Key de Resend)* | All Environments (Marca *Sensitive*) |
| **`EMAIL_FROM`** | `RU Coach <noreply@rucoach.app>` | All Environments |

### C. Variables que SE QUEDAN EXACTAMENTE IGUAL (No necesitas cambiarlas)

Como tu cuenta de Cloudflare R2 (`gymcoaching-exercises`) y tus llaves VAPID ya están listas y funcionando:
- **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`**: Se queda igual (`tu-vapid-public-key`)
- **`VAPID_PRIVATE_KEY`**: Se queda igual (`tu-vapid-private-key`)
- **`ADMIN_SETUP_CODE`**: Se queda igual (`tu-codigo-secreto-de-admin` — lo usarás para registrar tu cuenta de Coach en `/auth/sign-up` en la nueva base de datos)
- **`R2_ACCESS_KEY_ID`**: Se queda igual (`tu-r2-access-key-id`)
- **`R2_SECRET_ACCESS_KEY`**: Se queda igual (`tu-r2-secret-access-key`)
- **`R2_ACCOUNT_ID`**: Se queda igual (`tu-cloudflare-account-id`)
- **`R2_BUCKET_NAME`**: Se queda igual (`gymcoaching-exercises`)
- **`NEXT_PUBLIC_R2_PUBLIC_URL`**: Se queda igual (`https://pub-xxxxxx.r2.dev`)

> [!TIP]
> **¿Por qué Vercel muestra el aviso naranja `Needs Attention` en `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `R2_SECRET_ACCESS_KEY`?**
> Porque Vercel detecta que son llaves privadas (`secret` / `private`) y están guardadas como variables normales en lugar de tener activado el switch **"Sensitive"**. Cuando actualices `SUPABASE_SERVICE_ROLE_KEY` o agregues `RESEND_API_KEY`, activa la casilla **Sensitive** en Vercel para quitar esa alerta y proteger su lectura en el dashboard.

---

## Paso 6: Actualizar el CORS de tu Bucket R2 para `https://rucoach.app`

Para que la subida directa de fotos de progreso y avatares funcione desde tu nuevo dominio **`https://rucoach.app`**:
1. En **Cloudflare Dashboard** → **R2 Almacenamiento de objetos** → haz clic en tu bucket **`gymcoaching-exercises`** → pestaña **Settings (Configuración)**.
2. Baja hasta **CORS Policy** → **Edit CORS Policy** y pega este JSON:

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

---

## Paso 7: Redeploy y Creación de tu Cuenta de Coach en la Nueva DB

1. En **Vercel** → **Deployments** → haz clic en los tres puntos del último deploy → **Redeploy** (para que tome las nuevas variables de entorno).
2. Entra a **`https://rucoach.app/auth/sign-up`**.
3. Ingresa tu código maestro configurado en **`ADMIN_SETUP_CODE`**, crea tu cuenta de Coach, completa el onboarding de 2 pasos de Coach y ¡tu plataforma estará 100% en vivo sobre la nueva cuenta de Supabase y con el dominio `rucoach.app`!

