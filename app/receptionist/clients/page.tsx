import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Users, Mail, Phone, Calendar } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Activo",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  expired: {
    label: "Expirado",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  paused: {
    label: "Pausado",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  inactive: {
    label: "Inactivo",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export default async function ReceptionistClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user, role } = await getAuthData();

  if (!user || (role !== "receptionist" && role !== "admin")) {
    redirect("/auth/login");
  }

  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const supabase = await createClient();
  const { data: rawClients } = await supabase
    .from("clients")
    .select(
      `
      id,
      full_name,
      email,
      phone,
      status,
      membership_start,
      membership_end,
      membership_plans (
        name
      )
    `,
    )
    .order("full_name", { ascending: true });

  const allClients = rawClients ?? [];
  const filteredClients = query
    ? allClients.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query),
      )
    : allClients;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Directorio de Clientes
        </h1>
        <p className="text-sm text-muted-foreground">
          {filteredClients.length} de {allClients.length} atletas registrados
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Search className="size-4 text-primary" />
            Buscar Atleta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, correo o teléfono..."
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit">Buscar</Button>
              {q && (
                <Button variant="outline" asChild>
                  <Link href="/receptionist/clients">Limpiar</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-foreground">
              No se encontraron clientes
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {q
                ? `No hay coincidencias para "${q}".`
                : "Aún no hay atletas registrados en el sistema."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const planObj = Array.isArray(client.membership_plans)
              ? client.membership_plans[0]
              : client.membership_plans;
            const statusInfo =
              STATUS_CONFIG[client.status ?? "inactive"] ??
              STATUS_CONFIG.inactive;

            return (
              <Card
                key={client.id}
                className="border-border/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-base truncate">
                        {client.full_name}
                      </p>
                      <p className="text-xs font-medium text-primary mt-0.5">
                        {planObj?.name ?? "Sin plan asignado"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusInfo.className}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
                    {client.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="size-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 shrink-0 text-muted-foreground/70" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
                      <span>
                        Vence:{" "}
                        {client.membership_end
                          ? new Date(
                              `${client.membership_end.slice(0, 10)}T12:00:00`,
                            ).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Sin fecha"}
                      </span>
                    </div>
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

