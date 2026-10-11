import { createClient } from "@/lib/supabase/server";
import { getAuthData } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AlertTriangle, LogOut, MessageCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { user, profile } = await getAuthData();
  const supabase = await createClient();

  // Obtener el teléfono del coach (el primer admin registrado)
  const { data: gym } = await supabase
    .from("gym_settings")
    .select("phone, gym_name")
    .limit(1)
    .single();

  const coachPhone = gym?.phone?.replace(/\D/g, ""); // Limpiar para WhatsApp
  const userEmail = profile?.email || user?.email || "";
  
  const isPaused = status === "pending_payment";
  let title = "Acceso Restringido";
  let description = (
    <>
      Tu acceso a <span className="text-foreground font-bold">{gym?.gym_name || "RU Coach"}</span> ha
      sido temporalmente suspendido
    </>
  );
  let icon = <AlertTriangle className="size-10 text-destructive animate-pulse" />;

  // Preparar mensaje de WhatsApp
  const waBase = "https://wa.me/";
  let waText = `Hola Rodrigo, tengo un problema con mi acceso a la app (Estado: ${status || 'suspendido'}). Mi correo es: ${userEmail}`;
  
  if (isPaused) {
    title = "Falta Pago";
    description = (
      <>
        Tu cuenta está casi lista. Falta registrar tu pago de suscripción a{" "}
        <span className="text-foreground font-bold">{gym?.gym_name || "RU Coach"}</span>.
      </>
    );
    icon = <Clock className="size-10 text-amber-500 animate-pulse" />;
    waText = `Hola Rodrigo, acabo de registrar mi cuenta en la app y quería coordinar el pago de mi suscripción para activarla. Mi correo es: ${userEmail}`;
  } else if (status === "expired") {
    title = "Suscripción Vencida";
    description = (
      <>
        Tu tiempo de acceso a <span className="text-foreground font-bold">{gym?.gym_name || "RU Coach"}</span>{" "}
        ha terminado. 
      </>
    );
    waText = `Hola Rodrigo, mi acceso a la app ha vencido y quisiera renovarlo. Mi correo es: ${userEmail}`;
  }

  const waLink = coachPhone 
    ? `${waBase}${coachPhone}?text=${encodeURIComponent(waText)}`
    : "#"; // Fallback si no hay teléfono configurado

  return (
    <div
      id="main-content"
      role="main"
      className="relative min-h-dvh bg-background flex items-center justify-center p-6 safe-area-inset-top safe-area-inset-bottom"
      tabIndex={-1}
    >
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card
        className={`w-full max-w-md text-center shadow-2xl ${
          isPaused
            ? "border-amber-500/20 shadow-amber-500/10"
            : "border-destructive/20 shadow-destructive/10"
        }`}
      >
        <CardHeader className="pb-4">
          <div
            className={`mx-auto size-20 rounded-full flex items-center justify-center mb-6 ring-1 ${
              isPaused
                ? "bg-amber-500/10 ring-amber-500/20"
                : "bg-destructive/10 ring-destructive/20"
            }`}
          >
            {icon}
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">
            {title}
          </CardTitle>
          <CardDescription className="text-base font-medium">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="p-5 bg-muted/50 rounded-xl text-left space-y-3 border border-border/50">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Estado de la cuenta:
            </p>
            <ul className="text-sm text-foreground/80 space-y-2 font-medium">
              {status === "pending_payment" ? (
                <>
                  <li className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full bg-primary`} />
                    Registro de cuenta completado
                  </li>
                  <li className="flex items-center gap-2 text-amber-500">
                    <div className={`size-1.5 rounded-full bg-amber-500`} />
                    Pago de suscripción pendiente
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full bg-border`} />
                    Activación administrativa
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2 text-destructive">
                    <div className={`size-1.5 rounded-full bg-destructive`} />
                    Acceso restringido / Vencido
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full bg-muted-foreground/30`} />
                    Revisión administrativa necesaria
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            {coachPhone ? (
              <Button
                className="w-full gap-2 h-12 rounded-xl text-base font-bold uppercase tracking-tight bg-[#25D366] hover:bg-[#20ba56] text-white border-0 shadow-lg shadow-[#25D366]/20"
                asChild
              >
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-5 fill-current" />
                  Contactar a WhatsApp
                </a>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Contacta a tu coach para restaurar el acceso.
              </p>
            )}

            <Button
              variant="outline"
              className="w-full gap-2 h-12 text-sm font-semibold rounded-xl border-border/60 hover:bg-muted transition-all"
              asChild
            >
              <Link href="/auth/logout" prefetch={false}>
                <LogOut className="size-4" />
                Cerrar Sesión
              </Link>
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            {gym?.gym_name || "RU Coach"} — Coaching de Élite
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
