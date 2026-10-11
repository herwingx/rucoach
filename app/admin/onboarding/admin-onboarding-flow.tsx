"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { completeAdminOnboarding } from "@/app/actions/admin-onboarding";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminOnboardingFlowProps {
  userId: string;
  gymName: string; // Used implicitly as a fallback for the DB
}

export function AdminOnboardingFlow({
  userId,
  gymName,
}: AdminOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [currency, setCurrency] = useState("MXN");

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const result = await completeAdminOnboarding({
        userId,
        gymName, // Passing the implicit/existing value instead of asking for it
        timezone,
        currency,
      });

      if (result.success) {
        toast.success(
          "¡Configuración guardada! Ya puedes gestionar a tus atletas.",
        );
        window.location.href = "/admin/dashboard";
      } else {
        toast.error("No pudimos guardar la configuración. Intenta de nuevo.");
      }
    } catch {
      toast.error("Algo salió mal al guardar. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg overflow-hidden bg-black flex items-center justify-center shrink-0 border border-border/40">
              <Image
                src="/android-chrome-512x512.png"
                alt="Logo RU Coach"
                width={36}
                height={36}
                className="size-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="font-black tracking-tighter uppercase text-lg">
                RU Coach
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mt-0.5">
                Rodrigo Urbina
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 max-w-xs mx-auto w-full">
          <div
            className={`size-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
              currentStep >= 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
          </div>
          <div
            className={`flex-1 h-0.5 transition-colors ${
              currentStep > 1 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`size-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
              currentStep >= 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
        </div>
      </div>

      <main id="main-content" className="flex-1 container max-w-4xl mx-auto px-4 py-6">
        <Card className="max-w-lg mx-auto rounded-2xl border-border/60">
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>Configuración Regional</CardTitle>
                <CardDescription>
                  Define tu zona horaria y la moneda que manejarás con tus atletas.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger
                      id="timezone"
                      className="h-12 md:h-12 data-[size=default]:h-12 md:data-[size=default]:h-12 w-full rounded-xl"
                    >
                      <SelectValue placeholder="Seleccionar zona horaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Mexico_City">
                        America/Mexico City
                      </SelectItem>
                      <SelectItem value="America/New_York">
                        America/New York
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        America/Los Angeles
                      </SelectItem>
                      <SelectItem value="America/Bogota">
                        America/Bogota
                      </SelectItem>
                      <SelectItem value="America/Argentina/Buenos_Aires">
                        America/Argentina
                      </SelectItem>
                      <SelectItem value="Europe/Madrid">
                        Europe/Madrid
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency">Moneda de Pagos</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger
                      id="currency"
                      className="h-12 md:h-12 data-[size=default]:h-12 md:data-[size=default]:h-12 w-full rounded-xl"
                    >
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN (Peso Mexicano)</SelectItem>
                      <SelectItem value="USD">USD (Dólar)</SelectItem>
                      <SelectItem value="COP">COP (Peso Colombiano)</SelectItem>
                      <SelectItem value="ARS">ARS (Peso Argentino)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle>¡Todo listo, Coach!</CardTitle>
                <CardDescription>
                  Tu ecosistema como entrenador está configurado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="size-10 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Bienvenido a tu plataforma</h3>
                  <p className="text-sm text-muted-foreground">
                    Comienza a transformar vidas, asignar rutinas y gestionar a tus atletas directamente desde tu panel.
                  </p>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setCurrentStep(1)}
                  className="h-12 px-6 rounded-xl font-semibold"
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-tight"
                >
                  {isSubmitting
                    ? "Configurando..."
                    : "Entrar a mi Panel"}
                  <Check className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
