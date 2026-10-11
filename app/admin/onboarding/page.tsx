import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminOnboardingFlow } from "./admin-onboarding-flow";

export default async function AdminOnboardingPage() {
  const { user, profile, role } = await getAuthData();

  if (!user || role !== "admin") {
    redirect("/auth/login");
  }

  if (profile?.onboarding_completed) {
    redirect("/admin/dashboard");
  }

  const supabase = await createClient();
  const { data: gymSettings } = await supabase
    .from("gym_settings")
    .select("gym_name")
    .eq("admin_id", user.id)
    .single();

  return (
    <AdminOnboardingFlow
      userId={user.id}
      gymName={gymSettings?.gym_name || "RU Coach"}
    />
  );
}
