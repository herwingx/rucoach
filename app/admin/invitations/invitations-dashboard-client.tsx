"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { NewInvitationForm } from "./new-invitation-form";
import {
  InvitationCardsClient,
  type InvitationCodeItem,
} from "./invitation-cards-client";

interface InvitationsDashboardClientProps {
  initialCodes: InvitationCodeItem[];
}

export function InvitationsDashboardClient({
  initialCodes,
}: InvitationsDashboardClientProps) {
  const router = useRouter();
  const [codes, setCodes] = React.useState<InvitationCodeItem[]>(initialCodes);

  React.useEffect(() => {
    setCodes(initialCodes);
  }, [initialCodes]);

  const handleCodeCreated = (newCode: InvitationCodeItem) => {
    // Optimismo instantáneo (0ms): se añade al inicio de la lista
    setCodes((prev) => [newCode, ...prev.filter((c) => c.id !== newCode.id)]);
    // Revalidación server-side en background
    router.refresh();
  };

  const handleCodesChange = (updatedCodes: InvitationCodeItem[]) => {
    setCodes(updatedCodes);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Formulario de creación con selector claro de rol y banner inmediato de éxito */}
      <NewInvitationForm onCodeCreated={handleCodeCreated} />

      {/* Listado dinámico con filtros por rol (Todos, Clientes, Coaches) y buscador */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Códigos de Acceso ({codes.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Gestiona, comparte por WhatsApp o reactiva los códigos de invitación para tu gimnasio
            </p>
          </div>
        </div>

        <InvitationCardsClient
          codes={codes}
          onCodesChange={handleCodesChange}
        />
      </div>
    </div>
  );
}

