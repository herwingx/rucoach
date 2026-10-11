import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { ClientLayoutShell } from "@/components/client-layout-shell";
import { createClient } from "@/lib/supabase/server";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, profile } = await getAuthData();

  if (!user || (role !== "client" && role !== "admin")) {
    redirect("/auth/login");
  }

  // Redirigir si el perfil ya está marcado como suspendido, vencido o pendiente de pago
  if (
    profile?.subscription_status === "suspended" ||
    profile?.subscription_status === "expired" ||
    profile?.subscription_status === "pending_payment"
  ) {
    redirect(`/suspended?status=${profile.subscription_status}`);
  }

  // Verificar vigencia real por fecha de corte (membership_end) en tabla clients
  if (role === "client") {
    const supabase = await createClient();
    const { data: clientRow } = await supabase
      .from("clients")
      .select("id, status, membership_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (clientRow) {
      if (
        clientRow.status === "suspended" ||
        clientRow.status === "expired" ||
        clientRow.status === "pending_payment"
      ) {
        redirect(`/suspended?status=${clientRow.status}`);
      }

      if (clientRow.membership_end) {
        const endDay = clientRow.membership_end.slice(0, 10);
        const endDate = new Date(`${endDay}T23:59:59`);
        if (!Number.isNaN(endDate.getTime()) && endDate < new Date()) {
          await supabase
            .from("clients")
            .update({ status: "expired" })
            .eq("id", clientRow.id);
          redirect("/suspended?status=expired");
        }
      }
    }
  }

  // Redirigir a onboarding si no está completado
  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <ClientLayoutShell>{children}</ClientLayoutShell>
    </div>
  );
}
