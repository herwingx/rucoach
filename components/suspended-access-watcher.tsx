"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SuspendedAccessWatcherProps {
  userId?: string | null;
}

function isMembershipActive(
  status?: string | null,
  membershipEnd?: string | null,
): boolean {
  if (status !== "active") return false;
  if (!membershipEnd) return true;
  const endDay = membershipEnd.slice(0, 10);
  const endDate = new Date(`${endDay}T23:59:59`);
  if (Number.isNaN(endDate.getTime())) return true;
  return endDate >= new Date();
}

export function SuspendedAccessWatcher({ userId }: SuspendedAccessWatcherProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const verifyAccess = useCallback(
    async (manual = false) => {
      if (!userId) {
        if (manual) {
          router.replace("/client/dashboard");
          router.refresh();
        }
        return;
      }

      if (manual) setChecking(true);
      try {
        const supabase = createClient();
        const { data: clientRow } = await supabase
          .from("clients")
          .select("status, membership_end")
          .eq("user_id", userId)
          .maybeSingle();

        if (
          clientRow &&
          isMembershipActive(clientRow.status, clientRow.membership_end)
        ) {
          toast.success("¡Pago confirmado! Bienvenido a tu panel de entrenamiento.");
          router.replace("/client/dashboard");
          router.refresh();
          return;
        }

        if (manual) {
          toast.info(
            "Tu cuenta aún sigue pendiente de activación. Si ya realizaste tu pago, avísale a tu coach por WhatsApp.",
          );
        }
      } catch {
        if (manual) {
          router.replace("/client/dashboard");
          router.refresh();
        }
      } finally {
        if (manual) setChecking(false);
      }
    },
    [userId, router],
  );

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Verificar al montar y al volver a enfocar la pestaña / app
    void verifyAccess(false);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void verifyAccess(false);
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    // Escuchar en tiempo real cambios en clients, profiles o notificaciones de pago
    const channel = supabase
      .channel(`suspended-watch:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "clients",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as {
            status?: string | null;
            membership_end?: string | null;
          };
          if (isMembershipActive(updated.status, updated.membership_end)) {
            toast.success("¡Pago confirmado! Activando tu panel de entrenamiento...");
            router.replace("/client/dashboard");
            router.refresh();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void verifyAccess(false);
        },
      )
      .subscribe();

    // Sondeo ligero de respaldo cada 6 segundos mientras está en esta pantalla
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void verifyAccess(false);
      }
    }, 6000);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.clearInterval(intervalId);
      void supabase.removeChannel(channel);
    };
  }, [userId, router, verifyAccess]);

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={checking}
      onClick={() => void verifyAccess(true)}
      className="w-full gap-2 h-11 text-xs sm:text-sm font-semibold rounded-xl"
    >
      <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
      {checking ? "Verificando activación..." : "Ya realicé mi pago · Verificar acceso"}
    </Button>
  );
}

