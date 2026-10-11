"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Power, Trash2, MoreVertical, Mail, Calendar, Key, UserPlus } from "lucide-react";
import {
  deactivateInvitationCode,
  deleteInvitationCode,
} from "@/app/actions/invitations";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";

export type InvitationCodeItem = {
  id: string;
  code: string;
  email: string | null;
  for_role: string;
  expires_at: string | null;
  times_used: number;
  max_uses: number;
  is_active: boolean;
};

interface InvitationCardsClientProps {
  codes: InvitationCodeItem[];
}

export function InvitationCardsClient({
  codes: initialCodes,
}: InvitationCardsClientProps) {
  const [codes, setCodes] = useState(initialCodes);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCodes(initialCodes);
  }, [initialCodes]);

  const handleCopy = (code: string) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/sign-up?code=${code}`
        : "";
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Enlace copiado.");
      })
      .catch(() => {
        toast.error("No pudimos copiar el enlace.");
      });
  };

  const handleDeactivate = async (codeId: string) => {
    const result = await deactivateInvitationCode(codeId);
    if (result && "success" in result && result.success) {
      setCodes((prev) =>
        prev.map((c) => (c.id === codeId ? { ...c, is_active: false } : c)),
      );
      toast.success("Código desactivado");
    } else {
      toast.error(
        result && "error" in result ? String(result.error) : "Error al desactivar",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    const result = await deleteInvitationCode(deleteId);
    if (result && "success" in result && result.success) {
      setCodes((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Código eliminado de tu historial");
      setDeleteId(null);
    } else {
      toast.error(
        result && "error" in result ? String(result.error) : "Error al eliminar",
      );
    }
    setIsDeleting(false);
  };

  const activeCodes = codes.filter((c) => {
    const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
    const isUsed = c.times_used >= c.max_uses;
    return c.is_active && !isExpired && !isUsed;
  });

  const inactiveCodes = codes.filter((c) => {
    const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
    const isUsed = c.times_used >= c.max_uses;
    return !c.is_active || isExpired || isUsed;
  });

  const renderCodeList = (list: InvitationCodeItem[]) => {
    if (list.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        {list.map((code) => {
          const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
          const isUsed = code.times_used >= code.max_uses;
          const isInactive = !code.is_active;
          const canDeactivate = !isInactive && !isUsed;
          
          // Allow deletion except if the user specifically blocked it.
          // Now that we allowed deleting used codes or inactive codes from the server,
          // we can just enable the delete button constantly for any code.
          const canDelete = isInactive || isUsed || canDeactivate; 

          return (
            <div
              key={code.id}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all hover:bg-muted/30 ${
                isInactive || isExpired || isUsed ? "opacity-75 bg-muted/10" : "bg-card shadow-sm border-border/50 hover:shadow-md hover:border-primary/20"
              }`}
            >
              {/* Left Details */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 overflow-hidden">
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-primary" />
                    <code className="text-xl font-mono font-black text-primary tracking-widest uppercase">
                      {code.code}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isUsed ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] uppercase">
                        Usado
                      </Badge>
                    ) : isExpired ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase">
                        Expirado
                      </Badge>
                    ) : isInactive ? (
                      <Badge variant="outline" className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20 text-[10px] uppercase">
                        Inactivo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase">
                        Activo
                      </Badge>
                    )}
                    
                    {code.for_role === "admin" ? (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5 text-[10px] uppercase">
                        Coach
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal text-[10px] uppercase bg-secondary/50">
                        Cliente
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Metadata Column */}
                <div className="flex flex-col gap-1.5 sm:ml-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-foreground font-medium truncate">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <span className="truncate">{code.email || "Cualquier persona"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 opacity-70" />
                    <span>
                      {code.expires_at
                        ? `Expira: ${format(new Date(code.expires_at), "d MMM yyyy", { locale: es })}`
                        : "Sin fecha de expiración"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Right */}
              <div className="flex items-center gap-2 sm:ml-auto border-t sm:border-0 pt-3 sm:pt-0 border-border/50 justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                  {canDeactivate && (
                    <Button variant="secondary" size="sm" onClick={() => handleCopy(code.code)} className="h-9 px-3 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                      <Copy className="size-3.5 mr-1.5" /> Copiar
                    </Button>
                  )}
                  {isUsed && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 px-2 bg-muted rounded-full py-1">
                      <UserPlus className="size-3" /> Reclamado
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Más opciones" className="size-9 rounded-full sm:rounded-lg">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {canDeactivate && (
                      <DropdownMenuItem onClick={() => handleDeactivate(code.id)} className="gap-2 cursor-pointer font-medium">
                        <Power className="size-4 text-muted-foreground" />
                        Desactivar
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => setDeleteId(code.id)}
                        className="text-destructive gap-2 focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium"
                      >
                        <Trash2 className="size-4" />
                        Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-10">
        <section>
          {activeCodes.length === 0 && inactiveCodes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border/50 flex flex-col items-center gap-4 bg-muted/10">
              <Key className="size-10 text-muted-foreground/30" />
              <div className="space-y-1">
                <p className="font-semibold">Nuevos horizontes</p>
                <p className="text-sm text-muted-foreground max-w-sm">No has generado ningún código de invitación para tus atletas todavía.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCodes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-primary flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
                    </span>
                    Códigos Activos ({activeCodes.length})
                  </h3>
                  {renderCodeList(activeCodes)}
                </div>
              )}
            </div>
          )}
        </section>

        {inactiveCodes.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-border/30">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Historial de Códigos ({inactiveCodes.length})
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Los códigos vencidos, usados o inactivos aparecerán aquí. Ahora puedes eliminarlos para limpiar tu lista sin afectar a los usuarios registrados.
            </p>
            {renderCodeList(inactiveCodes)}
          </section>
        )}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar código permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará el código de tu lista de administración por completo. No te preocupes, si este código ya fue usado por un cliente, su cuenta no se verá afectada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">
              Conservar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive rounded-xl text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              {isDeleting ? "Eliminando..." : "Eliminar Código"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
