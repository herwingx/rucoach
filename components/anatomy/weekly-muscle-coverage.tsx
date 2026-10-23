"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MUSCLE_LABELS,
  rankOf,
  type MuscleSlug,
} from "@/lib/anatomy/muscles";
import { BodyMap, BodyMapLegend } from "@/components/anatomy/body-map";

export interface WeeklyMuscleCoverageProps {
  load: Partial<Record<MuscleSlug, number>>;
  sex?: "male" | "female";
  lessLabel?: string;
  moreLabel?: string;
  showMissed?: boolean;
  collapsedRows?: number;
}

function fmtSets(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function WeeklyMuscleCoverage({
  load,
  sex = "male",
  lessLabel = "Menos series",
  moreLabel = "Más series",
  showMissed = true,
  collapsedRows = 6,
}: WeeklyMuscleCoverageProps) {
  const [selected, setSelected] = useState<MuscleSlug | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { worked, missed } = useMemo(() => rankOf(load), [load]);
  const maxLoad = worked.length ? load[worked[0]] || 1 : 1;

  const canCollapse = worked.length > collapsedRows;
  const visibleWorked =
    canCollapse &&
    !showAll &&
    (!selected || worked.indexOf(selected) < collapsedRows)
      ? worked.slice(0, collapsedRows)
      : worked;

  const handleToggle = (m: MuscleSlug | null) => {
    if (!m) {
      setSelected(null);
      return;
    }
    setSelected((prev) => (prev === m ? null : m));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-muted/10 p-3 sm:p-4">
        <BodyMap
          bare
          sex={sex}
          mode="volume"
          load={load}
          selected={selected}
          onSelect={handleToggle}
        />
        <div className="mt-2">
          <BodyMapLegend lessLabel={lessLabel} moreLabel={moreLabel} />
        </div>
      </div>

      {worked.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-5 text-center text-xs font-medium text-muted-foreground">
          Añade ejercicios para visualizar el volumen ponderado por grupo
          muscular.
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Resumen rápido */}
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              {worked.length} {worked.length === 1 ? "músculo activado" : "músculos activados"}
            </p>
            <p className="min-w-0 truncate text-[11px] font-semibold text-muted-foreground">
              Foco:{" "}
              <span className="font-black text-primary">
                {MUSCLE_LABELS[worked[0]].split(" / ")[0]}
              </span>
            </p>
          </div>

          <ul className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm">
            {visibleWorked.map((m, idx) => {
              const sets = load[m] || 0;
              const pct = Math.max(6, Math.round((sets / maxLoad) * 100));
              const isSelected = selected === m;
              const [primaryName, ...restName] = MUSCLE_LABELS[m].split(" / ");
              return (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => handleToggle(m)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex w-full flex-col gap-2 px-3.5 py-3 text-left transition-colors active:bg-muted/50",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black tabular-nums",
                          idx === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                        aria-hidden
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold leading-tight text-foreground">
                          {primaryName}
                        </p>
                        {restName.length > 0 && (
                          <p className="truncate text-[11px] font-medium leading-tight text-muted-foreground">
                            {restName.join(" / ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-baseline gap-1">
                        <span className="text-lg font-black tabular-nums leading-none text-foreground">
                          {fmtSets(sets)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {sets === 1 ? "serie" : "series"}
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      role="presentation"
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-300 ease-out",
                          pct >= 75
                            ? "bg-primary"
                            : pct >= 50
                              ? "bg-primary/75"
                              : pct >= 25
                                ? "bg-primary/50"
                                : "bg-primary/30",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {canCollapse && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground active:scale-[0.99]"
            >
              {showAll
                ? "Mostrar menos"
                : `Ver los ${worked.length} músculos activados`}
              <ChevronDown
                className={cn("size-4 transition-transform", showAll && "rotate-180")}
                aria-hidden
              />
            </button>
          )}

          {showMissed && missed.length > 0 && (
            <div className="pt-2">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Sin estímulo directo ({missed.length})
              </p>
              <div className="mchips">
                {missed.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleToggle(m)}
                    className={`mchip miss ${selected === m ? "sel" : ""}`}
                  >
                    {MUSCLE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

