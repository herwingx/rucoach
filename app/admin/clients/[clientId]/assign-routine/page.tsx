import { getAuthUser, getUserRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoutines } from "@/lib/routines";
import { ADMIN_FORM_PAGE_SHELL } from "@/components/admin/admin-page-header";
import { AssignRoutineForm } from "./assign-routine-form";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function AssignRoutinePage({ params }: Props) {
  const user = await getAuthUser();
  const role = await getUserRole();
  const { clientId } = await params;

  if (!user) redirect("/auth/login");
  if (role !== "admin") redirect("/auth/login");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("full_name")
    .eq("id", clientId)
    .eq("coach_id", user.id)
    .single();

  if (!client) redirect("/admin/clients");

  const routines = await getRoutines();

  return (
    <div
      data-shell={ADMIN_FORM_PAGE_SHELL}
      className="[&_main]:w-full [&_main]:min-w-0 [&_main]:max-w-2xl [&_main]:mx-auto [&_main]:px-4 sm:[&_main]:px-6 md:[&_main]:px-8 [&_main]:py-6 sm:[&_main]:py-8"
    >
      <AssignRoutineForm
        clientId={clientId}
        clientName={client.full_name}
        routines={routines}
      />
    </div>
  );
}
