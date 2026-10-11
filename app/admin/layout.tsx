import { getAuthData } from "@/lib/auth-utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLayoutShell } from "@/components/admin-layout-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, profile } = await getAuthData();

  if (!user || role !== "admin") {
    redirect("/auth/login");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isOnboardingRoute = pathname.startsWith("/admin/onboarding");

  // Redirigir a onboarding si no está completado (evitando bucle infinito en /admin/onboarding)
  if (profile && !profile.onboarding_completed && !isOnboardingRoute) {
    redirect("/admin/onboarding");
  }

  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </div>
  );
}
