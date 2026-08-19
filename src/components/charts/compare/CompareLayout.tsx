"use client";
// =============================================================================
// src/components/charts/compare/CompareLayout.tsx
// Compare Analysis Görünüm Düzeni
//
// Vue karşılığı: StatisticalProcessControl.vue içindeki Compare Analysis bölümü
//
// Tüm seçili ölçüm tiplerini TEK bir grafikte üst üste gösterir.
// Bu, birden fazla ölçüm tipinin trend karşılaştırmasına olanak tanır.
//
// Layout:
//   [ChartCard — tam genişlik, multi-series line chart]
//   [Seri istatistikleri özeti — her ölçüm tipi için badge'ler]
//
// IndividualValueSeries[] → CompareSeries[] dönüşümü bu bileşende yapılır.
// =============================================================================

import { useMemo } from "react";
import { ChartCard } from "../shared/ChartCard";
import { CompareChart } from "./CompareChart";
import { mapIndividualToCompareSeriesArray } from "@/lib/mappers/spcMapper";
import type { IndividualValueSeries } from "@/types/spc";

// Compare modunda renk paleti (CompareChart.tsx ile senkron)
const SERIES_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#f43f5e",
];

interface CompareLayoutProps {
  series: IndividualValueSeries[];
}

export function CompareLayout({ series }: CompareLayoutProps) {
  const compareSeriesArray = useMemo(
    () => mapIndividualToCompareSeriesArray(series),
    [series]
  );

  if (compareSeriesArray.length === 0) return null;

  // Toplam veri noktası sayısı (tüm serilerden)
  const totalPoints = compareSeriesArray.reduce(
    (sum, s) => sum + s.points.length,
    0
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* ── Başlık Ayırıcı ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-xs font-semibold tracking-widest uppercase text-[var(--color-muted)]">
          Compare Analysis
        </span>
        <span className="text-[10px] text-[var(--color-muted)]">
          {compareSeriesArray.length} series · {totalPoints.toLocaleString()} points
        </span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      {/* ── Ana Grafik Kartı ────────────────────────────────────────────────── */}
      <ChartCard
        title="Compare Analysis — Multi-Series Overlay"
        badges={[
          {
            label: "Series",
            value: compareSeriesArray.length,
            color: "blue",
          },
          {
            label: "n",
            value: totalPoints.toLocaleString(),
            color: "gray",
          },
          {
            label: "Max",
            value: compareSeriesArray[0].monitoringMax.toFixed(3),
            color: "red",
          },
          {
            label: "Mean",
            value: compareSeriesArray[0].mean.toFixed(3),
            color: "yellow",
          },
          {
            label: "Min",
            value: compareSeriesArray[0].monitoringMin.toFixed(3),
            color: "red",
          },
        ]}
      >
        <CompareChart seriesArray={compareSeriesArray} height={520} />
      </ChartCard>

      {/* ── Seri Özeti ──────────────────────────────────────────────────────── */}
      {/* Her ölçüm tipi için küçük bir özet satırı */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {compareSeriesArray.map((s, idx) => (
          <div
            key={s.measureTypeId}
            className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          >
            {/* Seri renk göstergesi */}
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[idx % SERIES_COLORS.length] }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-[var(--color-text)]">
                {s.measurementName}
              </p>
              <p className="text-[10px] text-[var(--color-muted)]">
                {s.points.length.toLocaleString()} pts · Mean {s.mean.toFixed(3)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
