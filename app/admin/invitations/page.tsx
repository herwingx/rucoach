import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvitationsDashboardClient } from "./invitations-dashboard-client";
import type { InvitationCodeItem } from "./invitation-cards-client";
import {
  ADMIN_DATA_PAGE_SHELL,
  AdminPageHeader,
} from "@/components/admin/admin-page-header";
import { cn } from "@/lib/utils";

export default async function AdminInvitationsPage() {
  const { user, role } = await getAuthData();
  if (!user) redirect("/auth/login");

  if (role !== "admin") {
    redirect("/client/dashboard");
  }

  // Usamos adminClient para asegurar que todas las invitaciones del gimnasio se carguen sin fallos de RLS
  const admin = createAdminClient();

  const [{ data: codesRaw }, { data: coachClients }, { data: allProfiles }] =
    await Promise.all([
      admin
        .from("invitation_codes")
        .select(
          "id, code, email, for_role, expires_at, times_used, max_uses, is_active, client_id, used_by_user_id, created_at, created_by",
        )
        .order("created_at", { ascending: false }),
      admin
        .from("clients")
        .select("id, user_id, full_name, phone, email, coach_id"),
      admin.from("profiles").select("id, full_name, email"),
    ]);

  const clientsById = new Map((coachClients ?? []).map((c) => [c.id, c]));
  const clientsByUserId = new Map(
    (coachClients ?? [])
      .filter((c) => Boolean(c.user_id))
      .map((c) => [c.user_id as string, c]),
  );
  const profilesById = new Map((allProfiles ?? []).map((p) => [p.id, p]));

  const codes: InvitationCodeItem[] = (codesRaw ?? []).map((row) => {
    const clientFromId = row.client_id
      ? clientsById.get(row.client_id)
      : undefined;
    const clientFromUsedBy = row.used_by_user_id
      ? clientsByUserId.get(row.used_by_user_id)
      : undefined;
    const matchedClient = clientFromId ?? clientFromUsedBy;
    const matchedProfile = row.used_by_user_id
      ? profilesById.get(row.used_by_user_id)
      : undefined;

    return {
      id: row.id,
      code: row.code,
      email: row.email,
      for_role: row.for_role ?? "client",
      expires_at: row.expires_at,
      times_used: row.times_used ?? 0,
      max_uses: row.max_uses ?? 1,
      is_active: row.is_active ?? false,
      created_at: row.created_at ?? null,
      created_by: row.created_by ?? null,
      linked_client_id: matchedClient?.id ?? null,
      linked_name:
        matchedClient?.full_name || matchedProfile?.full_name || null,
      linked_phone: matchedClient?.phone || null,
    };
  });

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        sticky
        title="Códigos de invitación"
        description="Genera y comparte códigos de acceso para atletas y coaches por WhatsApp, enlace directo o correo"
      />
      <div className={cn(ADMIN_DATA_PAGE_SHELL, "flex flex-col gap-6")}>
        <InvitationsDashboardClient initialCodes={codes} />
      </div>
    </div>
  );
}
