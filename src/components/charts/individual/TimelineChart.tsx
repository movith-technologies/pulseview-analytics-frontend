"use client";
// =============================================================================
// src/components/charts/individual/TimelineChart.tsx
// Individual Values — Değerler Grafiği (Control Chart)
//
// Vue karşılığı: ControlChart.vue
//
// SSL Dokümanı (Section 2.2.1) uyumu:
//   - X ekseni: DATETIME — zaman serisi (14:00, 00:00...) gösterir
//   - Y ekseni solunda: Max, Mean, Min etiketleri (SOL hizalı)
//   - Sadece 3 ana referans çizgisi: Max (monitoring), Mean, Min (monitoring)
//   - UCL/LCL de ek çizgi olarak eklenir (yeşil kesikli)
//
// Özellikler:
//   - useChartReflow: ResizeObserver ile otomatik reflow
//   - turboThreshold: 30000 + boostThreshold: 1000
//   - Zoom: X ekseninde fare ile yakınlaştırma
// =============================================================================

import { useMemo, useRef } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { IndividualValueSeries } from "@/types/spc";
import { useChartReflow } from "@/hooks/useChartReflow";

interface TimelineChartProps {
  series: IndividualValueSeries;
  height?: number;
}

export function TimelineChart({ series, height = 300 }: TimelineChartProps) {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const containerRef = useChartReflow<HTMLDivElement>(chartRef);

  const options = useMemo((): Highcharts.Options => {
    // X: timestamp (ms), Y: ölçüm değeri — SSL dokümanı datetime X ekseni gösteriyor
    const chartData: [number, number][] = series.dataPoints.map((p) => [
      new Date(p.date).getTime(),
      p.value,
    ]);

    return {
      // ═══ Genel Ayarlar ═══════════════════════════════════════════════════
      chart: {
        type: "line",
        height,
        backgroundColor: "transparent",
        animation: { duration: 400 },
        zooming: { type: "x" },
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
        events: {
          load() { this.reflow(); },
        },
      },
      title:      { text: undefined },
      credits:    { enabled: false },
      scrollbar:  { enabled: false },
      navigator:  { enabled: false },
      rangeSelector: { enabled: false },

      // ═══ X Ekseni: Datetime ════════════════════════════════════════════════
      // SSL dokümanında X ekseninde "14:00, 00:00, 14:00, 07:00" gibi saatler var
      xAxis: {
        type: "datetime",
        lineColor: "#30363d",
        tickColor: "#30363d",
        labels: {
          style: { color: "#8b949e", fontSize: "10px" },
          format: "{value:%H:%M}",
        },
        crosshair: { color: "rgba(255,255,255,0.1)", width: 1 },
      },

      // ═══ Y Ekseni: Sol tarafta etiketli referans çizgileri ════════════════
      // SSL dokümanı: Max, Mean, Min etiketleri SOL tarafta (align: "left")
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: undefined },
        plotLines: [
          // Max → Kırmızı üst monitoring limiti (SOL etiket)
          {
            value: series.monitoringMax,
            color: "#ef4444",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 4,
            label: {
              text: `Max`,
              align: "left",
              x: 5,
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "700" },
            },
          },
          // UCL → Yeşil kontrol üst limiti (kesikli, sol etiket)
          {
            value: series.ucl,
            color: "#22c55e",
            width: 1,
            dashStyle: "ShortDash",
            zIndex: 3,
            label: {
              text: `UCL`,
              align: "left",
              x: 5,
              style: { color: "#22c55e", fontSize: "9px" },
            },
          },
          // Mean → Turuncu kesikli ortalama (SOL etiket)
          {
            value: series.mean,
            color: "#f97316",
            width: 1.5,
            dashStyle: "Dash",
            zIndex: 4,
            label: {
              text: `Mean`,
              align: "left",
              x: 5,
              style: { color: "#f97316", fontSize: "9px", fontWeight: "700" },
            },
          },
          // LCL → Yeşil kontrol alt limiti (kesikli, sol etiket)
          {
            value: series.lcl,
            color: "#22c55e",
            width: 1,
            dashStyle: "ShortDash",
            zIndex: 3,
            label: {
              text: `LCL`,
              align: "left",
              x: 5,
              y: 12,
              style: { color: "#22c55e", fontSize: "9px" },
            },
          },
          // Min → Alt monitoring limiti (SOL etiket)
          {
            value: series.monitoringMin,
            color: "#ef4444",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 4,
            label: {
              text: `Min`,
              align: "left",
              x: 5,
              y: 12,
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
          const dateStr = Highcharts.dateFormat("%d.%m.%Y %H:%M:%S", this.x as number);
          return (
            `<b>${dateStr}</b><br/>` +
            `Value: <b>${(this.y as number).toFixed(4)}</b>`
          );
        },
      },

      legend: { enabled: false },

      // ═══ Seri Seçenekleri ════════════════════════════════════════════════
      plotOptions: {
        line: {
          lineWidth: 1.5,
          animation: false,
          marker: {
            enabled: chartData.length < 200,
            radius: 3,
          },
          states: { hover: { lineWidth: 2 } },
        },
      },

      // ═══ Veri Serisi ══════════════════════════════════════════════════════
      series: [
        {
          type: "line",
          name: series.measurementName,
          turboThreshold: 30000,
          boostThreshold: 1000,
          color: "#3b82f6",
          data: chartData,
          zIndex: 2,
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
        immutable={false}
      />
    </div>
  );
}
