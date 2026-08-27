"use client";
// =============================================================================
// src/components/charts/compare/CompareChart.tsx
// Compare Analysis Multi-Series Line Chart
//
// Vue karşılığı: CompareAnalysisChart.vue
// SSL Dokümanı (Section 2.2.4) uyumu:
//   - PlotLine etiketleri SOL tarafta (align: "left", x: 5)
//   - Etiketler: Max, Mean, Min (sol tarafta kırmızı/turuncu)
//   - X ekseni: datetime (06:00, 13:30...)
//   - Legend alt tarafta seri isimleri
//
// Özellikler:
//   - useChartReflow: ResizeObserver ile otomatik reflow
//   - boostThreshold: 1000+ nokta için WebGL
//   - Shared tooltip ile tüm serilerin değerleri birlikte
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

      // ═══ X Ekseni: Datetime (SSL: 06:00, 13:30...) ═══════════════════════
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

      // ═══ Y Ekseni: SOL Etiketli Referans Çizgileri (SSL uyumu) ═══════════
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: undefined },
        opposite: false,

        plotLines: [
          // Max → SOL etiket
          {
            value: ref.monitoringMax,
            color: "#ef4444",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 5,
            label: {
              text: "Max",
              align: "left",
              x: 5,
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "700" },
            },
          },
          // Mean → SOL etiket
          {
            value: ref.mean,
            color: "#f97316",
            width: 1.5,
            dashStyle: "Dash",
            zIndex: 5,
            label: {
              text: "Mean",
              align: "left",
              x: 5,
              style: { color: "#f97316", fontSize: "9px", fontWeight: "700" },
            },
          },
          // Min → SOL etiket
          {
            value: ref.monitoringMin,
            color: "#ef4444",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 5,
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

      // ═══ Shared Tooltip ═══════════════════════════════════════════════════
      tooltip: {
        shared: true,
        crosshairs: true,
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "12px" },
        formatter: function (this: any) {
          if (!this.points || this.points.length === 0) return "";

          let html = "";
          this.points.forEach((pt: any) => {
            const color = pt.series.color as string;
            html += `<span style="color:${color}">●</span> `;
            html += `${pt.series.name}: <b>${(pt.y as number).toFixed(4)}</b><br/>`;
          });

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

      // ═══ Legend: Alt tarafta seri isimleri (SSL uyumu) ═══════════════════
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "bottom",
        layout: "horizontal",
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
