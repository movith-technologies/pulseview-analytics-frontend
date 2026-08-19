"use client";
// =============================================================================
// src/components/charts/pallet/PalletChart.tsx
// Pallet Analysis Scatter Plot
//
// Vue karşılığı: PalletScatterChart.vue
//
// İş kuralları:
//   - X ekseni: palet numarası (0..maxPalletValue+1)
//   - Y ekseni: ölçüm değeri
//   - Scatter tipi: her nokta bir ürün ölçümü
//   - plotLines: monitoringMax (kırmızı), mean (turuncu), monitoringMin (kırmızı)
//   - turboThreshold: 30000 (büyük veri seti desteği)
//   - Tooltip: Value + ProdID + Pallet
//
// Pallet ?? Piece fallback mantığı:
//   PalletSeries.points[i].x zaten mapper'da uygulanmış.
// =============================================================================

import { useMemo } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { PalletSeries } from "@/types/spc";

interface PalletChartProps {
  series: PalletSeries;
  height?: number;
}

export function PalletChart({ series, height = 330 }: PalletChartProps) {
  const options = useMemo((): Highcharts.Options => {
    const scatterData = series.points.map((p) => ({
      x: p.x,
      y: p.y,
      custom: {
        prodId: p.prodId,
        pallet: p.pallet,
      },
    }));

    return {
      chart: {
        type: "scatter",
        height,
        zoomType: "xy",
        backgroundColor: "transparent",
        animation: false,
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
      },
      title: { text: undefined },
      credits: { enabled: false },

      // ─── X Ekseni: Palet Numarası ─────────────────────────────────────────
      xAxis: {
        min: 0,
        max: series.maxPalletValue + 1,
        tickAmount: Math.min(series.maxPalletValue + 2, 30),
        lineColor: "#30363d",
        tickColor: "#30363d",
        gridLineColor: "#21262d",
        gridLineWidth: 1,
        title: {
          text: "Pallet Number",
          style: { color: "#8b949e", fontSize: "11px" },
        },
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        crosshair: { color: "rgba(255,255,255,0.08)", width: 1 },
      },

      // ─── Y Ekseni: Ölçüm Değeri + Referans Çizgileri ─────────────────────
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: undefined },

        plotLines: [
          {
            value: series.monitoringMax,
            color: "#ef4444",
            width: 2,
            dashStyle: "Solid",
            zIndex: 4,
            label: {
              text: `Max ${series.monitoringMax.toFixed(2)}`,
              align: "right",
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "600" },
            },
          },
          {
            value: series.mean,
            color: "#f97316",
            width: 2,
            dashStyle: "Dash",
            zIndex: 4,
            label: {
              text: `Mean ${series.mean.toFixed(2)}`,
              x: 40,
              style: { color: "#f97316", fontSize: "9px", fontWeight: "600" },
            },
          },
          {
            value: series.monitoringMin,
            color: "#ef4444",
            width: 2,
            dashStyle: "Solid",
            zIndex: 4,
            label: {
              text: `Min ${series.monitoringMin.toFixed(2)}`,
              align: "right",
              y: 15,
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "600" },
            },
          },
        ],
      },

      // ─── Tooltip ──────────────────────────────────────────────────────────
      tooltip: {
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "12px" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: function (this: any) {
          const custom = this.point?.custom as { prodId: number; pallet: number } | undefined;
          return (
            `<b>Value:</b> ${(this.y as number).toFixed(4)}<br/>` +
            `<span style="color:#8b949e">ProdID:</span> ${custom?.prodId ?? "—"}<br/>` +
            `<span style="color:#8b949e">Pallet:</span> ${custom?.pallet ?? this.x}`
          );
        },
      },

      legend: { enabled: false },

      plotOptions: {
        scatter: {
          marker: {
            radius: 5,
            symbol: "circle",
            fillColor: "rgba(0,80,120,0.35)",
            lineColor: "rgba(0,120,180,0.6)",
            lineWidth: 1,
            states: {
              hover: {
                enabled: true,
                radius: 7,
                fillColor: "rgba(59,130,246,0.8)",
              },
            },
          },
          turboThreshold: 30000,
        },
      },

      boost: {
        useGPUTranslations: true,
        usePreallocated: true,
      },

      responsive: {
        rules: [
          {
            chartOptions: { xAxis: { labels: { staggerLines: 2 } } },
            condition: { maxWidth: 1000 },
          },
        ],
      },

      series: [
        {
          type: "scatter",
          name: "Pallet",
          data: scatterData,
        },
      ],
    };
  }, [series, height]);

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
    />
  );
}
