import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GymSettingsForm } from "./gym-settings-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Library,
  User,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ADMIN_DATA_PAGE_SHELL,
  AdminPageHeader,
} from "@/components/admin/admin-page-header";
import { CoachProfileSettings } from "@/components/admin/coach-profile-settings";
import { MembershipPlansSettings } from "@/components/admin/membership-plans-settings";
import { cn } from "@/lib/utils";

export default async function AdminSettingsPage() {
  const { user, role, profile } = await getAuthData();

  if (!user || role !== "admin") redirect("/auth/login");

  const supabase = await createClient();

  const [{ data: gymSettings }, { data: membershipPlans }] = await Promise.all([
    supabase
      .from("gym_settings")
      .select("gym_name, phone, schedule, currency, timezone")
      .eq("admin_id", user.id)
      .maybeSingle(),
    supabase
      .from("membership_plans")
      .select("id, name, duration_days, price, description, is_active, coach_id")
      .order("price", { ascending: true }),
  ]);

  const normalizedPlans = (membershipPlans ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    duration_days: Number(p.duration_days) || 30,
    price: Number(p.price) || 0,
    description: p.description ?? null,
    is_active: Boolean(p.is_active ?? true),
    coach_id: p.coach_id ?? null,
  }));

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        sticky
        title="Configuración"
        description="Administra los datos de tu negocio y la experiencia de tus asesorados."
      />

      <div className={cn(ADMIN_DATA_PAGE_SHELL, "space-y-8")}>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">

          <Tabs defaultValue="profile" className="flex flex-col gap-6">
            <TabsList className="no-scrollbar flex h-auto w-full sm:w-fit items-center justify-start overflow-x-auto rounded-2xl border border-border/40 bg-muted/50 p-1 shadow-sm">
              <TabsTrigger
                value="profile"
                className="shrink-0 gap-2 rounded-xl px-4 py-2 data-[state=active]:shadow-md"
              >
                <User className="size-4" />
                Mi perfil
              </TabsTrigger>
              <TabsTrigger
                value="plans"
                className="shrink-0 gap-2 rounded-xl px-4 py-2 data-[state=active]:shadow-md"
              >
                <CreditCard className="size-4" />
                Planes y Tarifas
              </TabsTrigger>
              <TabsTrigger
                value="general"
                className="shrink-0 gap-2 rounded-xl px-4 py-2 data-[state=active]:shadow-md"
              >
                <Settings className="size-4" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="biblioteca"
                className="shrink-0 gap-2 rounded-xl px-4 py-2 data-[state=active]:shadow-md"
              >
                <Library className="size-4" />
                Biblioteca
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-0">
              <CoachProfileSettings
                userId={user.id}
                initialFullName={profile?.full_name}
                initialAvatarUrl={profile?.avatar_url}
              />
            </TabsContent>
            <TabsContent value="plans" className="mt-0">
              <MembershipPlansSettings
                initialPlans={normalizedPlans}
                currency={gymSettings?.currency ?? "MXN"}
              />
            </TabsContent>
            <TabsContent value="general" className="mt-0">
              <GymSettingsForm
                initialData={
                  gymSettings
                    ? {
                        gym_name: gymSettings.gym_name,
                        phone: gymSettings.phone ?? undefined,
                        schedule: gymSettings.schedule ?? undefined,
                        currency: gymSettings.currency ?? "MXN",
                        timezone: gymSettings.timezone ?? "America/Mexico_City",
                      }
                    : null
                }
              />
            </TabsContent>

            <TabsContent value="biblioteca" className="mt-0">
              <Card className="overflow-hidden border-dashed bg-muted/30">
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg">
                      Biblioteca de ejercicios
                    </CardTitle>
                    <CardDescription>
                      Catálogo con GIF, técnica y altas nuevas — mismo listado
                      que en el menú lateral.
                    </CardDescription>
                  </div>
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                  >
                    <Link href="/admin/exercises">
                      <Library data-icon="inline-start" />
                      Abrir catálogo
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-muted-foreground/20 bg-background/50 px-4 py-6 text-center">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">
                        Añade movimientos y revisa demostraciones
                      </p>
                      <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                        Desde el catálogo puedes abrir la ficha completa (como
                        la ve el asesorado) y crear ejercicios con URL de GIF o
                        imagen.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
