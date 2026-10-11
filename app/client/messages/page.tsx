import { getAuthUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatViewLazy } from "@/components/chat/chat-view-lazy";
import Link from "next/link";
import { UserRoundSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  CLIENT_DATA_PAGE_SHELL,
  ClientStackPageHeader,
} from "@/components/client/client-app-page-parts";

export default async function ClientMessagesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  // 1. Obtener el rol del usuario actual
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "client";

  if (role !== "client") {
    redirect("/admin/dashboard");
  }

  // 2. Intentar encontrar al coach
  let coachId: string | null = null;
  let coachCandidate: { full_name: string | null; avatar_url: string | null } | null = null;

  // A. Vía tabla clients
  const { data: clientWithCoach } = await supabase
    .from("clients")
    .select("coach_id")
    .eq("user_id", user.id)
    .maybeSingle();
  
  if (clientWithCoach?.coach_id) {
    coachId = clientWithCoach.coach_id;
  }

  // B. Vía invitación (si no hay coach directo)
  if (!coachId) {
    const { data: inv } = await supabase
      .from("invitation_codes")
      .select("created_by")
      .eq("used_by_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (inv?.created_by) {
      coachId = inv.created_by;
    }
  }

  // C. Fallback a administrador (si sigue sin coach)
  if (!coachId) {
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "admin")
      .order("created_at", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    
    if (adminProfile) {
      coachId = adminProfile.id;
      coachCandidate = { full_name: adminProfile.full_name, avatar_url: adminProfile.avatar_url };
    }
  }

  // 3. Intentar obtener el perfil del coach si no lo tenemos aún
  if (coachId && !coachCandidate) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", coachId)
      .maybeSingle();
    
    if (profileData) {
      coachCandidate = profileData;
    }
  }

  // Si después de todo no hay ID, mostramos estado vacío
  if (!coachId) {
    return (
      <>
        <ClientStackPageHeader
          title="Mensajes"
          subtitle="Tu chat directo con el coach · avisos, dudas y seguimiento."
        />
        <div className={CLIENT_DATA_PAGE_SHELL}>
          <Empty className="rounded-3xl border-border/80 shadow-sm ring-1 ring-primary/5">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRoundSearch />
              </EmptyMedia>
              <EmptyTitle>Sin coach asignado</EmptyTitle>
              <EmptyDescription>
                Cuando tu entrenador te vincule o completes una invitación,
                podrás chatear aquí en tiempo real.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/client/dashboard">Ir al panel</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/client/profile">Revisar mi perfil</Link>
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        </div>
      </>
    );
  }

  const otherUser = {
    id: coachId,
    name: coachCandidate?.full_name || "Rodrigo Urbina",
    avatarUrl: coachCandidate?.avatar_url || null,
  };

  return (
    <div className="flex h-full w-full min-h-0 flex-1 flex-col bg-background">
      <ChatViewLazy
        currentUserId={user.id}
        role={role}
        otherUser={otherUser}
        conversations={[]}
      />
    </div>
  );
}
