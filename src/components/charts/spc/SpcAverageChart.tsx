"use client";
// =============================================================================
// src/components/charts/spc/SpcAverageChart.tsx
// SPC GÃ¶rÃ¼nÃ¼m Modu â€” X-Bar Ortalama GrafiÄŸi
//
// Bu grafik SPC'nin temel gÃ¶rÃ¼nÃ¼mÃ¼dÃ¼r. Vue'daki AverageChart.vue'nun karÅŸÄ±lÄ±ÄŸÄ±.
//
// Grafik YapÄ±sÄ±:
//   X ekseni: Grup index (1, 2, 3... â€” her nokta 200 Ã¶lÃ§Ã¼mÃ¼n ortalamasÄ±)
//   Y ekseni:
//     plotBands (renkli alanlar):
//       - SARI geniÅŸ bant: monitoringMin â†” monitoringMax
//       - YEÅÄ°L dar bant:  lcl â†” ucl
//     plotLines (referans Ã§izgileri):
//       - monitoringMax: sarÄ± Ã§izgi (Ã¼st izleme limiti)
//       - ucl:           yeÅŸil Ã§izgi (kontrol Ã¼st limiti)
//       - mean:          kÄ±rmÄ±zÄ± kesikli (genel ortalama)
//       - lcl:           yeÅŸil Ã§izgi (kontrol alt limiti)
//       - monitoringMin: sarÄ± Ã§izgi (alt izleme limiti)
//   Seri: grup ortalama deÄŸerleri (x-bar) â€” mavi Ã§izgi
//
// plotBands vs plotLines:
//   plotBands = dolgulu renkli alan (from â†’ to arasÄ±ndaki bÃ¶lge)
//   plotLines = tek bir deÄŸerde yatay Ã§izgi
//   Ä°kisi birlikte kullanÄ±lÄ±r: bant arka plan, Ã§izgi sÄ±nÄ±rÄ± vurgular.
// =============================================================================

import { useMemo } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { SpcSeries } from "@/types/spc";

interface SpcAverageChartProps {
  series: SpcSeries;
  height?: number;
}

