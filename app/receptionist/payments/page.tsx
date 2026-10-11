import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CreditCard, Calendar, Plus } from "lucide-react";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

function parseLocalDate(dateStr: string): Date {
  const clean = dateStr.slice(0, 10);
  return new Date(`${clean}T12:00:00`);
}

export default async function ReceptionistPaymentsPage() {
  const { user, role } = await getAuthData();

  if (!user || (role !== "receptionist" && role !== "admin")) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { data: rawPayments } = await supabase
    .from("payments")
    .select(
      `
      id,
      amount,
      payment_method,
      paid_at,
      period_start,
      period_end,
      notes,
      created_at,
      clients (
        full_name,
        email
      ),
      membership_plans (
        name
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const payments = rawPayments ?? [];
  const paidCount = payments.filter((p) => Boolean(p.paid_at)).length;
  const pendingCount = payments.length - paidCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Control de Pagos
          </h1>
          <p className="text-sm text-muted-foreground">
            {paidCount} completados · {pendingCount} pendientes
          </p>
        </div>

        {role === "admin" && (
          <Button asChild size="sm" className="w-fit">
            <Link href="/admin/payments/new">
              <Plus className="size-4 mr-1.5" />
              Nuevo Pago
            </Link>
          </Button>
        )}
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-foreground">
              No hay pagos registrados
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Los pagos de membresías aparecerán listados aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payments.map((payment) => {
            const clientObj = Array.isArray(payment.clients)
              ? payment.clients[0]
              : payment.clients;
            const planObj = Array.isArray(payment.membership_plans)
              ? payment.membership_plans[0]
              : payment.membership_plans;
            const isPaid = Boolean(payment.paid_at);

            return (
              <Card
                key={payment.id}
                className="border-border/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-bold truncate">
                      {clientObj?.full_name ?? "Cliente sin nombre"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground truncate">
                      {planObj?.name ?? "Membresía general"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isPaid
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }
                  >
                    {isPaid ? "Pagado" : "Pendiente"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black tracking-tight">
                      ${Number(payment.amount || 0).toLocaleString("es-MX")}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {payment.payment_method
                        ? (PAYMENT_METHOD_LABELS[payment.payment_method] ??
                          payment.payment_method)
                        : "Sin método"}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 border-t border-border/50 pt-2.5">
                    {payment.paid_at && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
                        <span>
                          Pagado:{" "}
                          {parseLocalDate(payment.paid_at).toLocaleDateString(
                            "es-MX",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    )}
                    {payment.period_start && payment.period_end && (
                      <p className="text-[11px] text-muted-foreground/80">
                        Periodo:{" "}
                        {parseLocalDate(
                          payment.period_start,
                        ).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        –{" "}
                        {parseLocalDate(
                          payment.period_end,
                        ).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

