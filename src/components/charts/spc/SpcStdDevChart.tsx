"use client";
// =============================================================================
// src/components/charts/spc/SpcStdDevChart.tsx
// SPC GÃ¶rÃ¼nÃ¼m Modu â€” Standart Sapma + Cp + Cpk GrafiÄŸi
//
// Vue'daki StandardDeviationChart.vue'nun karÅŸÄ±lÄ±ÄŸÄ±.
//
// Grafik YapÄ±sÄ±:
//   X ekseni: Grup index (G1, G2, G3...)
//   Birincil Y Ekseni (sol): Standart Sapma deÄŸerleri
//   Ä°kincil Y Ekseni (saÄŸ): Cp ve Cpk deÄŸerleri
//
// 3 Seri:
//   1. Standard Deviation (mavi) â€” her grubun sigma deÄŸeri
//   2. Cp (yeÅŸil) â€” sÃ¼reÃ§ yeterliliÄŸi
//   3. Cpk (sarÄ±) â€” merkezli sÃ¼reÃ§ yeterliliÄŸi
//
// Cp ve Cpk FormÃ¼lleri:
//   Cp  = (UCL - LCL) / (6 Ã— sigma)
//        â†’ SÃ¼reÃ§ tolerans bandÄ±na sÄ±ÄŸÄ±yor mu?
//        â†’ 1.33 Ã¼zeri â†’ yeterli, 1.67 Ã¼zeri â†’ mÃ¼kemmel
//   Cpk = min((UCL - mean) / (3 Ã— sigma), (mean - LCL) / (3 Ã— sigma))
//        â†’ SÃ¼reÃ§ hem toleransa sÄ±ÄŸÄ±yor hem de ortalanmÄ±ÅŸ mÄ±?
//        â†’ Cpk < Cp ise sÃ¼reÃ§ merkezi kaymÄ±ÅŸ demektir.
// =============================================================================

import { useMemo } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { SpcSeries } from "@/types/spc";

interface SpcStdDevChartProps {
  series: SpcSeries;
  height?: number;
}

export function SpcStdDevChart({ series, height = 300 }: SpcStdDevChartProps) {
  const options = useMemo((): Highcharts.Options => {
    const categories = series.groups.map((g) => `G${g.groupIndex}`);
    const tolerance = series.ucl - series.lcl; // Toplam tolerans bandÄ±

    // Her grup iÃ§in Cp ve Cpk hesaplanÄ±r
    const sigmaData: number[] = [];
    const cpData:    number[] = [];
    const cpkData:   number[] = [];

    series.groups.forEach((g) => {
      sigmaData.push(g.sigma);

      if (g.sigma === 0) {
        // Sigma 0 ise (tÃ¼m Ã¶lÃ§Ã¼mler eÅŸit) tanÄ±msÄ±z â†’ maksimum deÄŸer koy
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

    // Cp/Cpk'nÄ±n ortalama deÄŸerlerini badge iÃ§in hesapla
    const validCp  = cpData.filter(isFinite);
    const validCpk = cpkData.filter(isFinite);
    const avgCp    = validCp.length  ? validCp.reduce((a, b)  => a + b, 0) / validCp.length  : 0;
    const avgCpk   = validCpk.length ? validCpk.reduce((a, b) => a + b, 0) / validCpk.length : 0;

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

      // â”€â”€ Ä°ki Y Ekseni: sol (sigma) + saÄŸ (Cp/Cpk) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Highcharts'ta birden fazla Y ekseni tanÄ±mlanabilir.
      // Her seri "yAxis: 0" veya "yAxis: 1" ile hangi eksene baÄŸlandÄ±ÄŸÄ±nÄ± belirtir.
      yAxis: [
        // Birincil Y ekseni (sol) â€” Sigma deÄŸerleri
        {
          title: {
            text: "Ïƒ Std Dev",
            style: { color: "#3b82f6", fontSize: "10px" },
          },
          gridLineColor: "#21262d",
          labels: { style: { color: "#3b82f6", fontSize: "10px" } },
          // Referans Ã§izgisi: sigma'nÄ±n beklenen Ã¼st sÄ±nÄ±rÄ±
          plotLines: [
            {
              value: series.mean > 0 ? (series.ucl - series.lcl) / 6 : 0,
              color: "#60a5fa",
              width: 1,
              dashStyle: "Dash",
              zIndex: 4,
              label: {
                text: "Expected Ïƒ",
                style: { color: "#60a5fa", fontSize: "9px" },
              },
            },
          ],
        },
        // Ä°kincil Y ekseni (saÄŸ) â€” Cp ve Cpk deÄŸerleri
        {
          title: {
            text: "Cp / Cpk",
            style: { color: "#4ade80", fontSize: "10px" },
          },
          opposite: true,         // SaÄŸ tarafa yerleÅŸtirir
          gridLineWidth: 0,       // Ä°kinci eksen grid Ã§izgisi gÃ¶sterme
          labels: { style: { color: "#8b949e", fontSize: "10px" } },
          // Cp â‰¥ 1.33 = yeterli sÄ±nÄ±r â€” kÄ±lavuz Ã§izgisi
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
        shared: true,             // Birden fazla seri â€” tek tooltip'te gÃ¶ster
        formatter: function (this: any) {
          const i = (this.points?.[0]?.point.index ?? 0);
          const g = series.groups[i];
          const cp  = cpData[i];
          const cpk = cpkData[i];
          const cpColor  = cp  >= 1.33 ? "#4ade80" : cp  >= 1.0 ? "#facc15" : "#f87171";
          const cpkColor = cpk >= 1.33 ? "#4ade80" : cpk >= 1.0 ? "#facc15" : "#f87171";

          return (
            `<b>Group ${g.groupIndex}</b><br/>` +
            `Ïƒ: <b>${g.sigma.toFixed(4)}</b><br/>` +
            `Cp: <b style="color:${cpColor}">${isFinite(cp) ? cp.toFixed(3) : "âˆ"}</b><br/>` +
            `Cpk: <b style="color:${cpkColor}">${isFinite(cpk) ? cpk.toFixed(3) : "âˆ"}</b>`
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
        // Standart Sapma â€” Sol Y ekseni, mavi
        {
          type: "line",
          name: "Std Dev (Ïƒ)",
          yAxis: 0,             // Birincil (sol) eksene baÄŸlÄ±
          color: "#3b82f6",
          data: sigmaData,
          zIndex: 3,
        },
        // Cp â€” SaÄŸ Y ekseni, yeÅŸil
        {
          type: "line",
          name: "Cp",
          yAxis: 1,             // Ä°kincil (saÄŸ) eksene baÄŸlÄ±
          color: "#4ade80",
          dashStyle: "ShortDash",
          data: cpData.map((v) => (isFinite(v) ? v : null)),
          zIndex: 2,
        },
        // Cpk â€” SaÄŸ Y ekseni, sarÄ±
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
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
    />
  );
}


