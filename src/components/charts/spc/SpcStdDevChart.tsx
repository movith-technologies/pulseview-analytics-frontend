"use client";
// =============================================================================
// src/components/charts/spc/SpcStdDevChart.tsx
// SPC — Standart Sapma + Cp + Cpk Grafiği
//
// Vue karşılığı: StandardDeviationChart.vue
//
// Özellikler:
//   - useChartReflow: ResizeObserver ile otomatik reflow
//   - boostThreshold: 1000+ grup için WebGL hızlandırma
//   - İki Y ekseni: sol (sigma), sağ (Cp/Cpk)
//   - 3 seri: Standard Deviation (mavi), Cp (yeşil), Cpk (sarı)
//
// Cp ve Cpk Formülleri:
//   Cp  = (UCL - LCL) / (6 * sigma)
//   Cpk = min((UCL - mean) / (3 * sigma), (mean - LCL) / (3 * sigma))
// =============================================================================

import { useMemo, useRef } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { SpcSeries } from "@/types/spc";
import { useChartReflow } from "@/hooks/useChartReflow";

interface SpcStdDevChartProps {
  series: SpcSeries;
  height?: number;
}

export function SpcStdDevChart({ series, height = 300 }: SpcStdDevChartProps) {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const containerRef = useChartReflow<HTMLDivElement>(chartRef);

  const options = useMemo((): Highcharts.Options => {
    const categories = series.groups.map((g) => `G${g.groupIndex}`);
    const tolerance = series.ucl - series.lcl; // Toplam tolerans bandı

    // Her grup için Cp ve Cpk hesaplanır
    const sigmaData: number[] = [];
    const cpData:    number[] = [];
    const cpkData:   number[] = [];

    series.groups.forEach((g) => {
      sigmaData.push(g.sigma);

      if (g.sigma === 0) {
        cpData.push(Infinity);
        cpkData.push(Infinity);
        return;
      }

      const cp  = tolerance / (6 * g.sigma);
      const cpk = Math.min(
        (series.ucl - series.mean) / (3 * g.sigma),
        (series.mean - series.lcl) / (3 * g.sigma)
      );

      cpData.push(parseFloat(cp.toFixed(4)));
      cpkData.push(parseFloat(cpk.toFixed(4)));
    });

    return {
      chart: {
        height,
        backgroundColor: "transparent",
        animation: { duration: 400 },
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
      },
      title:   { text: undefined },
      credits: { enabled: false },

      xAxis: {
        categories,
        lineColor: "#30363d",
        tickColor: "#30363d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        crosshair: { color: "rgba(255,255,255,0.08)", width: 1 },
      },

      // ═══ İki Y Ekseni ═════════════════════════════════════════════════════
      yAxis: [
        // Birincil Y ekseni (sol) — Sigma değerleri
        {
          title: {
            text: "σ Std Dev",
            style: { color: "#3b82f6", fontSize: "10px" },
          },
          gridLineColor: "#21262d",
          labels: { style: { color: "#3b82f6", fontSize: "10px" } },
          plotLines: [
            {
              value: series.mean > 0 ? (series.ucl - series.lcl) / 6 : 0,
              color: "#60a5fa",
              width: 1,
              dashStyle: "Dash",
              zIndex: 4,
              label: {
                text: "Expected σ",
                style: { color: "#60a5fa", fontSize: "9px" },
              },
            },
          ],
        },
        // İkincil Y ekseni (sağ) — Cp ve Cpk değerleri
        {
          title: {
            text: "Cp / Cpk",
            style: { color: "#4ade80", fontSize: "10px" },
          },
          opposite: true,
          gridLineWidth: 0,
          labels: { style: { color: "#8b949e", fontSize: "10px" } },
          plotLines: [
            {
              value: 1.33,
              color: "#4ade80",
              width: 1,
              dashStyle: "ShortDot",
              zIndex: 4,
              label: {
                text: "Cp=1.33",
                align: "right",
                style: { color: "#4ade80", fontSize: "9px" },
              },
            },
          ],
        },
      ],

      tooltip: {
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "11px" },
        shared: true,
        formatter: function (this: any) {
          const i = (this.points?.[0]?.point?.index ?? 0);
          const g = series.groups[i];
          const cp  = cpData[i];
          const cpk = cpkData[i];
          const cpColor  = cp  >= 1.33 ? "#4ade80" : cp  >= 1.0 ? "#facc15" : "#f87171";
          const cpkColor = cpk >= 1.33 ? "#4ade80" : cpk >= 1.0 ? "#facc15" : "#f87171";

          return (
            `<b>Group ${g.groupIndex}</b><br/>` +
            `σ: <b>${g.sigma.toFixed(4)}</b><br/>` +
            `Cp: <b style="color:${cpColor}">${isFinite(cp) ? cp.toFixed(3) : "∞"}</b><br/>` +
            `Cpk: <b style="color:${cpkColor}">${isFinite(cpk) ? cpk.toFixed(3) : "∞"}</b>`
          );
        },
      },

      legend: {
        enabled: true,
        itemStyle: { color: "#8b949e", fontSize: "11px" },
        itemHoverStyle: { color: "#e6edf3" },
      },

      plotOptions: {
        line: {
          lineWidth: 2,
          marker: { enabled: true, radius: 3 },
        },
      },

      series: [
        // Standart Sapma — Sol Y ekseni, mavi
        {
          type: "line",
          name: "Std Dev (σ)",
          yAxis: 0,
          color: "#3b82f6",
          data: sigmaData,
          zIndex: 3,
          boostThreshold: 1000,
        },
        // Cp — Sağ Y ekseni, yeşil
        {
          type: "line",
          name: "Cp",
          yAxis: 1,
          color: "#4ade80",
          dashStyle: "ShortDash",
          data: cpData.map((v) => (isFinite(v) ? v : null)),
          zIndex: 2,
        },
        // Cpk — Sağ Y ekseni, sarı
        {
          type: "line",
          name: "Cpk",
          yAxis: 1,
          color: "#facc15",
          dashStyle: "Dot",
          data: cpkData.map((v) => (isFinite(v) ? v : null)),
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
      />
    </div>
  );
}




