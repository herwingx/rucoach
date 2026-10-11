import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
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
      <Card className="w-full max-w-md text-center border-border/60 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="mx-auto size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/20">
            <Compass className="size-10 text-primary" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            Error 404
          </p>
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">
            Página no encontrada
          </CardTitle>
          <CardDescription className="text-base font-medium">
            La ruta que buscas no existe o fue movida dentro de{" "}
            <span className="text-foreground font-bold">RU Coach</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            className="w-full gap-2 h-12 text-sm font-bold uppercase tracking-tight rounded-xl"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="size-4" />
              Volver al inicio
            </Link>
          </Button>

          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            RU Coach — Coaching de Élite
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
