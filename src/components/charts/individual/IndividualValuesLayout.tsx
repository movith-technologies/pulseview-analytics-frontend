"use client";
// =============================================================================
// src/components/charts/individual/IndividualValuesLayout.tsx
// Individual Values Görünüm Düzeni
//
// Seçilen her ölçüm tipi için bir satır oluşturur:
//   [Sol %30: Histogram] | [Sağ %70: Timeline]
//
// Vue karşılığı:
//   <b-row v-for="measurement in individualValues">
//     <b-col cols="4"><HorizontalBarChart /></b-col>
//     <b-col cols="8"><ControlChart /></b-col>
//   </b-row>
// =============================================================================

import { ChartCard } from "../shared/ChartCard";
import { HistogramChart } from "./HistogramChart";
import { TimelineChart } from "./TimelineChart";
import type { IndividualValueSeries } from "@/types/spc";

interface IndividualValuesLayoutProps {
  series: IndividualValueSeries[];
}

/** Sayıyı okunabilir kısa formata çevirir: 350000 → 350K */
function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(3);
}

export function IndividualValuesLayout({ series }: IndividualValuesLayoutProps) {
  if (series.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {series.map((s) => {
        const nokRate = s.dataPoints.length > 0
          ? ((s.nokCount / s.dataPoints.length) * 100).toFixed(1)
          : "0.0";

        return (
          <div key={s.measureTypeId} className="flex flex-col gap-4">
            {/* ── Ölçüm Adı Başlığı ───────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-xs font-semibold tracking-widest uppercase text-[var(--color-muted)]">
                {s.measurementName}
              </span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            {/* ── İki Sütun: Histogram + Timeline ────────────────────── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_7fr]">
              {/* Histogram — Sol %30 */}
              <ChartCard
                title="Distribution"
                badges={[
                  { label: "n", value: s.dataPoints.length.toLocaleString(), color: "gray" },
                  { label: "NOK", value: `${nokRate}%`, color: s.nokCount > 0 ? "red" : "green" },
                ]}
              >
                <HistogramChart series={s} height={280} />
              </ChartCard>

              {/* Timeline — Sağ %70 */}
              <ChartCard
                title={`${s.measurementName} — Values Over Time`}
                badges={[
                  { label: "UCL", value: fmt(s.ucl),           color: "green"  },
                  { label: "Mean",value: fmt(s.mean),           color: "yellow" },
                  { label: "LCL", value: fmt(s.lcl),           color: "green"  },
                  { label: "Max", value: fmt(s.monitoringMax),  color: "red"    },
                  { label: "Min", value: fmt(s.monitoringMin),  color: "blue"   },
                ]}
              >
                <TimelineChart series={s} height={280} />
              </ChartCard>
            </div>
          </div>
        );
      })}
    </div>
  );
}
