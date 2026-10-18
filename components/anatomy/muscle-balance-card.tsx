"use client";

import React, { useState, useMemo } from "react";
import {
  MUSCLES,
  MUSCLE_LABELS,
  levelsOf,
  rankOf,
  computeRoutineMuscleVolume,
  exerciseMuscleWeights,
  type MuscleSlug,
} from "@/lib/anatomy/muscles";
import {
  computeMuscleRecovery,
  computeRetainedStrength,
  FATIGUE_LEVELS,
  STRENGTH_LEVELS,
  halfLifeDecay,
  STRENGTH_FLOOR,
  STRENGTH_FULL_MS,
  STRENGTH_HALF_LIFE_MS,
  weeksSinceTraining,
  type WorkoutHistoryEntry,
} from "@/lib/anatomy/recovery";
import {
  BodyMap,
  BodyMapLegend,
  FatigueLegend,
  StrengthLegend,
} from "@/components/anatomy/body-map";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface RichWorkoutSessionItem {
  exercise: {
    id?: string;
    name: string;
    primary_muscle?: string | null;
    secondary_muscles?: string[] | null;
    muscle_weights?: Record<string, number> | null;
  };
  sets: number;
  bestWeightKg?: number | null;
  bestReps?: number | null;
  est1rm?: number | null;
}

export interface RichWorkoutSession {
  id?: string;
  timestamp: number;
  items: RichWorkoutSessionItem[];
}

export interface MuscleBalanceCardProps {
  workoutHistory: RichWorkoutSession[];
  plannedWeeklyLoad?: Partial<Record<MuscleSlug, number>>;
  gender?: "male" | "female";
  defaultView?: "balance" | "fatigue" | "strength";
}

const MUSCLE_WINDOWS = [
  { value: "week" as const, label: "Semana", days: 7 },
  { value: "30" as const, label: "30d", days: 30 },
  { value: "90" as const, label: "90d", days: 90 },
  { value: "all" as const, label: "Todo", days: 0 },
];

const COLLAPSED_MUSCLE_ROWS = 6;
const DAY_MS = 86_400_000;

