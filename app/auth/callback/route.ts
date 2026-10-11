import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

type EmailOtpType =
  | "signup"
  | "email"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email_change";

/**
 * Auth callback - soporta PKCE (?code=...), token_hash (?token_hash=...&type=...)
 * e implícito (tokens en hash #).
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const redirectToError = (message: string) =>
    NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(message)}`, origin),
    );

  // Cliente que escribe cookies en Headers para incluirlas en el redirect
  const headers = new Headers();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        const parsed = parseCookieHeader(request.headers.get("Cookie") ?? "");
        return parsed.map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          headers.append(
            "Set-Cookie",
            serializeCookieHeader(name, value, options ?? {}),
          ),
        );
      },
    },
  });

  const redirectWithCookies = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin));
    headers.forEach((value, key) => response.headers.append(key, value));
    return response;
  };

  const resolvePostAuthPath = async (
    user:
      | { id: string; user_metadata?: Record<string, unknown> }
      | null
      | undefined,
  ) => {
    let role = (user?.user_metadata?.role as string | undefined) ?? "client";
    const userId = user?.id;

    if (userId) {
      // Sincronizar profiles.role con user_metadata (middleware lee de profiles)
      if (role === "admin") {
        try {
          const admin = createAdminClient();
          await admin
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", userId);
        } catch {
          // Ignorar si falla (ej. sin SUPABASE_SERVICE_ROLE_KEY)
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role;
      }

      if (profile?.onboarding_completed) {
        return role === "admin"
          ? "/admin/dashboard"
          : role === "receptionist"
            ? "/receptionist/dashboard"
            : "/client/dashboard";
      }
    }

    return role === "admin" ? "/admin/onboarding" : "/onboarding";
  };

  // 1. Flujo PKCE (?code=...)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return redirectToError(error.message);

    if (type === "recovery" || next === "/auth/reset-password") {
      return redirectWithCookies("/auth/reset-password");
    }

    const path = await resolvePostAuthPath(data.user);
    return redirectWithCookies(path);
  }

  // 2. Flujo token_hash (?token_hash=...&type=...)
  if (tokenHash && type) {
    if (type === "recovery") {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (error) return redirectToError(error.message);
      return redirectWithCookies("/auth/reset-password");
    }

    if (type === "email_change") {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email_change",
      });
      if (error) return redirectToError(error.message);

      let role =
        (data?.user?.user_metadata?.role as string | undefined) ?? "client";
      if (data?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile?.role) role = profile.role;
      }

      const targetPath =
        role === "admin" ? "/admin/settings" : "/client/profile";
      return redirectWithCookies(targetPath);
    }

    if (
      type === "signup" ||
      type === "email" ||
      type === "magiclink" ||
      type === "invite"
    ) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (error) return redirectToError(error.message);

      const path = await resolvePostAuthPath(data?.user);
      return redirectWithCookies(path);
    }

    return redirectToError("Tipo de enlace no soportado");
  }

  // 3. Sin code ni token_hash/type: Supabase usó flujo implícito (tokens en #hash).
  // Devolvemos HTML que procesa el hash en el cliente.
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verificando...</title></head>
<body><p>Verificando tu correo...</p>
<script>var h=window.location.hash;window.location.replace("/auth/confirm"+(h||""));<\/script>
</body>
</html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
