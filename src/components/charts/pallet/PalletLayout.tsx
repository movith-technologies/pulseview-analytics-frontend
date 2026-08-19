"use client";
// =============================================================================
// src/components/charts/pallet/PalletLayout.tsx
// Pallet Analysis Görünüm Düzeni
//
// Vue karşılığı: StatisticalProcessControl.vue içindeki Pallet Analysis bölümü
//
// Her seçili ölçüm tipi için tam genişlikte bir PalletChart render eder.
// Layout:
//   [ölçüm adı ayırıcı]
//   [ChartCard — tam genişlik scatter plot]
//
// IndividualValueSeries → PalletSeries dönüşümü bu bileşende yapılır.
// Mapper: mapIndividualToPalletSeriesArray (spcMapper.ts)
// =============================================================================

import { useMemo } from "react";
import { ChartCard } from "../shared/ChartCard";
import { PalletChart } from "./PalletChart";
import { mapIndividualToPalletSeriesArray } from "@/lib/mappers/spcMapper";
import type { IndividualValueSeries } from "@/types/spc";

interface PalletLayoutProps {
  series: IndividualValueSeries[];
}

export function PalletLayout({ series }: PalletLayoutProps) {
  // IndividualValueSeries[] → PalletSeries[] dönüşümü
  // useMemo: veri değişmediği sürece yeniden hesaplanmaz
  const palletSeriesArray = useMemo(
    () => mapIndividualToPalletSeriesArray(series),
    [series]
  );

  if (palletSeriesArray.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {palletSeriesArray.map((s) => {
        const pointCount = s.points.length;

        return (
          <div key={s.measureTypeId} className="flex flex-col gap-4">
            {/* ── Ölçüm Adı Ayırıcı ────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-xs font-semibold tracking-widest uppercase text-[var(--color-muted)]">
                {s.measurementName}
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">
                {pointCount.toLocaleString()} points · {s.maxPalletValue} pallets
              </span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            {/* ── Tam Genişlik Scatter Chart ────────────────────────────────── */}
            <ChartCard
              title={`${s.measurementName} — Pallet Analysis`}
              badges={[
                {
                  label: "Max",
                  value: s.monitoringMax.toFixed(3),
                  color: "red",
                },
                {
                  label: "Mean",
                  value: s.mean.toFixed(3),
                  color: "yellow",
                },
                {
                  label: "Min",
                  value: s.monitoringMin.toFixed(3),
                  color: "red",
                },
                {
                  label: "Pallets",
                  value: s.maxPalletValue,
                  color: "blue",
                },
                {
                  label: "n",
                  value: pointCount.toLocaleString(),
                  color: "gray",
                },
              ]}
            >
              <PalletChart series={s} height={340} />
            </ChartCard>
          </div>
        );
      })}
    </div>
  );
}
