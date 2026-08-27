"use client";
// =============================================================================
// src/components/charts/pallet/PalletChart.tsx
// Pallet Analysis — X=Palet No, Y=Değer Scatter Plot
//
// Vue karşılığı: PalletScatterChart.vue
// SSL Dokümanı (Section 2.2.3) uyumu:
//   - PlotLine etiketleri SOL tarafta (align: "left", x: 5)
//   - Etiketler: Max, Mean, Min
//   - X ekseni: palet numarası (0 → maxPalletValue)
//
// Özellikler:
//   - useChartReflow: ResizeObserver ile otomatik reflow
//   - Boost modülü: WebGL ile 30k+ palet noktası
// =============================================================================

import { useMemo, useRef } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { PalletSeries } from "@/types/spc";
import { useChartReflow } from "@/hooks/useChartReflow";

interface PalletChartProps {
  series: PalletSeries;
  height?: number;
}

export function PalletChart({ series, height = 330 }: PalletChartProps) {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const containerRef = useChartReflow<HTMLDivElement>(chartRef);

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

      // ═══ X Ekseni: Palet Numarası ═════════════════════════════════════════
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

      // ═══ Y Ekseni: Ölçüm Değeri + SOL Etiketli Referans Çizgileri ════════
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: undefined },
        plotLines: [
          // Max → SOL etiket (SSL uyumu)
          {
            value: series.monitoringMax,
            color: "#ef4444",
            width: 2,
            dashStyle: "Solid",
            zIndex: 4,
            label: {
              text: "Max",
              align: "left",
              x: 5,
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "700" },
            },
          },
          // Mean → SOL etiket (SSL uyumu)
          {
            value: series.mean,
            color: "#f97316",
            width: 2,
            dashStyle: "Dash",
            zIndex: 4,
            label: {
              text: "Mean",
              align: "left",
              x: 5,
              style: { color: "#f97316", fontSize: "9px", fontWeight: "700" },
            },
          },
          // Min → SOL etiket (SSL uyumu)
          {
            value: series.monitoringMin,
            color: "#ef4444",
            width: 2,
            dashStyle: "Solid",
            zIndex: 4,
            label: {
              text: "Min",
              align: "left",
              x: 5,
              y: 14,
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "700" },
            },
          },
        ],
      },

      // ═══ Tooltip ══════════════════════════════════════════════════════════
      tooltip: {
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "12px" },
        formatter: function (this: any) {
          const custom = (this.point as any).custom;
          return (
            `<b>Value:</b> ${(this.y as number).toFixed(4)}<br/>` +
            `<span style="color:#8b949e">ProdID:</span> ${custom?.prodId ?? "-"}<br/>` +
            `<span style="color:#8b949e">Pallet:</span> ${custom?.pallet ?? this.x}`
          );
        },
      },

      legend: { enabled: false },

      // ═══ Boost: WebGL ile büyük nokta setleri ════════════════════════════
      boost: {
        useGPUTranslations: true,
        usePreallocated: true,
      },

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
          boostThreshold: 1000,
        },
      ],
    };
  }, [series, height]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
      />
    </div>
  );
}
