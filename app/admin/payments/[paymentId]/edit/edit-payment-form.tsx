"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { updatePayment } from "@/app/actions/payments";
import { toast } from "sonner";
import { format } from "date-fns";

function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
}

type PaymentWithClient = {
  id: string;
  amount: number;
  paid_at: string | null;
  payment_method: string | null;
  period_start: string | null;
  period_end: string | null;
  reference: string | null;
  clients: { full_name: string; email?: string | null } | null;
};

export function EditPaymentForm({ payment }: { payment: PaymentWithClient }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [amount, setAmount] = useState(payment.amount?.toString() ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    payment.payment_method ?? "cash",
  );
  const [paidAt, setPaidAt] = useState<Date | undefined>(
    parseLocalDate(payment.paid_at),
  );
  const [periodStart, setPeriodStart] = useState<Date | undefined>(
    parseLocalDate(payment.period_start),
  );
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(
    parseLocalDate(payment.period_end),
  );
  const [reference, setReference] = useState(payment.reference ?? "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount < 0) {
      toast.error("Monto inválido");
      return;
    }

    setIsPending(true);
    try {
      const result = await updatePayment(payment.id, {
        amount: numAmount,
        paid_at: paidAt ? format(paidAt, "yyyy-MM-dd") : undefined,
        payment_method: paymentMethod,
        period_start: periodStart
          ? format(periodStart, "yyyy-MM-dd")
          : undefined,
        period_end: periodEnd ? format(periodEnd, "yyyy-MM-dd") : undefined,
        reference: reference || undefined,
      });
      if (result.success) {
        toast.success("Pago actualizado correctamente");
        router.push("/admin/payments");
        router.refresh();
      } else {
        toast.error(result.error || "No se pudo actualizar");
      }
    } catch {
      toast.error("Error al actualizar. Intenta de nuevo.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar pago</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="amount">Monto *</FieldLabel>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="paymentMethod">Método de pago</FieldLabel>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Fecha de pago</FieldLabel>
              <DatePicker date={paidAt} setDate={setPaidAt} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Inicio del periodo</FieldLabel>
                <DatePicker date={periodStart} setDate={setPeriodStart} />
              </Field>
              <Field>
                <FieldLabel>Fin del periodo</FieldLabel>
                <DatePicker date={periodEnd} setDate={setPeriodEnd} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="reference">Referencia</FieldLabel>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Referencia o nota"
              />
            </Field>
          </FieldGroup>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/payments">Cancelar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
