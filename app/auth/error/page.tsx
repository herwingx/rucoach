import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main
      id="main-content"
      className="relative flex min-h-svh w-full items-center justify-center bg-background p-6 overflow-hidden"
      tabIndex={-1}
    >
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Card className="w-full text-center rounded-2xl border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-4">
            <div className="mx-auto size-20 rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20 flex items-center justify-center mb-6">
              <AlertCircle className="size-10 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter">
              Error de Autenticación
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Hubo un problema al procesar tu solicitud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {message ||
                "No pudimos procesar tu solicitud de autenticación. Por favor, intenta de nuevo o contacta al soporte si el problema persiste."}
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full h-12 rounded-xl font-semibold">
                <Link href="/auth/login">Volver a Iniciar Sesión</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="w-full h-12 rounded-xl font-semibold border-border/60 hover:bg-muted transition-all"
              >
                <Link href="/auth/sign-up">Crear Nueva Cuenta</Link>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              RU Coach — Coaching de Élite
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
