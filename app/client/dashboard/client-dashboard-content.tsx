"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { LevelProgress } from "@/components/client/level-progress";
import { ClientDashboardCards } from "@/components/client/client-dashboard-cards";
import { Skeleton } from "@/components/ui/skeleton";

const ClientWorkoutChart = dynamic(
  () =>
    import("@/components/client/client-workout-chart").then((m) => ({
      default: m.ClientWorkoutChart,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[220px] w-full rounded-3xl" />,
  },
);
import { NextWorkoutCard } from "@/components/client/next-workout-card";
import { AchievementBadge } from "@/components/client/achievement-badge";
import { Award, CalendarClock, ChevronRight, CreditCard } from "lucide-react";
import type {
  Profile,
  Routine,
  RoutineDay,
  LevelInfo,
  UserAchievement,
} from "@/lib/types";
import {
  ClientStackPageHeader,
  CLIENT_DATA_PAGE_SHELL,
} from "@/components/client/client-app-page-parts";

interface ClientDashboardContentProps {
  profile: Profile | null;
  levelInfo: LevelInfo;
  totalWorkouts: number;
  totalVolume: number;
  prsThisMonth: number;
  assignedRoutine: Routine | null;
  /** Mismo criterio que /client/workout/start (última sesión completada + orden day_number). */
  nextWorkoutRoutineDay: RoutineDay | null;
  isRoutineCompleted?: boolean;
  userAchievements: UserAchievement[];
  chartData: { date: string; sessions: number }[];
  membershipEnd?: string | null;
}

export function ClientDashboardContent({
  profile,
  levelInfo,
  totalWorkouts,
  totalVolume,
  prsThisMonth,
  assignedRoutine,
  nextWorkoutRoutineDay,
  isRoutineCompleted,
  userAchievements,
  chartData,
  membershipEnd,
}: ClientDashboardContentProps) {
  const userLabel =
    profile?.full_name?.split(/\s+/).filter(Boolean)[0] || "Asesorado";

  const daysUntilExpiry = (() => {
    if (!membershipEnd) return null;
    const endDay = membershipEnd.slice(0, 10);
    const endDate = new Date(`${endDay}T23:59:59`);
    if (Number.isNaN(endDate.getTime())) return null;
    return Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  })();

  const formattedExpiry = (() => {
    if (!membershipEnd) return null;
    const endDay = membershipEnd.slice(0, 10);
    const d = new Date(`${endDay}T12:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  })();

  return (
    <>
      <ClientStackPageHeader
        kicker={new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}
        title={`¿Listo para el reto, ${userLabel}?`}
        subtitle="Sigue tu plan, supera tus marcas y desbloquea el siguiente nivel."
        backHref={null}
      />
      <div className={`${CLIENT_DATA_PAGE_SHELL} grid gap-8 lg:grid-cols-12`}>
        {daysUntilExpiry !== null && daysUntilExpiry <= 5 && (
          <div className="lg:col-span-12">
            <Card className="overflow-hidden rounded-2xl border-warning/40 bg-warning/10 shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
                    <CalendarClock className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {daysUntilExpiry < 0
                        ? "Tu membresía ha vencido"
                        : daysUntilExpiry === 0
                          ? "Tu membresía vence hoy"
                          : `Tu membresía vence en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? "" : "s"}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formattedExpiry
                        ? `Fecha de corte: ${formattedExpiry}. Coordina tu renovación con tu coach para mantener acceso continuo.`
                        : "Coordina tu renovación con tu coach para mantener acceso continuo."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild variant="outline" size="sm" className="h-9 rounded-xl text-xs font-bold">
                    <Link href="/client/profile#membership">
                      <CreditCard className="mr-1.5 size-3.5" />
                      Ver mi membresía
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="h-9 rounded-xl text-xs font-bold">
                    <Link href="/client/messages">Contactar coach</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <aside className="flex flex-col gap-8 lg:col-span-12 xl:col-span-4 xl:sticky xl:top-[calc(112px+1.5rem)] xl:self-start">
          <LevelProgress
            levelInfo={levelInfo}
            username={profile?.username || profile?.full_name}
            avatarUrl={profile?.avatar_url}
          />
          <ClientDashboardCards
            streakDays={profile?.streak_days || 0}
            totalWorkouts={totalWorkouts}
            totalVolume={totalVolume}
            prsThisMonth={prsThisMonth}
          />
        </aside>

        <section className="flex min-w-0 flex-col gap-8 lg:col-span-12 xl:col-span-8">
          <ClientWorkoutChart data={chartData} />

          <NextWorkoutCard
            routineDay={nextWorkoutRoutineDay as any}
            routineName={assignedRoutine?.name}
            hasAssignedRoutine={!!assignedRoutine}
            isRoutineCompleted={isRoutineCompleted}
          />

          {userAchievements.length > 0 ? (
            <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                     <Award className="size-5 text-primary" aria-hidden />
                     <CardTitle className="text-lg font-black tracking-tight">Hitos Recientes</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-9 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all"
                  >
                    <Link
                      href="/client/achievements"
                      className="inline-flex items-center gap-1.5"
                    >
                      Muro de títulos
                      <ChevronRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-6">
                <div className="relative -mx-2 px-2 overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card/90 to-transparent z-10 pointer-events-none" />
                  <div className="flex gap-6 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {userAchievements.slice(0, 6).map((ua) => (
                      <div
                        key={ua.id}
                        className="group flex min-w-[84px] flex-col items-center gap-3"
                      >
                        <AchievementBadge
                          achievement={ua.achievements!}
                          unlocked
                          size="md"
                          className="transition-transform group-hover:scale-110 duration-300"
                        />
                        <span className="line-clamp-2 w-full text-center text-[10px] font-black uppercase tracking-tight text-foreground/80 group-hover:text-primary transition-colors">
                          {ua.achievements!.name}
                        </span>
                      </div>
                    ))}
                    {userAchievements.length > 6 && (
                      <Link
                        href="/client/achievements"
                        className="group flex min-w-[84px] flex-col items-center justify-center gap-3"
                      >
                        <div className="flex size-14 items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 transition-all group-hover:border-primary group-hover:bg-primary/10">
                          <span className="text-xs font-black text-primary tabular-nums">
                            +{userAchievements.length - 6}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">
                          Ver más
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </section>
      </div>
    </>
  );
}
