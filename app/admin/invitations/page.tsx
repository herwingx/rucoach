import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { NewInvitationForm } from "./new-invitation-form";
import {
  InvitationCardsClient,
  type InvitationCodeItem,
} from "./invitation-cards-client";
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

  const supabase = await createClient();

  const [{ data: codesRaw }, { data: coachClients }] = await Promise.all([
    supabase
      .from("invitation_codes")
      .select(
        "id, code, email, for_role, expires_at, times_used, max_uses, is_active, used_at, client_id, used_by_user_id",
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, user_id, full_name, phone, email")
      .eq("coach_id", user.id),
  ]);

  const clientsById = new Map(
    (coachClients ?? []).map((c) => [c.id, c]),
  );
  const clientsByUserId = new Map(
    (coachClients ?? [])
      .filter((c) => Boolean(c.user_id))
      .map((c) => [c.user_id as string, c]),
  );

  const usedByIds = Array.from(
    new Set(
      (codesRaw ?? [])
        .map((r) => r.used_by_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: usedProfiles } =
    usedByIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", usedByIds)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

  const profilesById = new Map(
    (usedProfiles ?? []).map((p) => [p.id, p]),
  );

  const codes: InvitationCodeItem[] = (codesRaw ?? []).map((row) => {
    const clientFromId = row.client_id ? clientsById.get(row.client_id) : undefined;
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
      used_at: row.used_at ?? null,
      linked_client_id: matchedClient?.id ?? null,
      linked_name:
        matchedClient?.full_name ||
        matchedProfile?.full_name ||
        null,
      linked_phone: matchedClient?.phone || null,
    };
  });

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        sticky
        title="Códigos de invitación"
        description="Genera y comparte códigos de acceso por WhatsApp, enlace directo o correo"
      />
      <div className={cn(ADMIN_DATA_PAGE_SHELL, "flex flex-col gap-6")}>
        {/* Create New Code */}
        <NewInvitationForm />

        {/* List of Codes */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Códigos generados</h2>
            <CardDescription>
              {codes?.length || 0} códigos registrados
            </CardDescription>
          </div>
          {!codes || codes.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-muted-foreground text-center">
                  No has generado ningún código todavía
                </p>
              </CardContent>
            </Card>
          ) : (
            <InvitationCardsClient codes={codes} />
          )}
        </div>
      </div>
    </div>
  );
}
