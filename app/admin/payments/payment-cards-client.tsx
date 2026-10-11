"use client";

import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle2, Eye, Edit2, Trash2, Search, CreditCard } from "lucide-react";
import { deletePayment, markPaymentAsPaid } from "@/app/actions/payments";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
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
  clients: { full_name: string; email?: string | null; avatar_url?: string | null } | null;
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

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = search.trim().toLowerCase();
      const clientName = p.clients?.full_name?.toLowerCase() ?? "";
      const clientEmail = p.clients?.email?.toLowerCase() ?? "";
      const reference = p.reference?.toLowerCase() ?? "";
      const planName = p.plan_name?.toLowerCase() ?? "";
      const methodLabel = p.payment_method
        ? (PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method).toLowerCase()
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
      if (statusFilter === "paid") return !isPending;
      if (statusFilter === "pending") return isPending;
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
            <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto bg-muted/50 p-1 h-11 rounded-xl border border-border/40 shadow-sm">
              <TabsTrigger value="all" className="rounded-lg px-3 py-1.5 text-xs sm:text-sm">
                Todos ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="rounded-lg px-3 py-1.5 text-xs sm:text-sm">
                Pagados ({payments.filter((p) => !!p.paid_at).length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-3 py-1.5 text-xs sm:text-sm">
                Pendientes ({payments.filter((p) => !p.paid_at).length})
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
                            label: "Ver ficha del asesorado",
                            icon: <Eye className="mr-2 size-4" />,
                            href: `/admin/clients/${payment.client_id}`,
                          },
                          {
                            label: "Registrar nuevo pago",
                            icon: <CreditCard className="mr-2 size-4" />,
                            href: `/admin/payments/new?clientId=${payment.client_id}`,
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
                  cardClassName="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/50 bg-card/60 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:border-primary/20"
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
                        <p className="text-sm font-bold tracking-tight truncate text-foreground leading-tight">
                          {clientName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
                          {payment.paid_at
                            ? `Cobrado el ${format(parseLocalDate(payment.paid_at), "d MMM yyyy", {
                                locale: es,
                              })}`
                            : "Cobro pendiente"}
                          {methodLabel && ` • ${methodLabel}`}
                        </p>
                        {payment.plan_name && (
                          <p className="text-[11px] font-semibold text-primary truncate mt-1">
                            {payment.plan_name}
                          </p>
                        )}
                        {payment.period_start && payment.period_end && (
                          <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                            Vigencia:{" "}
                            {format(parseLocalDate(payment.period_start), "d MMM", {
                              locale: es,
                            })}{" "}
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
                  <div className="mt-auto px-4 pb-4">
                    <div className="flex flex-row items-center justify-between bg-muted/30 border border-border/50 rounded-xl p-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={
                          !isPendingPayment
                            ? "border-success/30 bg-success/15 text-success text-[10px] uppercase font-bold tracking-wider rounded-md py-0.5 px-2"
                            : "border-warning/35 bg-warning/12 text-warning-foreground text-[10px] uppercase font-bold tracking-wider rounded-md py-0.5 px-2"
                        }
                      >
                        {!isPendingPayment ? "Pagado" : "Pendiente"}
                      </Badge>
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
