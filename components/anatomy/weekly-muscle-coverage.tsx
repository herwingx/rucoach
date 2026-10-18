"use client";

import React, { useState, useMemo } from "react";
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
        <div className="space-y-2">
          <div className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-muted/10 p-1.5">
            {visibleWorked.map((m) => {
              const sets = load[m] || 0;
              const pct = Math.round((sets / maxLoad) * 100);
              return (
                <div
                  key={m}
                  onClick={() => handleToggle(m)}
                  className={`mrow ${selected === m ? "sel" : ""}`}
                >
                  <div className="mrow-n">{MUSCLE_LABELS[m]}</div>
                  <div className="mrow-bar">
                    <div className="mrow-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mrow-v">{fmtSets(sets)} series</div>
                </div>
              );
            })}
          </div>

          {canCollapse && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full rounded-xl border border-border/50 bg-muted/20 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              {showAll
                ? "Mostrar menos"
                : `Ver los ${worked.length} músculos activados`}
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

