"use client";

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
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
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
          <div className="mx-auto size-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 ring-1 ring-amber-500/20">
            <WifiOff className="size-10 text-amber-500" />
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">
            Sin Conexión
          </CardTitle>
          <CardDescription className="text-base font-medium">
            No pudimos conectar con{" "}
            <span className="text-foreground font-bold">RU Coach</span>. Verifica
            tu conexión a internet e inténtalo nuevamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full gap-2 h-12 text-sm font-bold uppercase tracking-tight rounded-xl"
            >
              <RefreshCw className="size-4" />
              Reintentar conexión
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2 h-12 text-sm font-semibold rounded-xl border-border/60 hover:bg-muted transition-all"
              asChild
            >
              <Link href="/">
                <Home className="size-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            RU Coach — Coaching de Élite
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