export function SpcAverageChart({ series, height = 300 }: SpcAverageChartProps) {
  const options = useMemo((): Highcharts.Options => {
    const avgData = series.groups.map((g) => g.avg);
    const categories = series.groups.map((g) => `G${g.groupIndex}`);

    return {
      chart: {
        type: "line",
        height,
        backgroundColor: "transparent",
        animation: { duration: 400 },
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
      },
      title:   { text: undefined },
      credits: { enabled: false },

      // â”€â”€ X Ekseni: Grup Kategorileri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      xAxis: {
        categories,
        lineColor: "#30363d",
        tickColor: "#30363d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        crosshair: { color: "rgba(255,255,255,0.08)", width: 1 },
      },

      // â”€â”€ Y Ekseni: DeÄŸerler + plotBands + plotLines â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: undefined },

        // â”€â”€ plotBands: Renkli dolgulu alanlar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // Bu yapÄ±, Highcharts'ta Y eksenine paralel dolgu alanlarÄ±dÄ±r.
        // "from" ve "to" deÄŸerleri Y eksenindeki koordinatlarÄ± belirtir.
        // zIndex: bandÄ±n grafik elemanlarÄ±na gÃ¶re sÄ±rasÄ± (dÃ¼ÅŸÃ¼k = arkada)
        plotBands: [
          // SARI geniÅŸ bant: monitoringMin â†” monitoringMax
          // TÃ¼m izleme aralÄ±ÄŸÄ±nÄ± gÃ¶sterir â€” arkada, soluk sarÄ±
          {
            from: series.monitoringMin,
            to:   series.monitoringMax,
            color: "rgba(234, 179, 8, 0.08)",    // soluk sarÄ±
            zIndex: 1,
          },
          // YEÅÄ°L dar bant: lcl â†” ucl
          // Kontrol sÄ±nÄ±rlarÄ±nÄ± gÃ¶sterir â€” sarÄ± bandÄ±n Ã¶nÃ¼nde, soluk yeÅŸil
          {
            from: series.lcl,
            to:   series.ucl,
            color: "rgba(34, 197, 94, 0.12)",    // soluk yeÅŸil
            zIndex: 2,
          },
        ],

        // â”€â”€ plotLines: Referans sÄ±nÄ±r Ã§izgileri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // Her limit iÃ§in ayrÄ± bir yatay Ã§izgi.
        // Bant sÄ±nÄ±rlarÄ±nÄ± (from/to) gÃ¶rsel olarak Ã§izgiyle vurgular.
        plotLines: [
          // Monitoring Max â€” SarÄ± Ã¼st izleme limiti
          {
            value: series.monitoringMax,
            color: "#eab308",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 5,
            label: {
              text: `Mon.Max ${series.monitoringMax.toFixed(2)}`,
              align: "right",
              style: { color: "#eab308", fontSize: "9px", fontWeight: "600" },
            },
          },
          // UCL â€” YeÅŸil kontrol Ã¼st limiti
          {
            value: series.ucl,
            color: "#22c55e",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 5,
            label: {
              text: `UCL ${series.ucl.toFixed(2)}`,
              align: "right",
              style: { color: "#22c55e", fontSize: "9px", fontWeight: "600" },
            },
          },
          // Mean â€” KÄ±rmÄ±zÄ± kesikli genel ortalama
          {
            value: series.mean,
            color: "#ef4444",
            width: 1.5,
            dashStyle: "Dash",
            zIndex: 5,
            label: {
              text: `Mean ${series.mean.toFixed(2)}`,
              x: 40,
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "600" },
            },
          },
          // LCL â€” YeÅŸil kontrol alt limiti
          {
            value: series.lcl,
            color: "#22c55e",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 5,
            label: {
              text: `LCL ${series.lcl.toFixed(2)}`,
              align: "right",
              y: 12,
              style: { color: "#22c55e", fontSize: "9px", fontWeight: "600" },
            },
          },
          // Monitoring Min â€” SarÄ± alt izleme limiti
          {
            value: series.monitoringMin,
            color: "#eab308",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 5,
            label: {
              text: `Mon.Min ${series.monitoringMin.toFixed(2)}`,
              align: "right",
              y: 12,
              style: { color: "#eab308", fontSize: "9px", fontWeight: "600" },
            },
          },
        ],
      },

      tooltip: {
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "12px" },
        formatter: function (this: any) {
          const g = series.groups[this.point.index];
          const status =
            g.avg > series.ucl || g.avg < series.lcl
              ? `<span style="color:#ef4444">âš  Out of Control</span>`
              : `<span style="color:#22c55e">âœ“ In Control</span>`;
          return (
            `<b>Group ${g.groupIndex}</b><br/>` +
            `Average: <b>${g.avg.toFixed(4)}</b><br/>` +
            `UCL: ${series.ucl.toFixed(2)} | LCL: ${series.lcl.toFixed(2)}<br/>` +
            status
          );
        },
      },

      legend: { enabled: false },

      plotOptions: {
        line: {
          lineWidth: 2,
          marker: {
            enabled: true,
            radius: 4,
            symbol: "circle",
            // Out-of-control noktalarÄ± kÄ±rmÄ±zÄ± gÃ¶ster
            states: { hover: { radius: 6 } },
          },
        },
      },

      series: [
        {
          type: "line",
          name: "X-Bar (Average)",
          color: "#3b82f6",
          zIndex: 3,
          data: avgData.map((avg, i) => ({
            y: avg,
            // UCL veya LCL dÄ±ÅŸÄ±na Ã§Ä±kan noktalar kÄ±rmÄ±zÄ± iÅŸaretlenir
            marker: {
              fillColor:
                avg > series.ucl || avg < series.lcl ? "#ef4444" : undefined,
              radius:
                avg > series.ucl || avg < series.lcl ? 6 : 4,
            },
          })),
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


