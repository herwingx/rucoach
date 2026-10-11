import { getAuthUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Flame,
  Info,
  Medal,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { AchievementBadge } from "@/components/client/achievement-badge";
import { AchievementsCatalog } from "@/components/client/achievements-catalog";
import { getLevelName, calculateLevel } from "@/lib/types";
import {
  getUserAchievements,
  resolveClientTotalSessions,
} from "@/lib/gamification";
import {
  achievementActionMeta,
  achievementCategoryLabel,
  formatAchievementProgress,
} from "@/lib/achievements-ui";
import { cn } from "@/lib/utils";
import {
  CLIENT_DATA_PAGE_SHELL,
  ClientStackPageHeader,
} from "@/components/client/client-app-page-parts";

export default async function ClientAchievementsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const [
    { data: profile },
    { unlocked: userAchievements, locked: lockedAchievements, progress },
    totalSessions,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp_points, level, full_name, avatar_url, streak_days")
      .eq("id", user.id)
      .single(),
    getUserAchievements(user.id),
    resolveClientTotalSessions(user.id),
  ]);

  const levelInfo = calculateLevel(profile?.xp_points || 0);
  const levelName = getLevelName(levelInfo.level);

  const uaAchievements = userAchievements
    .map((ua) => ua.achievements)
    .filter(Boolean) as NonNullable<
    (typeof userAchievements)[number]["achievements"]
  >[];

  const unlockedAchievementIds = new Set(uaAchievements.map((a) => a.id));
  const allAchievements = [
    ...uaAchievements,
    ...lockedAchievements.filter((a) => !unlockedAchievementIds.has(a.id)),
  ];

  const unlockedCount = userAchievements.length;
  const totalCount = allAchievements.length;
  const unlockedPercentage =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const { data: leaderboardData, error: leaderboardError } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(8);

  const leaderboard = leaderboardError ? [] : (leaderboardData ?? []);

  const recentlyUnlocked = [...userAchievements]
    .sort(
      (a, b) =>
        new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime(),
    )
    .slice(0, 3);

  const streakDays = profile?.streak_days ?? 0;
  const progressById = Object.fromEntries(progress);

  // Top 3 locked achievements closest to completion
  const nextUpAchievements = lockedAchievements
    .filter((a) => !unlockedAchievementIds.has(a.id))
    .map((a) => {
      const current = progressById[a.id] ?? 0;
      const { line, percent } = formatAchievementProgress(a, current, false);
      const action = achievementActionMeta(a);
      return { achievement: a, current, line, percent, action };
    })
    .sort((a, b) => {
      if (b.percent !== a.percent) return b.percent - a.percent;
      return (a.achievement.xp_reward || 0) - (b.achievement.xp_reward || 0);
    })
    .slice(0, 3);

  const achievementsSubtitle = `${unlockedCount} de ${totalCount} hitos · ${totalSessions} sesiones · ${streakDays} días de racha`;

  return (
    <>
      <ClientStackPageHeader
        title="Progreso y reconocimientos"
        subtitle={achievementsSubtitle}
      />
      <div className={`${CLIENT_DATA_PAGE_SHELL} flex flex-col gap-8`}>
        <section aria-label="Resumen de progreso" className="flex flex-col gap-6">
          {/* XP Hub Header Card */}
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background relative">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Medal className="size-32 text-primary animate-float" />
             </div>
             
             <CardHeader className="pb-6 pt-8 px-5 sm:pb-8 sm:pt-10 sm:px-8">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Rango del Atleta</span>
                    </div>
                    <CardTitle className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">
                      Nivel {levelInfo.level}
                    </CardTitle>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none">
                      {levelName}
                    </p>
                 </div>
                 <div className="flex flex-col items-start sm:items-end gap-1">
                   <Badge variant="secondary" className="font-black text-xs px-3 py-1.5 bg-primary text-primary-foreground border-none rounded-xl shadow-sm">
                     {levelInfo.currentXP.toLocaleString()} XP
                   </Badge>
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Acumulado Total</span>
                 </div>
               </div>
             </CardHeader>
             
             <CardContent className="px-5 pb-8 sm:px-8 sm:pb-10">
               <div className="flex flex-col gap-6">
                 {/* Thick Stylized Progress Bar */}
                 <div className="space-y-4 relative">
                   <div className="flex items-end justify-between gap-4 h-5 px-1 font-black text-[10px] uppercase tracking-widest">
                     <span className="text-primary/80">Nivel {levelInfo.level}</span>
                     <span className="text-muted-foreground/60">Nivel {levelInfo.level + 1}</span>
                   </div>
                   <div className="relative h-6 w-full bg-muted/20 rounded-full overflow-hidden border border-muted/30 p-1">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-md shadow-primary/30"
                        style={{ width: `${Math.max(4, levelInfo.progress)}%` }}
                      >
                         <div className="size-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.28)_50%,transparent_100%)] animate-shimmer" />
                      </div>
                   </div>
                   <div className="flex flex-wrap items-center justify-between gap-2 px-2">
                     <p className="text-[11px] font-bold text-muted-foreground">
                       <span className="text-foreground font-black tabular-nums">{levelInfo.currentXP}</span> / {levelInfo.xpForNextLevel} XP
                     </p>
                     <p className="text-[11px] font-medium text-muted-foreground italic">
                       Faltan <span className="text-primary font-black tabular-nums">{(levelInfo.xpForNextLevel - levelInfo.currentXP).toLocaleString()} XP</span> para Nivel {levelInfo.level + 1}
                     </p>
                   </div>
                 </div>

                 {/* High Density Stats Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div className="group flex flex-col gap-4 rounded-3xl border border-border/50 p-6 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:-translate-y-0.5 hover:shadow-md">
                       <div className="flex items-center justify-between">
                         <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 text-primary group-hover:scale-110 transition-transform">
                           <Trophy className="size-5" />
                         </div>
                         <Badge variant="outline" className="text-[10px] font-bold tabular-nums border-border/60">
                           {unlockedCount}/{totalCount}
                         </Badge>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-3xl font-black tabular-nums tracking-tighter">{unlockedPercentage}%</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Hitos Completados</span>
                       </div>
                    </div>

                    <div className="group flex flex-col gap-4 rounded-3xl border border-border/50 p-6 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:-translate-y-0.5 hover:shadow-md">
                       <div className="flex items-center justify-between">
                         <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 text-primary group-hover:scale-110 transition-transform">
                           <CalendarDays className="size-5" />
                         </div>
                         <Badge variant="outline" className="text-[10px] font-bold border-border/60">
                           +50 XP / sesión
                         </Badge>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-3xl font-black tabular-nums tracking-tighter">{totalSessions}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Sesiones Completadas</span>
                       </div>
                    </div>

                    <div className="group flex flex-col gap-4 rounded-3xl border border-border/50 p-6 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:-translate-y-0.5 hover:shadow-md">
                       <div className="flex items-center justify-between">
                         <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 text-primary group-hover:scale-110 transition-transform">
                           <Flame className="size-5" />
                         </div>
                         <Badge variant="outline" className="text-[10px] font-bold border-border/60">
                           Constancia
                         </Badge>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-3xl font-black tabular-nums tracking-tighter">{streakDays}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Días de Racha</span>
                       </div>
                    </div>
                 </div>
               </div>
             </CardContent>
          </Card>
        </section>

        {nextUpAchievements.length > 0 && (
          <section className="flex flex-col gap-5" aria-label="Próximos retos a desbloquear">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Zap className="size-5 text-primary" aria-hidden />
                  En Puerta · Próximos a Desbloquear
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 leading-none">
                  Tus 3 objetivos más cercanos para subir de nivel
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {nextUpAchievements.map(({ achievement, line, percent, action }) => (
                <Card
                  key={achievement.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-border/80 bg-card/60 shadow-sm ring-1 ring-primary/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-50" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <AchievementBadge
                        achievement={achievement}
                        unlocked={false}
                        size="md"
                      />
                      <Badge className="bg-primary/15 text-primary border border-primary/25 font-black text-[10px] tabular-nums">
                        <Sparkles className="mr-1 size-3" />+{achievement.xp_reward} XP
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {achievementCategoryLabel(achievement.category)}
                      </span>
                      <CardTitle className="mt-0.5 text-base font-black leading-snug tracking-tight group-hover:text-primary transition-colors">
                        {achievement.name}
                      </CardTitle>
                      {achievement.description && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {achievement.description}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3.5 pt-0">
                    <div className="flex flex-col gap-1.5 rounded-2xl border border-border/50 bg-muted/20 p-3">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-muted-foreground truncate pr-2">{line}</span>
                        <span className="tabular-nums font-black text-primary shrink-0">{percent}%</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                          style={{ width: `${Math.max(5, percent)}%` }}
                        >
                          <div className="size-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.35)_50%,transparent_100%)] animate-shimmer" />
                        </div>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="w-full justify-between rounded-xl font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      <Link href={action.href}>
                        <span>{action.label}</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {recentlyUnlocked.length > 0 && (
          <section className="flex flex-col gap-6" aria-label="Últimos hitos">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Target className="size-5 text-primary" aria-hidden />
                Muro de Títulos
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">
                Tus reconocimientos desbloqueados más recientes
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {recentlyUnlocked.map((ua) => (
                <Card
                  key={ua.id}
                  className="group border-border/80 shadow-md ring-1 ring-primary/10 rounded-3xl overflow-hidden bg-card/60 transition-all duration-300 hover:bg-card hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardContent className="flex flex-col items-center gap-5 p-7 text-center bg-gradient-to-t from-primary/[0.06] to-transparent">
                    <div className="relative">
                      <AchievementBadge
                        achievement={ua.achievements!}
                        unlocked
                        size="xl"
                        showMilestoneBadge
                        className="relative z-10"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] font-black text-primary bg-primary/10 border-primary/20">
                        +{ua.achievements!.xp_reward} XP ganados
                      </Badge>
                      <p className="text-base font-black leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors mt-1">
                        {ua.achievements!.name}
                      </p>
                      {ua.achievements!.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[220px]">
                          {ua.achievements!.description}
                        </p>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mt-1">
                        {new Date(ua.unlocked_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-6" aria-label="Catálogo de hitos">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Activity className="size-5 text-primary" aria-hidden />
              Biblioteca de Logros
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">
              Explora y planifica tus próximos objetivos
            </p>
          </div>
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
             <CardContent className="p-1 sm:p-2">
                <AchievementsCatalog
                  achievements={allAchievements}
                  userAchievements={userAchievements}
                  progressById={progressById}
                />
             </CardContent>
          </Card>
        </section>

        {leaderboard.length > 0 && (
          <section className="flex flex-col gap-6" aria-label="Actividad en el gym">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" aria-hidden />
                Hall of Fame
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">
                Compañeros con más actividad de esta temporada
              </p>
            </div>
            <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/50">
              <CardContent className="p-0">
                <ul className="divide-y divide-border/40">
                  {leaderboard.map((entry) => {
                    const displayRank = entry.rank ?? 0;
                    const name = entry.full_name?.trim() || "Sin nombre";
                    const isTopThree = displayRank <= 3;
                    return (
                      <li
                        key={entry.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 transition-all",
                          entry.id === user.id
                            ? "bg-primary/10 ring-inset ring-1 ring-primary/20"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <span className={cn(
                          "flex size-9 items-center justify-center text-sm font-black tabular-nums rounded-xl shrink-0",
                          displayRank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                          displayRank === 2 ? "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400" :
                          displayRank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" :
                          "text-muted-foreground/40 bg-muted/10 font-bold"
                        )}>
                          #{displayRank}
                        </span>
                        <div className="relative shrink-0">
                          <div className={cn(
                            "size-11 overflow-hidden rounded-2xl border-2 bg-background shadow-sm",
                            isTopThree ? "border-primary/40 ring-4 ring-primary/5 scale-110" : "border-border"
                          )}>
                            {entry.avatar_url ? (
                              <Image
                                src={entry.avatar_url}
                                alt=""
                                width={44}
                                height={44}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-primary text-xs font-black text-primary-foreground">
                                {name[0]?.toUpperCase() ?? "?"}
                              </div>
                            )}
                          </div>
                          {isTopThree && (
                            <div className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-background ring-1 ring-border shadow-sm">
                              <Medal className={cn(
                                "size-4",
                                displayRank === 1 ? "text-amber-500" :
                                displayRank === 2 ? "text-slate-400" :
                                "text-orange-400"
                              )} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 ml-1">
                          <p className="truncate text-sm font-black tracking-tight leading-none">
                            {name}
                            {entry.id === user.id && (
                              <Badge className="ms-2 align-middle text-[9px] font-black uppercase tracking-widest h-4 px-1.5 bg-primary text-primary-foreground border-none">
                                Tú
                              </Badge>
                            )}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mt-1.5">
                            {getLevelName(entry.level)}
                          </p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-sm font-black tabular-nums text-primary leading-none tracking-tighter">
                            {entry.xp_points.toLocaleString()} XP
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1.5">
                            {entry.achievements_count} Hitos
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        <Alert className="border-border/40 shadow-sm rounded-2xl bg-muted/5">
          <Info className="size-4 text-primary" aria-hidden />
          <AlertTitle className="text-xs font-black uppercase tracking-widest text-foreground">Sistema de Entrenamiento</AlertTitle>
          <AlertDescription className="text-[10px] font-medium leading-relaxed text-muted-foreground/80 mt-1">
            Tu XP se calcula dinámicamente según la intensidad de tus sesiones, volumen de racha y hitos desbloqueados. 
            Este sistema premia la consistencia real, no solo el uso de la aplicación.
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
}
