"use client";
// =============================================================================
// src/components/charts/compare/CompareChart.tsx
// Compare Analysis Multi-Series Line Chart
//
// Vue karşılığı: CompareAnalysisChart.vue
//
// Özellikler:
//   - useChartReflow: ResizeObserver ile otomatik reflow
//   - Datetime X ekseni (Unix ms, timezone offset uygulanmış)
//   - Multi-series: her ölçüm tipi farklı renkli çizgi
//   - Referans çizgileri: ilk serinin monitoringMax/Min/mean
//   - Shared tooltip: tüm serilerin değerlerini birlikte gösterir
//   - Mouse wheel zoom (Y ekseni)
//   - boostThreshold: 1000+ nokta için WebGL
//   - turboThreshold: 30000
// =============================================================================

import { useMemo, useRef } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { CompareSeries } from "@/types/spc";
import { useChartReflow } from "@/hooks/useChartReflow";

// ═══ Renk Paleti ═════════════════════════════════════════════════════════════
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

interface CompareChartProps {
  seriesArray: CompareSeries[];
  height?: number;
}

export function CompareChart({ seriesArray, height = 520 }: CompareChartProps) {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const containerRef = useChartReflow<HTMLDivElement>(chartRef);

  const options = useMemo((): Highcharts.Options => {
    if (seriesArray.length === 0) return {};

    const ref = seriesArray[0];

    const hcSeries: Highcharts.SeriesLineOptions[] = seriesArray.map(
      (s, idx): Highcharts.SeriesLineOptions => ({
        type: "line",
        name: s.measurementName,
        color: SERIES_COLORS[idx % SERIES_COLORS.length],
        turboThreshold: 30000,
        boostThreshold: 1000,
        lineWidth: 2.5,
        zIndex: 2,
        marker: {
          enabled: false,
          states: { hover: { enabled: true, radius: 5 } },
        },
        data: s.points.map((p) => ({
          x: p.x,
          y: p.y,
          custom: { pallet: p.pallet, date: p.date },
        })),
      })
    );

    return {
      chart: {
        type: "line",
        height,
        zoomType: "xy",
        backgroundColor: "transparent",
        animation: false,
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
        zooming: {
          mouseWheel: { enabled: true, type: "y" },
        },
      },
      title: { text: undefined },
      credits: { enabled: false },
      scrollbar: { enabled: false },

      // ═══ Boost: WebGL ile büyük nokta setleri ════════════════════════════
      boost: {
        useGPUTranslations: true,
        usePreallocated: true,
      },

      // ═══ X Ekseni: Zaman ══════════════════════════════════════════════════
      xAxis: {
        type: "datetime",
        lineColor: "#30363d",
        tickColor: "#30363d",
        gridLineColor: "#21262d",
        labels: {
          style: { color: "#8b949e", fontSize: "10px" },
          format: "{value:%H:%M}",
        },
        crosshair: { color: "rgba(255,255,255,0.1)", width: 1 },
      },

      // ═══ Y Ekseni: Değerler + Referans Çizgileri ═════════════════════════
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: undefined },
        opposite: false,

        plotLines: [
          {
            value: ref.monitoringMax,
            color: "#ef4444",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 5,
            label: {
              text: `Max ${ref.monitoringMax.toFixed(2)}`,
              align: "right",
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "600" },
            },
          },
          {
            value: ref.mean,
            color: "#f97316",
            width: 1.5,
            dashStyle: "Dash",
            zIndex: 5,
            label: {
              text: `Mean ${ref.mean.toFixed(2)}`,
              x: 40,
              style: { color: "#f97316", fontSize: "9px", fontWeight: "600" },
            },
          },
          {
            value: ref.monitoringMin,
            color: "#ef4444",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 5,
            label: {
              text: `Min ${ref.monitoringMin.toFixed(2)}`,
              align: "right",
              y: 15,
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "600" },
            },
          },
        ],
      },

      // ═══ Shared Tooltip ═══════════════════════════════════════════════════
      tooltip: {
        shared: true,
        crosshairs: true,
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "12px" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: function (this: any) {
          if (!this.points || this.points.length === 0) return "";

          let html = "";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.points.forEach((pt: any) => {
            const color = pt.series.color as string;
            html += `<span style="color:${color}">●</span> `;
            html += `${pt.series.name}: <b>${(pt.y as number).toFixed(4)}</b><br/>`;
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const firstPt = (this.points[0].point as any);
          const custom = firstPt?.custom as { pallet: number | null; date: string } | undefined;

          if (custom?.pallet != null) {
            html += `<span style="color:rgba(0,0,0,0)">●</span> Pallet: ${custom.pallet}<br/>`;
          }
          html += `<hr style="margin:4px 0; border-color:#30363d"/>`;
          html += `<span style="font-size:10px; color:#8b949e">${custom?.date ?? ""}</span>`;

          return html;
        },
      },

      legend: {
        enabled: true,
        itemStyle: { color: "#8b949e", fontSize: "11px" },
        itemHoverStyle: { color: "#e6edf3" },
      },

      plotOptions: {
        line: {
          animation: false,
          states: { hover: { lineWidth: 3 } },
          marker: { enabled: false },
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

      series: hcSeries,
    };
  }, [seriesArray, height]);

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

