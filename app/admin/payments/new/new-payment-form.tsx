"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { registerPayment } from "@/app/actions/payments";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { unstable_rethrow } from "next/navigation";

interface Client {
  id: string;
  full_name: string;
  email: string;
  status?: string | null;
  current_plan_id?: string | null;
  membership_end?: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

interface NewPaymentFormProps {
  clients: Client[];
  plans: Plan[];
  initialClientId?: string;
}

function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const CLIENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: {
    label: "Activo",
    className: "text-success bg-success/10 border-success/30",
  },
  expired: {
    label: "Vencido",
    className: "text-destructive bg-destructive/10 border-destructive/30",
  },
  paused: {
    label: "Pausado",
    className: "text-warning-foreground bg-warning/15 border-warning/35",
  },
  pending: {
    label: "Pendiente",
    className: "text-muted-foreground bg-muted border-border",
  },
};

export function NewPaymentForm({
  clients,
  plans,
  initialClientId,
}: NewPaymentFormProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [openClientSelect, setOpenClientSelect] = React.useState(false);
  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("none");
  const [amount, setAmount] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<string>("cash");
  const [paymentStatus, setPaymentStatus] = React.useState<"paid" | "pending">("paid");
  const [paidAt, setPaidAt] = React.useState<Date | undefined>(new Date());
  const [periodStart, setPeriodStart] = React.useState<Date | undefined>(
    new Date(),
  );
  const [periodEnd, setPeriodEnd] = React.useState<Date | undefined>(
    addDays(new Date(), 30),
  );

  const applyClientDefaults = React.useCallback(
    (clientId: string) => {
      setSelectedClientId(clientId);
      const client = clients.find((c) => c.id === clientId);
      if (!client) return;

      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const currentEnd = parseLocalDate(client.membership_end);
      // Si la membresía actual aún está vigente en el futuro, sugerir continuar desde su fecha de fin
      const suggestedStart =
        currentEnd && currentEnd > today ? currentEnd : today;
      setPeriodStart(suggestedStart);

      const matchedPlan = client.current_plan_id
        ? plans.find((p) => p.id === client.current_plan_id)
        : undefined;

      if (matchedPlan) {
        setSelectedPlanId(matchedPlan.id);
        setAmount(matchedPlan.price.toString());
        setPeriodEnd(
          addDays(suggestedStart, matchedPlan.duration_days || 30),
        );
      } else {
        setPeriodEnd(addDays(suggestedStart, 30));
      }
    },
    [clients, plans],
  );

  React.useEffect(() => {
    if (initialClientId && clients.some((c) => c.id === initialClientId)) {
      applyClientDefaults(initialClientId);
    }
  }, [initialClientId, clients, applyClientDefaults]);

  // Handle plan selection to auto-fill amount and dates
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    if (planId === "none") {
      setAmount("");
      return;
    }

    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setAmount(plan.price.toString());

      const start = periodStart || new Date();
      setPeriodStart(start);

      if (plan.duration_days) {
        setPeriodEnd(addDays(start, plan.duration_days));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedClientId) {
      toast.error("Selecciona un asesorado para registrar el pago.");
      return;
    }

    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    formData.set("clientId", selectedClientId);
    formData.set("planId", selectedPlanId === "none" ? "" : selectedPlanId);
    formData.set("amount", amount);
    formData.set("paymentMethod", paymentMethod);
    formData.set("paymentStatus", paymentStatus);
    formData.set(
      "paidAt",
      paymentStatus === "paid" && paidAt ? format(paidAt, "yyyy-MM-dd") : "",
    );
    formData.set(
      "periodStart",
      periodStart ? format(periodStart, "yyyy-MM-dd") : "",
    );
    formData.set("periodEnd", periodEnd ? format(periodEnd, "yyyy-MM-dd") : "");

    try {
      await registerPayment(formData);
      toast.success(
        paymentStatus === "paid"
          ? "¡Pago registrado y membresía actualizada!"
          : "¡Cargo pendiente registrado correctamente!",
      );
    } catch (error) {
      unstable_rethrow(error);
      toast.error(
        "No pudimos registrar el pago. Revisa los datos e intenta de nuevo.",
      );
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="clientId">Asesorado *</FieldLabel>
              <Popover
                open={openClientSelect}
                onOpenChange={setOpenClientSelect}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openClientSelect}
                    className="w-full min-w-0 justify-between font-normal h-11"
                  >
                    <span className="min-w-0 truncate">
                      {selectedClientId
                        ? `${selectedClient?.full_name} (${selectedClient?.email})`
                        : "Seleccionar asesorado..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar asesorado por nombre o correo..." />
                    <CommandList>
                      <CommandEmpty>No se encontró el asesorado.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => {
                          const statusMeta =
                            CLIENT_STATUS_LABELS[client.status || "active"] ??
                            CLIENT_STATUS_LABELS.active;
                          return (
                            <CommandItem
                              key={client.id}
                              value={`${client.full_name} ${client.email}`}
                              onSelect={() => {
                                applyClientDefaults(client.id);
                                setOpenClientSelect(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  selectedClientId === client.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate font-medium">
                                    {client.full_name}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {client.email}
                                  </span>
                                </div>
                                <span
                                  className={cn(
                                    "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                    statusMeta.className,
                                  )}
                                >
                                  {statusMeta.label}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedClient?.membership_end && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Vigencia actual registrada:{" "}
                  <span className="font-semibold text-foreground">
                    {format(
                      parseLocalDate(selectedClient.membership_end) || new Date(),
                      "dd/MM/yyyy",
                    )}
                  </span>
                </p>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="planId">Plan de Membresía</FieldLabel>
                <Select value={selectedPlanId} onValueChange={handlePlanChange}>
                  <SelectTrigger id="planId" className="w-full">
                    <SelectValue placeholder="Sin plan específico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Sin plan específico (personalizado)</SelectItem>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} — ${plan.price.toLocaleString("es-MX")} ({plan.duration_days} días)
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="paymentStatus">Estado del Cobro</FieldLabel>
                <Select
                  value={paymentStatus}
                  onValueChange={(v) => setPaymentStatus(v as "paid" | "pending")}
                >
                  <SelectTrigger id="paymentStatus" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="paid">
                        Pagado (activar vigencia y enviar recibo)
                      </SelectItem>
                      <SelectItem value="pending">
                        Pendiente por cobrar (dejar adeudo registrado)
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="amount">Monto (MXN) *</FieldLabel>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Al elegir un plan se sugiere el precio; puedes ajustarlo por descuento o promoción.
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="paymentMethod">Método de Pago</FieldLabel>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod" className="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {paymentStatus === "paid" && (
              <Field>
                <FieldLabel>Fecha en que se realizó el pago</FieldLabel>
                <DatePicker date={paidAt} setDate={setPaidAt} />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Inicio del Período de Vigencia</FieldLabel>
                <DatePicker
                  date={periodStart}
                  setDate={(newStart) => {
                    setPeriodStart(newStart);
                    if (newStart && selectedPlanId !== "none") {
                      const plan = plans.find((p) => p.id === selectedPlanId);
                      if (plan?.duration_days) {
                        setPeriodEnd(addDays(newStart, plan.duration_days));
                      }
                    }
                  }}
                />
              </Field>
              <Field>
                <FieldLabel>Fin del Período de Vigencia</FieldLabel>
                <DatePicker date={periodEnd} setDate={setPeriodEnd} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="reference">Concepto / Referencia / Folio</FieldLabel>
              <Input
                id="reference"
                name="reference"
                placeholder="Ej. Mensualidad Octubre, Folio SPEI #1234, Ajuste..."
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending
                ? "Registrando..."
                : paymentStatus === "paid"
                  ? "Registrar Pago y Activar"
                  : "Guardar como Pendiente"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isPending}
              asChild
            >
              <Link href="/admin/payments">Cancelar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
