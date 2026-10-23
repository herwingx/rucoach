"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, Info } from "lucide-react";
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
        <div className="space-y-3">
          {/* Resumen rápido sin truncamiento */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              {worked.length} {worked.length === 1 ? "músculo activado" : "músculos activados"}
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
              <span className="text-muted-foreground font-medium text-[11px]">Foco:</span>
              <strong className="font-black">
                {MUSCLE_LABELS[worked[0]].split(" / ")[0]}
              </strong>
            </div>
          </div>

          {/* Leyenda explicativa de qué significa la barra */}
          <div className="flex items-center gap-2 rounded-xl bg-muted/20 border border-border/50 px-3 py-2 text-[11px] text-muted-foreground leading-snug">
            <Info className="size-3.5 text-primary shrink-0" aria-hidden />
            <span>
              <strong className="text-foreground">Proporción de estímulo:</strong> La barra indica el volumen relativo respecto al músculo con mayor carga en la sesión.
            </span>
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
                      "flex w-full flex-col gap-2.5 px-3.5 py-3 text-left transition-colors active:bg-muted/50",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black tabular-nums border",
                          idx === 0
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/60 text-foreground border-border/50",
                        )}
                        aria-hidden
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-tight text-foreground">
                          {primaryName}
                        </p>
                        {restName.length > 0 && (
                          <p className="text-xs font-medium leading-tight text-muted-foreground mt-0.5">
                            {restName.join(" / ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-baseline gap-1">
                        <span className="text-base sm:text-lg font-black tabular-nums leading-none text-foreground">
                          {fmtSets(sets)}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {sets === 1 ? "serie" : "series"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Barra de proporción de estímulo con porcentaje */}
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40 border border-border/30"
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
                      <span className="shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground/80 min-w-[34px] text-right">
                        {pct}%
                      </span>
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground active:scale-[0.99]"
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

