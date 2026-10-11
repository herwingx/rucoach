import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Plus,
  CreditCard,
  Hourglass,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { AdminKpiStatCard } from "@/components/admin/admin-kpi-stat-card";
import { createClient } from "@/lib/supabase/server";
import {
  PaymentCardsClient,
  type PaymentCardItem,
} from "./payment-cards-client";
import {
  ADMIN_DATA_PAGE_SHELL,
  AdminPageHeader,
} from "@/components/admin/admin-page-header";

type PaymentQueryRow = {
  id: string;
  client_id: string;
  amount: number;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  payment_method: string | null;
  reference: string | null;
  clients:
    | { full_name: string; email?: string | null; avatar_url?: string | null }
    | { full_name: string; email?: string | null; avatar_url?: string | null }[]
    | null;
  membership_plans:
    | { name: string }
    | { name: string }[]
    | null;
};

function toPaymentCardItem(row: PaymentQueryRow): PaymentCardItem {
  const rel = row.clients;
  const clients =
    rel == null ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel;
  const planRel = row.membership_plans;
  const planObj =
    planRel == null
      ? null
      : Array.isArray(planRel)
        ? (planRel[0] ?? null)
        : planRel;
  return {
    id: row.id,
    client_id: row.client_id,
    amount: row.amount,
    paid_at: row.paid_at,
    period_start: row.period_start,
    period_end: row.period_end,
    payment_method: row.payment_method,
    reference: row.reference,
    plan_name: planObj?.name ?? null,
    clients,
  };
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AdminPaymentsPage() {
  const { user, role } = await getAuthData();

  if (!user || role !== "admin") {
    redirect("/auth/login");
  }

  const supabase = await createClient();

  const { data: coachClients } = await supabase
    .from("clients")
    .select("id, status, membership_end")
    .eq("coach_id", user.id);

  const clientRows = coachClients ?? [];
  const clientIds = clientRows.map((c) => c.id).filter(Boolean);

  let payments: PaymentCardItem[] = [];
  if (clientIds.length > 0) {
    const { data } = await supabase
      .from("payments")
      .select(
        `
        id,
        client_id,
        amount,
        paid_at,
        period_start,
        period_end,
        payment_method,
        reference,
        clients (full_name, email, avatar_url),
        membership_plans (name)
      `,
      )
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });

    payments = (data ?? []).map((row) =>
      toPaymentCardItem(row as unknown as PaymentQueryRow),
    );
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthRevenue = payments.reduce((sum, p) => {
    if (!p.paid_at) return sum;
    const d = new Date(
      p.paid_at.includes("T") ? p.paid_at : `${p.paid_at}T12:00:00`,
    );
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      return sum + (p.amount || 0);
    }
    return sum;
  }, 0);

  const totalRevenue = payments.reduce(
    (sum, p) => (p.paid_at ? sum + (p.amount || 0) : sum),
    0,
  );

  const pendingAmount = payments.reduce(
    (sum, p) => (!p.paid_at ? sum + (p.amount || 0) : sum),
    0,
  );
  const pendingCount = payments.filter((p) => !p.paid_at).length;

  const activeClientsCount = clientRows.filter(
    (c) => c.status === "active",
  ).length;
  const expiredClientsCount = clientRows.filter(
    (c) => c.status === "expired",
  ).length;

  return (
    <div className="min-h-dvh bg-background">
      <AdminPageHeader
        sticky
        title="Pagos y Membresías"
        description={`${payments.length} cobro${payments.length !== 1 ? "s" : ""} registrado${payments.length !== 1 ? "s" : ""} · Control de ingresos y vigencias`}
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/payments/new">
              <Plus className="mr-2 size-4" />
              Nuevo Pago
            </Link>
          </Button>
        }
      />

      <div className={ADMIN_DATA_PAGE_SHELL}>
        <div className="grid gap-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <AdminKpiStatCard
              icon={TrendingUp}
              value={formatMoney(currentMonthRevenue)}
              label="Ingresos del Mes"
              description="Cobrado este mes"
              tone="success"
            />
            <AdminKpiStatCard
              icon={CreditCard}
              value={formatMoney(totalRevenue)}
              label="Ingresos Históricos"
              description={`${payments.length - pendingCount} pagos liquidados`}
              tone="primary"
            />
            <AdminKpiStatCard
              icon={Hourglass}
              value={formatMoney(pendingAmount)}
              label="Por Cobrar"
              description={
                pendingCount > 0
                  ? `${pendingCount} cobro${pendingCount === 1 ? "" : "s"} pendiente${pendingCount === 1 ? "" : "s"}`
                  : "Sin adeudos"
              }
              tone="warning"
            />
            <AdminKpiStatCard
              icon={UserCheck}
              value={`${activeClientsCount}/${clientRows.length}`}
              label="Membresías Activas"
              description={
                expiredClientsCount > 0
                  ? `${expiredClientsCount} vencida${expiredClientsCount === 1 ? "" : "s"} por renovar`
                  : "Todas al corriente"
              }
              tone="neutral"
            />
          </div>

          {/* Payments List */}
          <div className="flex flex-col gap-4">
            {payments.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <p className="text-muted-foreground text-center">
                    No hay pagos registrados aún.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <PaymentCardsClient payments={payments} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