function fmtSets(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function getWeekBounds(weekOffset: number, refNow: number) {
  const d = new Date(refNow);
  d.setHours(0, 0, 0, 0);
  // Start week on Monday
  const day = d.getDay();
  const diffToMon = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMon + weekOffset * 7);
  const start = d;
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function MuscleBalanceCard({
  workoutHistory,
  plannedWeeklyLoad = {},
  gender = "male",
  defaultView = "balance",
}: MuscleBalanceCardProps) {
  const [view, setView] = useState<"balance" | "fatigue" | "strength">(
    defaultView,
  );
  const [win, setWin] = useState<"week" | "30" | "90" | "all">("30");
  const [weekOff, setWeekOff] = useState(0);
  const [sel, setSel] = useState<MuscleSlug | null>(null);
  const [showAllMuscles, setShowAllMuscles] = useState(false);

  const nowMs = useMemo(() => Date.now(), []);
  const isFatigue = view === "fatigue";
  const isStrength = view === "strength";

  // Earliest week offset for weekly navigation
  const earliestOff = useMemo(() => {
    if (!workoutHistory.length) return 0;
    const minTs = Math.min(...workoutHistory.map((s) => s.timestamp));
    const currentWeekStart = getWeekBounds(0, nowMs).start.getTime();
    const earliestWeekStart = getWeekBounds(0, minTs).start.getTime();
    return Math.min(
      0,
      Math.round((earliestWeekStart - currentWeekStart) / (7 * DAY_MS)),
    );
  }, [workoutHistory, nowMs]);

  const clampedOff = Math.max(earliestOff, Math.min(0, weekOff));
  const { start: wkStart, end: wkEnd } = useMemo(
    () => getWeekBounds(clampedOff, nowMs),
    [clampedOff, nowMs],
  );

  // Filter workout sessions in the selected time window
  const windowWorkouts = useMemo(() => {
    const winMeta =
      MUSCLE_WINDOWS.find((o) => o.value === win) || MUSCLE_WINDOWS[0];
    if (winMeta.value === "week") {
      const sMs = wkStart.getTime();
      const eMs = wkEnd.getTime();
      return workoutHistory.filter(
        (w) => w.timestamp >= sMs && w.timestamp < eMs,
      );
    }
    if (winMeta.days > 0) {
      const cutoff = nowMs - winMeta.days * DAY_MS;
      return workoutHistory.filter((w) => w.timestamp >= cutoff);
    }
    return workoutHistory;
  }, [workoutHistory, win, wkStart, wkEnd, nowMs]);

  // Compute muscle volume load in the selected window
  const load = useMemo(() => {
    const items: Array<{ exercise: any; sets: number }> = [];
    for (const session of windowWorkouts) {
      for (const it of session.items) {
        items.push({ exercise: it.exercise, sets: it.sets });
      }
    }
    return computeRoutineMuscleVolume(items);
  }, [windowWorkouts]);

  // Planned weekly load (current week only)
  const hasPlanned = useMemo(
    () =>
      win === "week" &&
      clampedOff === 0 &&
      Object.values(plannedWeeklyLoad).some((v) => (v ?? 0) > 0),
    [win, clampedOff, plannedWeeklyLoad],
  );

  // Fatigue & Retained Strength
  const recoveryHistory: WorkoutHistoryEntry[] = useMemo(
    () =>
      workoutHistory.map((s) => ({
        timestamp: s.timestamp,
        items: s.items.map((it) => ({
          exercise: it.exercise,
          sets: it.sets,
        })),
      })),
    [workoutHistory],
  );

  const fatigueStatus = useMemo(
    () => computeMuscleRecovery(recoveryHistory, nowMs),
    [recoveryHistory, nowMs],
  );

  const fatigueLoad = useMemo(() => {
    const map: Record<MuscleSlug, number> = {} as Record<MuscleSlug, number>;
    for (const m of MUSCLES) {
      map[m] = Math.min(1, Math.max(0, fatigueStatus[m]?.fatigueScore ?? 0));
    }
    return map;
  }, [fatigueStatus]);

  const strengthLoad = useMemo(
    () => computeRetainedStrength(recoveryHistory, nowMs).strengthByMuscle,
    [recoveryHistory, nowMs],
  );

  // Ranked worked & missed muscles
  const { worked, missed } = useMemo(() => {
    if (isFatigue) {
      return rankOf(fatigueLoad);
    }
    if (isStrength) {
      const workedList = MUSCLES.filter(
        (m) => (strengthLoad[m] || 0) > STRENGTH_FLOOR,
      ).sort((a, b) => (strengthLoad[b] || 0) - (strengthLoad[a] || 0));
      const missedList = MUSCLES.filter(
        (m) => (strengthLoad[m] || 0) <= STRENGTH_FLOOR,
      );
      return { worked: workedList, missed: missedList };
    }
    if (hasPlanned) {
      const unionLoad: Partial<Record<MuscleSlug, number>> = { ...load };
      for (const m of MUSCLES) {
        if ((plannedWeeklyLoad[m] || 0) > (unionLoad[m] || 0)) {
          unionLoad[m] = plannedWeeklyLoad[m];
        }
      }
      const { missed: unionMissed } = rankOf(unionLoad);
      const workedUnion = MUSCLES.filter(
        (m) => (load[m] || 0) > 0 || (plannedWeeklyLoad[m] || 0) > 0,
      ).sort(
        (a, b) =>
          (load[b] || 0) - (load[a] || 0) ||
          (plannedWeeklyLoad[b] || 0) - (plannedWeeklyLoad[a] || 0),
      );
      return { worked: workedUnion, missed: unionMissed };
    }
    return rankOf(load);
  }, [isFatigue, isStrength, fatigueLoad, strengthLoad, hasPlanned, load, plannedWeeklyLoad]);

  const maxLoad = worked.length ? load[worked[0]] || 1 : 1;
  const maxBar = useMemo(() => {
    if (!hasPlanned) return maxLoad;
    return Math.max(
      1,
      ...worked.map((m) => Math.max(load[m] || 0, plannedWeeklyLoad[m] || 0)),
    );
  }, [hasPlanned, maxLoad, worked, load, plannedWeeklyLoad]);

  const activeSelection = sel && MUSCLES.includes(sel) ? sel : null;
  const canCollapseWorked = worked.length > COLLAPSED_MUSCLE_ROWS;
  const visibleWorked =
    canCollapseWorked &&
    !showAllMuscles &&
    (!activeSelection ||
      worked.indexOf(activeSelection) < COLLAPSED_MUSCLE_ROWS)
      ? worked.slice(0, COLLAPSED_MUSCLE_ROWS)
      : worked;

  const toggleSel = (m: MuscleSlug | null) => {
    if (!m) {
      setSel(null);
      return;
    }
    setSel((prev) => (prev === m ? null : m));
  };

  // Per-muscle exercise 1RM retention for the "Fuerza" tab (open-gym Strength breakdown)
  const strengthExercisesForMuscle = useMemo(() => {
    if (!isStrength) return [];
    const targetMuscle = activeSelection || worked[0];
    if (!targetMuscle) return [];

    const byEx = new Map<
      string,
      {
        name: string;
        weightFactor: number;
        peak1rm: number;
        bestWeightKg: number;
        bestReps: number;
        lastTs: number;
      }
    >();

    for (const session of workoutHistory) {
      for (const it of session.items) {
        const weights = exerciseMuscleWeights(it.exercise);
        const factor = weights[targetMuscle];
        if (!factor) continue;
        const key = it.exercise.id || it.exercise.name;
        const wKg = it.bestWeightKg ?? 0;
        const reps = it.bestReps ?? 0;
        const e1rm =
          it.est1rm ??
          (wKg > 0
            ? reps <= 1
              ? wKg
              : Math.round(wKg * (1 + Math.min(reps, 30) / 30) * 10) / 10
            : 0);

        const existing = byEx.get(key);
        if (!existing) {
          byEx.set(key, {
            name: it.exercise.name,
            weightFactor: factor,
            peak1rm: e1rm,
            bestWeightKg: wKg,
            bestReps: reps,
            lastTs: session.timestamp,
          });
        } else {
          if (session.timestamp > existing.lastTs) {
            existing.lastTs = session.timestamp;
          }
          if (e1rm > existing.peak1rm) {
            existing.peak1rm = e1rm;
            existing.bestWeightKg = wKg;
            existing.bestReps = reps;
          }
        }
      }
    }

    return Array.from(byEx.values())
      .map((entry) => {
        const ageMs = Math.max(0, nowMs - entry.lastTs);
        const retention =
          ageMs <= STRENGTH_FULL_MS
            ? 1
            : Math.max(
                STRENGTH_FLOOR,
                STRENGTH_FLOOR +
                  (1 - STRENGTH_FLOOR) *
                    halfLifeDecay(
                      ageMs - STRENGTH_FULL_MS,
                      STRENGTH_HALF_LIFE_MS,
                    ),
              );
        return {
          ...entry,
          retention,
          retained1rm:
            entry.peak1rm > 0
              ? Math.round(entry.peak1rm * retention * 10) / 10
              : 0,
          weeksIdle: weeksSinceTraining(nowMs, entry.lastTs),
        };
      })
      .sort(
        (a, b) => b.weightFactor - a.weightFactor || b.retained1rm - a.retained1rm,
      );
  }, [isStrength, activeSelection, worked, workoutHistory, nowMs]);

  const strengthTargetMuscle = activeSelection || worked[0] || null;

  const emptyMsg =
    win === "week"
      ? clampedOff === 0
        ? "Sin entrenamientos registrados esta semana."
        : "Sin entrenamientos en esta semana."
      : win === "all"
        ? "Registra entrenamientos para ver qué músculos trabajas."
        : `Sin entrenamientos en los últimos ${win === "30" ? "30" : "90"} días.`;

  // Compute current active selection label & summary for callout pill
  const selSummary = useMemo(() => {
    if (!activeSelection) return null;
    if (isFatigue) {
      const f = fatigueStatus[activeSelection];
      const pct = Math.round((fatigueLoad[activeSelection] || 0) * 100);
      const statusText =
        pct < 15
          ? "Descansado · Listo para entrenar"
          : pct < 45
            ? `${pct}% fatiga · En recuperación (${f?.hoursToReady ?? 0}h restantes)`
            : `${pct}% fatiga · Fatigado (${f?.hoursToReady ?? 0}h para recuperar)`;
      return statusText;
    }
    if (isStrength) {
      const r = strengthLoad[activeSelection] || 0;
      return r > STRENGTH_FLOOR
        ? `${Math.round(r * 100)}% fuerza retenida`
        : "Sin registros recientes";
    }
    const done = load[activeSelection] || 0;
    const plan = plannedWeeklyLoad[activeSelection] || 0;
    if (hasPlanned && plan > 0) {
      return `${fmtSets(done)} / ${fmtSets(plan)} series efectivas`;
    }
    return done > 0
      ? `${fmtSets(done)} series ponderadas`
      : "Sin trabajar en este periodo";
  }, [
    activeSelection,
    isFatigue,
    isStrength,
    fatigueStatus,
    strengthLoad,
    load,
    plannedWeeklyLoad,
    hasPlanned,
  ]);

  return (
    <div className="space-y-4">
      {/* Top 3-tab Segmented Control: Balance muscular | Fatiga | Fuerza */}
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
        {(
          [
            { value: "balance", label: "Balance muscular" },
            { value: "fatigue", label: "Fatiga" },
            { value: "strength", label: "Fuerza" },
          ] as const
        ).map((tab) => {
          const active = view === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setView(tab.value);
                setShowAllMuscles(false);
              }}
              className={`rounded-lg px-2.5 py-2 text-xs font-bold transition-all ${
                active
                  ? "bg-card text-primary shadow-sm ring-1 ring-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Period selector for Muscle Balance view */}
      {!isFatigue && !isStrength && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-border/60 bg-muted/25 p-1">
            {MUSCLE_WINDOWS.map((w) => {
              const active = win === w.value;
              return (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => {
                    setWin(w.value);
                    setWeekOff(0);
                    setShowAllMuscles(false);
                  }}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>

          {win === "week" && (
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/15 px-2 py-1.5">
              <button
                type="button"
                disabled={clampedOff <= earliestOff}
                onClick={() => setWeekOff(clampedOff - 1)}
                aria-label="Semana anterior"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => clampedOff !== 0 && setWeekOff(0)}
                className="text-center text-xs font-bold text-foreground"
              >
                {clampedOff === 0
                  ? `Esta semana · ${formatShortDate(wkStart)}`
                  : `${formatShortDate(wkStart)} – ${formatShortDate(new Date(wkEnd.getTime() - DAY_MS))}`}
              </button>
              <button
                type="button"
                disabled={clampedOff >= 0}
                onClick={() => setWeekOff(clampedOff + 1)}
                aria-label="Semana siguiente"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* BodyMap SVG with authentic open-gym classes */}
      <div className="rounded-2xl border border-border/60 bg-muted/10 p-3 sm:p-5">
        <BodyMap
          bare
          sex={gender}
          mode={isFatigue ? "recovery" : isStrength ? "strength" : "volume"}
          load={isFatigue ? fatigueLoad : isStrength ? strengthLoad : load}
          recovery={isFatigue ? fatigueStatus : undefined}
          thresholds={
            isFatigue
              ? FATIGUE_LEVELS
              : isStrength
                ? STRENGTH_LEVELS
                : undefined
          }
          selected={activeSelection}
          onSelect={toggleSel}
        />

        <div className="mt-2">
          {isFatigue ? (
            <FatigueLegend />
          ) : isStrength ? (
            <StrengthLegend />
          ) : (
            <BodyMapLegend lessLabel="Menos series" moreLabel="Más series" />
          )}
        </div>

        {/* Selected muscle pill */}
        {activeSelection && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs">
            <div>
              <span className="font-black text-foreground">
                {MUSCLE_LABELS[activeSelection]}
              </span>
              <span className="mx-1.5 text-muted-foreground">·</span>
              <span className="font-semibold text-primary">{selSummary}</span>
            </div>
            <button
              type="button"
              onClick={() => setSel(null)}
              className="rounded-md p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground"
              aria-label="Quitar selección"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Mode 1 & 2: Balance Muscular & Fatiga Breakdown */}
      {!isStrength && (
        <>
          {worked.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs font-medium text-muted-foreground">
              {isFatigue
                ? "Todos los grupos musculares están descansados y listos para entrenar."
                : emptyMsg}
            </div>
          ) : (
            <div className="space-y-1">
              {hasPlanned && !isFatigue && (
                <div className="mb-1 flex items-center justify-between px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Músculo</span>
                  <span>Completado / Plan semanal</span>
                </div>
              )}
              <div className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-muted/10 p-1.5">
                {visibleWorked.map((m) => {
                  if (isFatigue) {
                    const pct = Math.round((fatigueLoad[m] || 0) * 100);
                    const lvl = levelsOf(fatigueLoad, FATIGUE_LEVELS)[m] || 0;
                    const hoursLeft = fatigueStatus[m]?.hoursToReady ?? 0;
                    return (
                      <div
                        key={m}
                        onClick={() => toggleSel(m)}
                        className={`mrow hm-fatigue ${activeSelection === m ? "sel" : ""}`}
                      >
                        <div className="mrow-n flex items-center justify-between sm:justify-start sm:gap-1.5">
                          <span>{MUSCLE_LABELS[m]}</span>
                          {hoursLeft > 0 && (
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              ({hoursLeft}h)
                            </span>
                          )}
                        </div>
                        <div className="mrow-bar">
                          <div
                            className={`mrow-fill l${lvl}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mrow-v">{pct}%</div>
                      </div>
                    );
                  }

                  const done = load[m] || 0;
                  const plan = plannedWeeklyLoad[m] || 0;
                  if (hasPlanned) {
                    const donePct = Math.round((done / maxBar) * 100);
                    const planPct = Math.round((plan / maxBar) * 100);
                    return (
                      <div
                        key={m}
                        onClick={() => toggleSel(m)}
                        className={`mrow ${activeSelection === m ? "sel" : ""}`}
                      >
                        <div className="mrow-n">{MUSCLE_LABELS[m]}</div>
                        <div className="mrow-bar">
                          {plan > 0 && (
                            <div
                              className="mrow-plan"
                              style={{ width: `${planPct}%` }}
                            />
                          )}
                          <div
                            className={`mrow-fill ${plan > 0 && done >= plan ? "met" : ""}`}
                            style={{ width: `${donePct}%` }}
                          />
                        </div>
                        <div className="mrow-v">
                          {plan > 0
                            ? `${fmtSets(done)} / ${fmtSets(plan)}`
                            : `${fmtSets(done)} series`}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m}
                      onClick={() => toggleSel(m)}
                      className={`mrow ${activeSelection === m ? "sel" : ""}`}
                    >
                      <div className="mrow-n">{MUSCLE_LABELS[m]}</div>
                      <div className="mrow-bar">
                        <div
                          className="mrow-fill"
                          style={{
                            width: `${Math.round((done / maxLoad) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="mrow-v">{fmtSets(done)} series</div>
                    </div>
                  );
                })}
              </div>

              {canCollapseWorked && (
                <button
                  type="button"
                  onClick={() => setShowAllMuscles((v) => !v)}
                  className="mt-1.5 w-full rounded-xl border border-border/50 bg-muted/20 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  {showAllMuscles
                    ? "Mostrar menos"
                    : `Mostrar los ${worked.length} músculos trabajados`}
                </button>
              )}

              {/* Neglected / Untrained muscles in window */}
              {!isFatigue && missed.length > 0 && (
                <div className="pt-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sin trabajar en este periodo ({missed.length})
                  </p>
                  <div className="mchips">
                    {missed.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleSel(m)}
                        className={`mchip miss ${activeSelection === m ? "sel" : ""}`}
                      >
                        {MUSCLE_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Mode 3: Retained Strength (Fuerza retenida) Breakdown */}
      {isStrength && (
        <div className="space-y-3">
          {worked.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs font-medium text-muted-foreground">
              Registra entrenamientos para calcular la retención de fuerza por
              grupo muscular.
            </div>
          ) : (
            <>
              <div className="mchips">
                {worked.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleSel(m)}
                    className={`mchip ${strengthTargetMuscle === m ? "sel" : ""}`}
                  >
                    {MUSCLE_LABELS[m]} · {Math.round((strengthLoad[m] || 0) * 100)}%
                  </button>
                ))}
              </div>

              {strengthTargetMuscle && (
                <div className="rounded-2xl border border-border/60 bg-muted/10 p-3.5">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      {MUSCLE_LABELS[strengthTargetMuscle]}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {Math.round((strengthLoad[strengthTargetMuscle] || 0) * 100)}%
                      {" "}fuerza retenida
                    </span>
                  </div>

                  {strengthExercisesForMuscle.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Sin ejercicios registrados para este músculo.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {strengthExercisesForMuscle.map((ex) => {
                        const pct = Math.round(ex.retention * 100);
                        return (
                          <div key={ex.name} className="py-2.5 first:pt-0 last:pb-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-bold text-foreground">
                                {ex.name}
                              </span>
                              <span className="shrink-0 text-xs font-black tabular-nums text-primary">
                                {ex.peak1rm > 0 ? (
                                  <>
                                    ~{ex.retained1rm} kg{" "}
                                    <span className="font-normal text-muted-foreground">
                                      / {ex.peak1rm} kg 1RM ({pct}%)
                                    </span>
                                  </>
                                ) : (
                                  `${pct}% retenido`
                                )}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2.5">
                              <div className="mrow-bar flex-1">
                                <div
                                  className="mrow-fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                                {ex.weeksIdle === 0
                                  ? "Esta semana"
                                  : `Hace ${ex.weeksIdle} sem`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
