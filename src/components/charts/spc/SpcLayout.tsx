"use client";
// =============================================================================
// src/components/charts/spc/SpcLayout.tsx
// SPC Görünüm Düzeni
//
// Seçilen her ölçüm tipi için iki grafik oluşturur:
//   1. SpcAverageChart  — X-Bar ortalama grafiği (üstte)
//   2. SpcStdDevChart   — Sigma + Cp + Cpk grafiği (altta)
//
// Vue karşılığı: SpcView.vue içindeki b-row + b-col yapısı
// =============================================================================

import { ChartCard } from "../shared/ChartCard";
import { SpcAverageChart } from "./SpcAverageChart";
import { SpcStdDevChart }  from "./SpcStdDevChart";
import type { SpcSeries } from "@/types/spc";

interface SpcLayoutProps {
  series: SpcSeries[];
}

/** Cp/Cpk'nın tüm gruplar için ortalamasını hesaplar */
function calcAvgCapability(
  groups: SpcSeries["groups"],
  ucl: number,
  lcl: number,
  mean: number
): { avgCp: number; avgCpk: number } {
  const tolerance = ucl - lcl;
  let sumCp = 0, sumCpk = 0, count = 0;

  groups.forEach((g) => {
    if (g.sigma <= 0) return;
    const cp  = tolerance / (6 * g.sigma);
    const cpk = Math.min(
      (ucl - mean) / (3 * g.sigma),
      (mean - lcl) / (3 * g.sigma)
    );
    sumCp  += cp;
    sumCpk += cpk;
    count++;
  });

  return {
    avgCp:  count > 0 ? parseFloat((sumCp  / count).toFixed(2)) : 0,
    avgCpk: count > 0 ? parseFloat((sumCpk / count).toFixed(2)) : 0,
  };
}

/** Cp/Cpk değerine göre badge rengi seç */
function capabilityColor(value: number): "green" | "yellow" | "red" {
  if (value >= 1.33) return "green";
  if (value >= 1.00) return "yellow";
  return "red";
}

export function SpcLayout({ series }: SpcLayoutProps) {
  if (series.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      {series.map((s) => {
        const groupCount = s.groups.length;
        const { avgCp, avgCpk } = calcAvgCapability(s.groups, s.ucl, s.lcl, s.mean);

        return (
          <div key={s.measureTypeId} className="flex flex-col gap-3">
            {/* ── Ölçüm Başlığı ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-xs font-semibold tracking-widest uppercase text-[var(--color-muted)]">
                {s.measurementName}
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">
                {groupCount} groups × 200 samples
              </span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            {/* ── X-Bar Ortalama Grafiği ────────────────────────────────── */}
            <ChartCard
              title={`${s.measurementName} — X-Bar Average Chart`}
              badges={[
                { label: "UCL",   value: s.ucl.toFixed(3),          color: "green"  },
                { label: "Mean",  value: s.mean.toFixed(3),          color: "yellow" },
                { label: "LCL",   value: s.lcl.toFixed(3),          color: "green"  },
                { label: "Groups",value: groupCount.toLocaleString(),color: "gray"   },
              ]}
            >
              <SpcAverageChart series={s} height={280} />
            </ChartCard>

            {/* ── Sigma + Cp + Cpk Grafiği ──────────────────────────────── */}
            <ChartCard
              title={`${s.measurementName} — Std Dev & Process Capability`}
              badges={[
                { label: "Avg Cp",  value: avgCp.toFixed(2),  color: capabilityColor(avgCp)  },
                { label: "Avg Cpk", value: avgCpk.toFixed(2), color: capabilityColor(avgCpk) },
                { label: "UCL",     value: s.ucl.toFixed(3),  color: "green" },
                { label: "LCL",     value: s.lcl.toFixed(3),  color: "green" },
              ]}
            >
              <SpcStdDevChart series={s} height={260} />
            </ChartCard>
          </div>
        );
      })}
    </div>
  );
}
