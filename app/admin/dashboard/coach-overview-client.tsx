"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminDashboardCards } from "@/components/admin/admin-dashboard-cards";
import { Skeleton } from "@/components/ui/skeleton";

const AdminWorkoutChart = dynamic(
  () =>
    import("@/components/admin/admin-workout-chart").then((m) => ({
      default: m.AdminWorkoutChart,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[220px] w-full rounded-xl" />,
  },
);
import {
  AdminCardWithActions,
  AdminCardHeaderWithActions,
  type AdminCardMenuSection,
} from "@/components/admin/admin-card-with-actions";
import {
  type CoachClientCard,
  type CoachOverviewMetrics,
} from "./coach-overview";
import {
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Eye,
  Edit2,
  Info,
  UserCheck,
  UserX,
  Sparkles,
  Trophy,
  Users,
  Clock,
  AlertCircle,
  Zap,
  Dumbbell,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { updateClientStatus } from "@/app/actions/clients";
import { restartClientRoutine } from "@/app/actions/routine-assignment";
import { toast } from "sonner";

function formatRelativeDays(days: number) {
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

function _MetricHint({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={label}
        >
          <Info className="size-3.5 opacity-70" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[min(100vw-1rem,17rem)] text-pretty"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

function scheduleScrollToElement(el: HTMLElement | null) {
  if (!el) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });
}

export function CoachOverviewClient({
  cards,
  metrics,
  planNames,
  routineNames,
}: {
  cards: CoachClientCard[];
  metrics: CoachOverviewMetrics;
  planNames: string[];
  routineNames: string[];
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [routineFilter, setRoutineFilter] = useState<string>("all");
  const [cardsState, setCardsState] = useState(cards);
  const clientsSectionRef = useRef<HTMLElement>(null);

  const scrollToClientsSection = useCallback(() => {
    scheduleScrollToElement(clientsSectionRef.current);
  }, []);

  useEffect(() => {
    setCardsState(cards);
  }, [cards]);

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    try {
      const result = await updateClientStatus(clientId, newStatus);
      if (result?.success) {
        setCardsState((prev) =>
          prev.map((c) =>
            c.id === clientId ? { ...c, status: newStatus } : c,
          ),
        );
        const label = newStatus === "active" ? "Activo" : "Suspendido";
        toast.success(`Asesorado marcado como «${label}».`);
      } else {
        toast.error(result?.error || "No pudimos cambiar el estado.");
      }
    } catch {
      toast.error("No pudimos cambiar el estado. Revisa tu conexión.");
    }
  };

  const handleRestartRoutine = async (
    clientRoutineId: string,
    fullName: string,
  ) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres reiniciar la rutina de ${fullName} a la Semana 1?`,
      )
    )
      return;

    try {
      const result = await restartClientRoutine(clientRoutineId);
      if (result?.success) {
        setCardsState((prev) =>
          prev.map((c) =>
            c.clientRoutineId === clientRoutineId
              ? {
                  ...c,
                  currentWeek: 1,
                  isRoutineCompleted: false,
                  attentionReason: null,
                  needsAttention: false,
                }
              : c,
          ),
        );
        toast.success(`Rutina de ${fullName} reiniciada a la Semana 1.`);
      } else {
        toast.error("No pudimos reiniciar la rutina.");
      }
    } catch {
      toast.error("Error al reiniciar la rutina.");
    }
  };

  const filteredCards = useMemo(() => {
    return cardsState
      .filter((c) => {
        if (activeTab === "activeWeek")
          return (
            c.status === "active" &&
            c.daysSinceLastSession != null &&
            c.daysSinceLastSession <= 6
          );
        if (activeTab === "inactive3")
          return (
            c.status === "active" &&
            (c.daysSinceLastSession == null || c.daysSinceLastSession >= 3)
          );
        if (activeTab === "attention") return c.needsAttention;
        if (activeTab === "all") return true;

        return true;
      })
      .filter((c) => {
        if (planFilter === "all") return true;
        return (c.planName || "") === planFilter;
      })
      .filter((c) => {
        if (routineFilter === "all") return true;
        return (c.assignedRoutineName || "") === routineFilter;
      });
  }, [cardsState, activeTab, planFilter, routineFilter]);

  return (
    <div className="flex flex-1 flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-4" aria-label="Resumen y actividad">
        {metrics.attentionCount > 0 ? (
          <Alert
            variant="default"
            className="border-warning/35 bg-warning/10 text-foreground [&>svg]:text-warning"
          >
            <AlertTriangle className="size-4" aria-hidden />
            <AlertTitle className="text-sm font-semibold text-foreground sm:text-base">
              Hay {metrics.attentionCount} asesorado
              {metrics.attentionCount !== 1 ? "s" : ""} que priorizar
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-3 text-xs text-muted-foreground sm:text-sm">
              <span className="text-pretty leading-relaxed">
                Incluye planes vencidos, sin rutina o sin entrenar varios días.
                Usa el filtro &quot;Atención&quot; para ver la lista completa.
              </span>
              <Button
                type="button"
                size="sm"
                variant="default"
                className="w-full shadow-sm sm:w-fit"
                onClick={() => {
                  setActiveTab("attention");
                  scrollToClientsSection();
                }}
              >
                Ver solo atención
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <AdminDashboardCards
          totalTrainingsThisWeek={metrics.totalTrainingsThisWeek}
          prsThisMonth={metrics.prsThisMonth}
          prsLastMonth={metrics.prsLastMonth}
          mostActiveClientId={metrics.mostActiveClientId}
          mostActiveClientName={metrics.mostActiveClientName}
          attentionClientId={metrics.attentionClientId}
          attentionClientName={metrics.attentionClientName}
          attentionReason={metrics.attentionReason}
          trainingsLastWeek={metrics.trainingsLastWeek}
          totalClients={metrics.totalClients}
          activeThisWeekCount={metrics.activeThisWeekCount}
          attentionCount={metrics.attentionCount}
        />

        <AdminWorkoutChart data={metrics.chartData} />
      </section>

      <section
        ref={clientsSectionRef}
        className="flex scroll-mt-24 flex-col gap-4 sm:scroll-mt-28"
        aria-label="Listado de asesorados"
        tabIndex={-1}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Tus asesorados
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Filtra por comportamiento real: activos esta semana, baja actividad
            o casos que necesitan prioridad.
          </p>
        </div>

        <Card className="py-0 gap-0 rounded-2xl border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-bold tracking-tight text-foreground">
                Filtros
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Puedes combinar pestañas con plan y rutina.
              </CardDescription>
            </div>
            <div className="w-full sm:w-auto">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v);
                  if (v === "attention") scrollToClientsSection();
                }}
                className="hidden sm:block"
              >
                <TabsList className="inline-flex w-auto bg-card/60 backdrop-blur-xl p-1 h-12 rounded-[1rem] border border-border/50 shadow-sm">
                  <TabsTrigger
                    value="all"
                    className="rounded-lg px-3.5 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-bold transition-all gap-2 text-[14px] font-medium"
                  >
                    <Users className="size-4" />
                    Todos
                  </TabsTrigger>
                  <TabsTrigger
                    value="activeWeek"
                    className="rounded-lg px-3.5 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-bold transition-all gap-2 text-[14px] font-medium"
                  >
                    <Zap className="size-4" />
                    Activos 7d
                  </TabsTrigger>
                  <TabsTrigger
                    value="inactive3"
                    className="rounded-lg px-3.5 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-bold transition-all gap-2 text-[14px] font-medium"
                  >
                    <Clock className="size-4" />
                    Baja actividad
                  </TabsTrigger>
                  <TabsTrigger
                    value="attention"
                    className="rounded-lg px-3.5 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-bold transition-all gap-2 text-[14px] font-medium"
                  >
                    <AlertCircle className="size-4" />
                    Atención
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="block sm:hidden w-full mt-2">
                <Select
                  value={activeTab}
                  onValueChange={(v) => {
                    setActiveTab(v);
                    if (v === "attention") scrollToClientsSection();
                  }}
                >
                  <SelectTrigger className="h-12 w-full bg-card/60 backdrop-blur-xl border-border/50 shadow-sm rounded-[1rem] px-4 font-bold text-[15px] text-foreground hover:bg-card/80 transition-all" aria-label="Seleccionar vista">
                    <SelectValue placeholder="Vista" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectGroup>
                      <SelectLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">Actividad</SelectLabel>
                      <SelectItem value="all" className="rounded-lg py-2.5">
                        <div className="flex items-center gap-2">
                          <Users className="size-4" />
                          <span>Todos los asesorados</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="activeWeek" className="rounded-lg py-2.5">
                        <div className="flex items-center gap-2">
                          <Zap className="size-4" />
                          <span>Activos (7 días)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive3" className="rounded-lg py-2.5">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4" />
                          <span>Baja actividad (3+ días)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="attention" className="rounded-lg py-2.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="size-4" />
                          <span>Requieren atención</span>
                        </div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger
                  className="h-12 w-full sm:w-[200px] bg-card/60 backdrop-blur-xl border-border/50 shadow-sm rounded-[1rem] px-4 font-medium text-[14px] transition-all hover:bg-card/80"
                  aria-label="Filtrar por plan"
                >
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent className="rounded-[1rem]">
                  <SelectGroup>
                    <SelectLabel>Plan</SelectLabel>
                    <SelectItem value="all">Todos los planes</SelectItem>
                    {planNames.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select value={routineFilter} onValueChange={setRoutineFilter}>
                <SelectTrigger
                  className="h-12 w-full sm:w-[200px] bg-card/60 backdrop-blur-xl border-border/50 shadow-sm rounded-[1rem] px-4 font-medium text-[14px] transition-all hover:bg-card/80"
                  aria-label="Filtrar por rutina"
                >
                  <SelectValue placeholder="Rutina" />
                </SelectTrigger>
                <SelectContent className="rounded-[1rem]">
                  <SelectGroup>
                    <SelectLabel>Rutina</SelectLabel>
                    <SelectItem value="all">Todas las rutinas</SelectItem>
                    {routineNames.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-12 w-full sm:w-auto rounded-[1rem] border-border/50 bg-card/60 backdrop-blur-xl shadow-sm text-[14px] px-6 transition-all hover:-translate-y-0.5"
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setPlanFilter("all");
                  setRoutineFilter("all");
                }}
              >
                Restablecer filtros
              </Button>
            </div>

            <p className="text-sm font-medium tabular-nums text-muted-foreground">
              {filteredCards.length} resultado
              {filteredCards.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map((c) => {
            const menuSections: AdminCardMenuSection[] = [
              {
                items: [
                  {
                    label: "Ver perfil",
                    icon: <Eye className="mr-2 size-4" />,
                    href: `/admin/clients/${c.id}`,
                  },
                  {
                    label: "Editar",
                    icon: <Edit2 className="mr-2 size-4" />,
                    href: `/admin/clients/${c.id}/edit`,
                  },
                ],
              },
              ...(c.isRoutineCompleted && c.clientRoutineId
                ? [
                    {
                      separatorBefore: true as const,
                      items: [
                        {
                          label: "Reiniciar rutina (W1)",
                          icon: <Sparkles className="mr-2 size-4" />,
                          onClick: () =>
                            handleRestartRoutine(
                              c.clientRoutineId!,
                              c.fullName,
                            ),
                          className: "text-primary focus:text-primary",
                        },
                      ],
                    },
                  ]
                : []),
              ...(c.status === "active" || c.status === "suspended"
                ? [
                    {
                      separatorBefore: true as const,
                      items: [
                        c.status === "active"
                          ? {
                              label: "Suspender",
                              icon: <UserX className="mr-2 size-4" />,
                              onClick: () =>
                                handleStatusChange(c.id, "suspended"),
                              className: "text-warning focus:text-warning",
                            }
                          : {
                              label: "Activar",
                              icon: <UserCheck className="mr-2 size-4" />,
                              onClick: () => handleStatusChange(c.id, "active"),
                              className: "text-success focus:text-success",
                            },
                      ],
                    },
                  ]
                : []),
            ];

            return (
              <AdminCardWithActions
                key={c.id}
                menuSections={menuSections}
                cardClassName={cn(
                  "border-border/50 bg-card/60 rounded-[1.5rem] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-primary/20 group pb-1 flex flex-col h-full",
                  c.needsAttention &&
                    "border-warning/30 border-l-[4px] border-l-warning bg-gradient-to-br from-warning/10 via-warning/5 to-transparent hover:border-warning/50"
                )}
              >
                <AdminCardHeaderWithActions menuSections={menuSections}>
                  <div className="flex items-center gap-3.5">
                    <Avatar className="size-[3.25rem] rounded-[1.1rem] border-2 border-background shadow-xs shrink-0 transition-transform group-hover:scale-105">
                      {c.avatarUrl ? (
                        <AvatarImage
                          src={c.avatarUrl}
                          alt={c.fullName}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                        {c.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="text-[17px] font-bold truncate leading-none mb-1 group-hover:text-primary transition-colors">
                        {c.fullName}
                      </CardTitle>
                      <div className="text-[13px] font-medium opacity-80 text-muted-foreground truncate">
                        {c.planName ? `Plan: ${c.planName}` : "Sin plan"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-4 ml-1">
                    {c.isRoutineCompleted ? (
                      <Badge
                        variant="secondary"
                        className="font-bold text-[10px] bg-success/20 text-success shadow-sm uppercase tracking-widest px-2.5 py-0.5 gap-1 border-success/30"
                        title="Rutina completada"
                      >
                        <Trophy className="size-3" aria-hidden />
                        Completada
                      </Badge>
                    ) : c.needsAttention ? (
                      <Badge
                        variant="secondary"
                        className="font-bold text-[10px] bg-warning/20 text-warning-foreground shadow-sm uppercase tracking-widest px-2.5 py-0.5 gap-1 border-warning/30"
                        title={c.attentionReason || "Atención"}
                      >
                        <AlertTriangle className="size-3" aria-hidden />
                        {c.attentionReason || "Atención"}
                      </Badge>
                    ) : c.streakDays != null && c.streakDays > 0 ? (
                      <Badge
                        variant="secondary"
                        className="font-bold text-[10px] bg-primary/20 text-primary shadow-sm uppercase tracking-widest px-2.5 py-0.5"
                      >
                        {c.streakDays}d racha
                      </Badge>
                    ) : null}
                  </div>
                </AdminCardHeaderWithActions>
                
                <CardContent className="flex flex-col gap-2.5 pt-1 px-4.5 pb-4 flex-1 justify-end bg-gradient-to-b from-transparent to-background/30">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1.5 rounded-[1rem] border border-border/40 bg-background/50 p-3 shadow-sm transition-colors hover:bg-background/80">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-80">
                        <Clock className="size-3.5" />
                        Última sesión
                      </div>
                      <span className="text-[14px] font-bold tabular-nums text-foreground">
                       {c.daysSinceLastSession != null
                          ? formatRelativeDays(c.daysSinceLastSession)
                          : "Nunca"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 rounded-[1rem] border border-border/40 bg-background/50 p-3 shadow-sm transition-colors hover:bg-background/80">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-80">
                         <Zap className="size-3.5" />
                         Meta Sem/7d
                      </div>
                      <span className="text-[14px] font-bold tabular-nums text-foreground">
                        {c.compliance7dPct != null ? (
                          <>
                            {Math.round(c.compliance7dPct * 100)}%
                            {c.complianceSessionsDone7d != null &&
                            c.complianceSessionsTarget != null ? (
                              <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                                ({c.complianceSessionsDone7d}/{c.complianceSessionsTarget})
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "Sin meta"
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 rounded-[1rem] border border-border/40 bg-background/50 p-3 shadow-sm transition-colors hover:bg-background/80">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-80">
                        <Sparkles className="size-3.5" />
                        Volumen
                      </div>
                      <span className="flex min-w-0 items-center justify-start gap-1 text-[14px] font-bold">
                        {c.trend === "up" ? (
                          <span className="flex items-center gap-0.5 text-primary">
                            <ArrowUp className="size-3.5" aria-hidden />
                            Sube
                          </span>
                        ) : c.trend === "down" ? (
                          <span className="flex items-center gap-0.5 text-destructive">
                            <ArrowDown className="size-3.5" aria-hidden />
                            Baja
                          </span>
                        ) : (
                          <span className="text-foreground/70">Igual</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 rounded-[1rem] border border-border/40 bg-background/50 p-3 shadow-sm transition-colors hover:bg-background/80">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-80">
                        <Dumbbell className="size-3.5" />
                        Series PR (30d)
                      </div>
                      <span className="text-[14px] font-bold tabular-nums text-foreground">
                        {typeof c.prEvents30d === "number" ? c.prEvents30d : "0"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2 rounded-[1rem] border border-border/40 bg-background/50 px-4 py-2.5 shadow-sm">
                    <span className="text-[11px] text-muted-foreground font-black tracking-widest uppercase opacity-80">Rutina</span>
                    <span className="max-w-[70%] truncate text-right text-[13px] font-bold text-foreground">
                      {c.assignedRoutineName ? (
                        c.assignedRoutineName
                      ) : (
                        <span className="text-muted-foreground">Sin asignar</span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </AdminCardWithActions>
            );
          })}
        </div>
      </section>
    </div>
  );
}
