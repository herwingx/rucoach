"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminCardWithActions,
  AdminCardHeaderWithActions,
  type AdminCardMenuSection,
} from "@/components/admin/admin-card-with-actions";
import {
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  Search,
  CreditCard,
  RefreshCw,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { deletePayment, markPaymentAsPaid } from "@/app/actions/payments";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
}

function getPeriodValidityInfo(
  periodEnd?: string | null,
  isLatestForClient?: boolean,
): {
  state: "active" | "expiring_soon" | "expired" | "historical" | "unknown";
  daysDiff: number | null;
  label: string;
  badgeClassName: string;
} {
  if (!periodEnd) {
    return {
      state: "unknown",
      daysDiff: null,
      label: "Sin fecha de corte",
      badgeClassName:
        "border-border bg-muted/50 text-muted-foreground text-[10px] font-semibold",
    };
  }

  const datePart = periodEnd.slice(0, 10);
  const endDate = new Date(`${datePart}T23:59:59`);
  if (Number.isNaN(endDate.getTime())) {
    return {
      state: "unknown",
      daysDiff: null,
      label: "Sin fecha de corte",
      badgeClassName:
        "border-border bg-muted/50 text-muted-foreground text-[10px] font-semibold",
    };
  }

  const diffDays = Math.ceil(
    (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    if (isLatestForClient === false) {
      return {
        state: "historical",
        daysDiff: diffDays,
        label: "Ciclo anterior",
        badgeClassName:
          "border-border/60 bg-muted/40 text-muted-foreground text-[10px] font-semibold",
      };
    }
    const elapsed = Math.abs(diffDays);
    return {
      state: "expired",
      daysDiff: diffDays,
      label: elapsed === 1 ? "Vencido hace 1d" : `Vencido hace ${elapsed}d`,
      badgeClassName:
        "border-destructive/35 bg-destructive/12 text-destructive text-[10px] font-bold",
    };
  }

  if (diffDays <= 5) {
    return {
      state: "expiring_soon",
      daysDiff: diffDays,
      label: diffDays === 0 ? "Vence hoy" : `Por vencer · ${diffDays}d`,
      badgeClassName:
        "border-warning/40 bg-warning/15 text-warning-foreground text-[10px] font-bold",
    };
  }

  return {
    state: "active",
    daysDiff: diffDays,
    label: `Vigente · ${diffDays}d restantes`,
    badgeClassName:
      "border-success/30 bg-success/12 text-success text-[10px] font-bold",
  };
}

export type PaymentCardItem = {
  id: string;
  client_id: string;
  amount: number;
  paid_at: string | null;
  status?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  payment_method?: string | null;
  reference?: string | null;
  plan_name?: string | null;
  is_latest_for_client?: boolean;
  clients: {
    full_name: string;
    email?: string | null;
    avatar_url?: string | null;
    membership_end?: string | null;
    status?: string | null;
  } | null;
};

interface PaymentCardsClientProps {
  payments: PaymentCardItem[];
}

export function PaymentCardsClient({
  payments: initialPayments,
}: PaymentCardsClientProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  const counts = useMemo(() => {
    let activePeriod = 0;
    let expiredPeriod = 0;
    let pendingCharge = 0;

    for (const p of payments) {
      const isPending = !p.paid_at || p.status === "pending";
      if (isPending) {
        pendingCharge++;
      }
      const validity = getPeriodValidityInfo(
        p.period_end,
        p.is_latest_for_client,
      );
      if (validity.state === "active" || validity.state === "expiring_soon") {
        activePeriod++;
      } else if (validity.state === "expired") {
        expiredPeriod++;
      }
    }

    return {
      all: payments.length,
      activePeriod,
      expiredPeriod,
      pendingCharge,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = search.trim().toLowerCase();
      const clientName = p.clients?.full_name?.toLowerCase() ?? "";
      const clientEmail = p.clients?.email?.toLowerCase() ?? "";
      const reference = p.reference?.toLowerCase() ?? "";
      const planName = p.plan_name?.toLowerCase() ?? "";
      const methodLabel = p.payment_method
        ? (
            PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method
          ).toLowerCase()
        : "";
      const matchesSearch =
        !q ||
        clientName.includes(q) ||
        clientEmail.includes(q) ||
        reference.includes(q) ||
        planName.includes(q) ||
        methodLabel.includes(q);
      if (!matchesSearch) return false;

      const isPending = !p.paid_at || p.status === "pending";
      const validity = getPeriodValidityInfo(
        p.period_end,
        p.is_latest_for_client,
      );

      if (statusFilter === "active") {
        return (
          !isPending &&
          (validity.state === "active" || validity.state === "expiring_soon")
        );
      }
      if (statusFilter === "expired") {
        return validity.state === "expired";
      }
      if (statusFilter === "pending") {
        return isPending;
      }
      return true;
    });
  }, [payments, search, statusFilter]);

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await markPaymentAsPaid(paymentId);
      const nowIso = new Date().toISOString();
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, paid_at: nowIso, status: "paid" } : p,
        ),
      );
      toast.success("Pago marcado como liquidado y vigencia actualizada");
    } catch {
      toast.error("No se pudo marcar el pago como pagado");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const result = await deletePayment(deleteId);
      if (result.success) {
        setPayments((prev) => prev.filter((p) => p.id !== deleteId));
        toast.success("Pago eliminado correctamente");
      } else {
        toast.error(result.error || "No se pudo eliminar el pago");
      }
    } catch {
      toast.error("No se pudo eliminar el pago. Intenta de nuevo.");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-10 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por asesorado, plan, referencia o método..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-card/60 border-border/50 backdrop-blur-xl shadow-sm focus-visible:ring-primary/20 text-sm transition-all hover:bg-card/80"
            />
          </div>
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-4 sm:inline-flex sm:w-auto bg-muted/50 p-1 h-11 rounded-xl border border-border/40 shadow-sm">
              <TabsTrigger
                value="all"
                className="rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm"
              >
                Todos ({counts.all})
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm"
              >
                Vigentes ({counts.activePeriod})
              </TabsTrigger>
              <TabsTrigger
                value="expired"
                className="rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm"
              >
                Vencidos ({counts.expiredPeriod})
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm"
              >
                Por cobrar ({counts.pendingCharge})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-card/40 py-12 text-center">
            <CreditCard className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No se encontraron pagos con los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPayments.map((payment) => {
              const clientName =
                payment.clients?.full_name || "Cliente desconocido";
              const initials = clientName
                .split(/\s+/)
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();
              const isPendingPayment =
                !payment.paid_at || payment.status === "pending";
              const methodLabel = payment.payment_method
                ? (PAYMENT_METHOD_LABELS[payment.payment_method] ??
                  payment.payment_method)
                : null;

              const validity = getPeriodValidityInfo(
                payment.period_end,
                payment.is_latest_for_client,
              );
              const needsRenewal =
                validity.state === "expired" ||
                validity.state === "expiring_soon";

              const menuSections: AdminCardMenuSection[] = [
                {
                  items: [
                    ...(isPendingPayment
                      ? [
                          {
                            label: "Marcar como pagado",
                            icon: <CheckCircle2 className="mr-2 size-4" />,
                            onClick: () => handleMarkAsPaid(payment.id),
                          },
                        ]
                      : []),
                    ...(payment.client_id
                      ? [
                          {
                            label: needsRenewal
                              ? "Renovar membresía"
                              : "Registrar nuevo pago",
                            icon: <RefreshCw className="mr-2 size-4" />,
                            href: `/admin/payments/new?clientId=${payment.client_id}`,
                          },
                          {
                            label: "Ver ficha del asesorado",
                            icon: <Eye className="mr-2 size-4" />,
                            href: `/admin/clients/${payment.client_id}`,
                          },
                        ]
                      : []),
                    {
                      label: "Editar cobro",
                      icon: <Edit2 className="mr-2 size-4" />,
                      href: `/admin/payments/${payment.id}/edit`,
                    },
                  ],
                },
                {
                  separatorBefore: true,
                  items: [
                    {
                      label: "Eliminar",
                      icon: <Trash2 className="mr-2 size-4" />,
                      onClick: () => setDeleteId(payment.id),
                      variant: "destructive" as const,
                    },
                  ],
                },
              ];

              return (
                <AdminCardWithActions
                  key={payment.id}
                  menuSections={menuSections}
                  className="h-full"
                  cardClassName={cn(
                    "flex h-full flex-col overflow-hidden rounded-[1.5rem] border bg-card/60 backdrop-blur-xl shadow-sm transition-all hover:shadow-md",
                    validity.state === "expired"
                      ? "border-destructive/30 hover:border-destructive/50"
                      : validity.state === "expiring_soon"
                        ? "border-warning/35 hover:border-warning/50"
                        : "border-border/50 hover:border-primary/20",
                  )}
                >
                  <AdminCardHeaderWithActions menuSections={menuSections}>
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10 rounded-full border border-border shadow-sm shrink-0 mt-0.5">
                        {payment.clients?.avatar_url && (
                          <AvatarImage
                            src={payment.clients.avatar_url}
                            alt={clientName}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {initials || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 pr-4 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold tracking-tight truncate text-foreground leading-tight">
                            {clientName}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
                          {payment.paid_at
                            ? `Cobrado el ${format(
                                parseLocalDate(payment.paid_at),
                                "d MMM yyyy",
                                {
                                  locale: es,
                                },
                              )}`
                            : "Cobro pendiente"}
                          {methodLabel && ` • ${methodLabel}`}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {payment.plan_name && (
                            <span className="text-[11px] font-bold text-primary">
                              {payment.plan_name}
                            </span>
                          )}
                          {validity.state !== "unknown" && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-md py-0 px-1.5",
                                validity.badgeClassName,
                              )}
                            >
                              {validity.state === "expired" ? (
                                <AlertCircle className="mr-1 size-2.5" />
                              ) : (
                                <CalendarClock className="mr-1 size-2.5" />
                              )}
                              {validity.label}
                            </Badge>
                          )}
                        </div>
                        {payment.period_start && payment.period_end && (
                          <p className="text-[11px] text-muted-foreground/80 truncate mt-1">
                            Periodo:{" "}
                            {format(
                              parseLocalDate(payment.period_start),
                              "d MMM",
                              {
                                locale: es,
                              },
                            )}{" "}
                            –{" "}
                            {format(
                              parseLocalDate(payment.period_end),
                              "d MMM yyyy",
                              { locale: es },
                            )}
                          </p>
                        )}
                        {payment.reference && (
                          <p className="text-[11px] text-muted-foreground/75 truncate mt-0.5 italic">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  </AdminCardHeaderWithActions>
                  <div className="mt-auto px-4 pb-4 flex flex-col gap-2">
                    <div className="flex flex-row items-center justify-between bg-muted/30 border border-border/50 rounded-xl p-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            !isPendingPayment
                              ? "border-success/30 bg-success/15 text-success text-[10px] uppercase font-bold tracking-wider rounded-md py-0.5 px-2"
                              : "border-warning/35 bg-warning/12 text-warning-foreground text-[10px] uppercase font-bold tracking-wider rounded-md py-0.5 px-2"
                          }
                        >
                          {!isPendingPayment ? "Cobro liquidado" : "Por cobrar"}
                        </Badge>
                      </div>
                      <div className="flex flex-row items-baseline gap-1.5">
                        <span className="text-base font-black tabular-nums tracking-tight text-foreground">
                          $
                          {(payment.amount ?? 0).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {needsRenewal && payment.client_id && (
                      <Button
                        asChild
                        size="sm"
                        variant={
                          validity.state === "expired" ? "default" : "secondary"
                        }
                        className="w-full h-9 rounded-xl text-xs font-bold"
                      >
                        <Link
                          href={`/admin/payments/new?clientId=${payment.client_id}`}
                        >
                          <RefreshCw className="mr-1.5 size-3.5" />
                          Renovar membresía de {clientName.split(" ")[0]}
                        </Link>
                      </Button>
                    )}
                  </div>
                </AdminCardWithActions>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro del pago será
              eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
