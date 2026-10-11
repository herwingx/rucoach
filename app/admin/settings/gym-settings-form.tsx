"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { updateGymSettings } from "@/app/actions/gym-settings";
import { Building2, Phone, Clock, Globe2, Coins, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface GymSettingsFormProps {
  initialData: {
    gym_name: string;
    phone?: string;
    schedule?: string;
    currency: string;
    timezone: string;
  } | null;
}

const CURRENCIES = [
  { value: "MXN", label: "MXN ($) · Peso mexicano" },
  { value: "USD", label: "USD ($) · Dólar estadounidense" },
  { value: "EUR", label: "EUR (€) · Euro" },
  { value: "COP", label: "COP ($) · Peso colombiano" },
  { value: "ARS", label: "ARS ($) · Peso argentino" },
  { value: "CLP", label: "CLP ($) · Peso chileno" },
  { value: "PEN", label: "PEN (S/) · Sol peruano" },
];

const TIMEZONES = [
  { value: "America/Mexico_City", label: "Ciudad de México (Centro)" },
  { value: "America/Monterrey", label: "Monterrey (Noreste)" },
  { value: "America/Cancun", label: "Cancún (Sureste)" },
  { value: "America/Mazatlan", label: "Mazatlán / Culiacán (Pacífico)" },
  { value: "America/Hermosillo", label: "Hermosillo / Sonora" },
  { value: "America/Tijuana", label: "Tijuana / Baja California" },
  { value: "America/Bogota", label: "Bogotá, Colombia" },
  { value: "America/Lima", label: "Lima, Perú" },
  { value: "America/Santiago", label: "Santiago, Chile" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires, Argentina" },
  { value: "America/New_York", label: "Nueva York (Este EE. UU.)" },
  { value: "America/Chicago", label: "Chicago / Texas (Centro EE. UU.)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (Pacífico EE. UU.)" },
  { value: "Europe/Madrid", label: "Madrid, España" },
];

export function GymSettingsForm({ initialData }: GymSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gymName, setGymName] = useState(initialData?.gym_name ?? "RU Coach");
  const [phone, setPhone] = useState(initialData?.phone ?? "9612378473");
  const [schedule, setSchedule] = useState(initialData?.schedule ?? "");
  const [currency, setCurrency] = useState(initialData?.currency ?? "MXN");
  const [timezone, setTimezone] = useState(
    initialData?.timezone ?? "America/Mexico_City",
  );

  useEffect(() => {
    if (initialData) {
      setGymName(initialData.gym_name);
      setPhone(initialData.phone ?? "9612378473");
      setSchedule(initialData.schedule ?? "");
      setCurrency(initialData.currency ?? "MXN");
      setTimezone(initialData.timezone ?? "America/Mexico_City");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim()) {
      toast.error("El nombre de tu marca o gimnasio es obligatorio.");
      return;
    }
    setLoading(true);
    const result = await updateGymSettings({
      gym_name: gymName.trim(),
      phone: phone.trim() || undefined,
      schedule: schedule.trim() || undefined,
      currency,
      timezone,
    });
    setLoading(false);
    if (result.success) {
      toast.success("¡Configuración guardada correctamente!");
      router.refresh();
    } else {
      toast.error(
        "No pudimos guardar los cambios. Revisa los datos e intenta de nuevo.",
      );
    }
  };

  return (
    <Card className="border-muted/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Tu marca y operación</CardTitle>
        <CardDescription>
          Configura cómo se muestra tu negocio y las preferencias locales.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Identidad de marca
              </h3>
              <Field>
                <FieldLabel htmlFor="gym_name">
                  Nombre de tu Marca o Gimnasio
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Building2 data-icon="inline-start" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="gym_name"
                    placeholder="RU Coach"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    required
                  />
                </InputGroup>
              </Field>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contacto y Horario
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="phone">Teléfono de contacto</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Phone data-icon="inline-start" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="phone"
                      type="tel"
                      placeholder="+52 55 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="schedule">
                    Horario de Servicio
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Clock data-icon="inline-start" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="schedule"
                      placeholder="Lun-Vie 6:00-22:00"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                    />
                  </InputGroup>
                </Field>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preferencias Locales
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Moneda de cobro</FieldLabel>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-3">
                        <Coins className="size-4 text-muted-foreground" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Zona horaria</FieldLabel>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-3">
                        <Globe2 className="size-4 text-muted-foreground" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TIMEZONES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </FieldGroup>

          <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-2 border-t bg-background/80 p-6 backdrop-blur-md md:static md:mx-0 md:mb-0 md:mt-2 md:bg-transparent md:p-0 md:pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 sm:w-auto"
            >
              {loading ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save data-icon="inline-start" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
