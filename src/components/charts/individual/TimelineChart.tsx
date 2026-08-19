"use client";
// =============================================================================
// src/components/charts/individual/TimelineChart.tsx
// Individual Values â€” Zaman Serisi Ã‡izgi GrafiÄŸi
//
// Highcharts'ta Next.js App Router entegrasyonunun kritik noktasÄ±:
//   1. "use client" direktifi ZORUNLU â€” Highcharts window.document kullanÄ±r.
//   2. HighchartsReact bileÅŸeni otomatik olarak ref yÃ¶netimi yapar.
//   3. SSR sÄ±rasÄ±nda Highcharts import'u yapÄ±lmaz (sunucu tarafÄ± sorunu yok).
//
// Grafik YapÄ±sÄ±:
//   X ekseni: datetime â€” ISO tarih stringleri Unix timestamp'e Ã§evrilir
//   Y ekseni: ham Ã¶lÃ§Ã¼m deÄŸerleri + 3 referans Ã§izgisi (plotLines)
//     - monitoringMax: KÄ±rmÄ±zÄ±, monitoring Ã¼st limiti
//     - mean:          Turuncu kesikli, ortalama
//     - monitoringMin: Siyah, monitoring alt limiti
//   Seri: turboThreshold: 30000 â€” bÃ¼yÃ¼k veri optimizasyonu
// =============================================================================

import { useMemo } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { IndividualValueSeries } from "@/types/spc";

interface TimelineChartProps {
  series: IndividualValueSeries;
  height?: number;
}

export function TimelineChart({ series, height = 300 }: TimelineChartProps) {
  // useMemo: veri deÄŸiÅŸmedikÃ§e grafik seÃ§enekleri yeniden hesaplanmaz.
  // Bu, React'in her render dÃ¶ngÃ¼sÃ¼nde gereksiz yeniden Ã§izimi Ã¶nler.
  const options = useMemo((): Highcharts.Options => {
    // ISO string â†’ Unix timestamp dÃ¶nÃ¼ÅŸÃ¼mÃ¼.
    // Highcharts datetime ekseni iÃ§in milisaniye cinsinden deÄŸer bekler.
    const chartData = series.dataPoints.map((p) => [
      new Date(p.date).getTime(),
      p.value,
    ]);

    return {
      // â”€â”€ Genel Ayarlar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      chart: {
        type: "line",
        height,
        backgroundColor: "transparent",  // Kart arka planÄ± kullanÄ±lÄ±r
        animation: { duration: 400 },
        zooming: { type: "x" },           // X ekseninde yakÄ±nlaÅŸtÄ±rma
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
      },
      title:    { text: undefined },       // BaÅŸlÄ±k ChartCard'dan gelir
      credits:  { enabled: false },        // "Highcharts.com" yazÄ±sÄ±nÄ± gizle
      // â”€â”€ KaydÄ±rma Ã§ubuÄŸu ve gezgin devre dÄ±ÅŸÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      scrollbar: { enabled: false },
      navigator: { enabled: false },
      rangeSelector: { enabled: false },

      // â”€â”€ X Ekseni: Zaman â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ Y Ekseni: Ã–lÃ§Ã¼m DeÄŸerleri + Referans Ã‡izgileri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: undefined },
        // â”€â”€ plotLines: Referans sÄ±nÄ±r Ã§izgileri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // plotLines, grafik Ã¼zerine yatay (veya dikey) sabit Ã§izgi Ã§izer.
        // Her Ã§izginin "value" alanÄ± Y eksenindeki konumunu belirler.
        plotLines: [
          // Monitoring Max â€” KÄ±rmÄ±zÄ± Ã¼st limit
          {
            value: series.monitoringMax,
            color: "#ef4444",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 4,
            label: {
              text: `Max ${series.monitoringMax.toFixed(2)}`,
              align: "right",
              style: { color: "#ef4444", fontSize: "9px", fontWeight: "600" },
            },
          },
          // UCL â€” YeÅŸil kontrol Ã¼st limiti (daha ince)
          {
            value: series.ucl,
            color: "#22c55e",
            width: 1,
            dashStyle: "ShortDash",
            zIndex: 3,
            label: {
              text: `UCL ${series.ucl.toFixed(2)}`,
              align: "right",
              style: { color: "#22c55e", fontSize: "9px" },
            },
          },
          // Mean â€” Turuncu kesikli ortalama Ã§izgisi
          {
            value: series.mean,
            color: "#f97316",
            width: 1.5,
            dashStyle: "Dash",
            zIndex: 4,
            label: {
              text: `Mean ${series.mean.toFixed(2)}`,
              x: 40,
              style: { color: "#f97316", fontSize: "9px", fontWeight: "600" },
            },
          },
          // LCL â€” YeÅŸil kontrol alt limiti
          {
            value: series.lcl,
            color: "#22c55e",
            width: 1,
            dashStyle: "ShortDash",
            zIndex: 3,
            label: {
              text: `LCL ${series.lcl.toFixed(2)}`,
              align: "right",
              y: 12,
              style: { color: "#22c55e", fontSize: "9px" },
            },
          },
          // Monitoring Min â€” Siyah alt limit
          {
            value: series.monitoringMin,
            color: "#1f2937",
            width: 1.5,
            dashStyle: "Solid",
            zIndex: 4,
            label: {
              text: `Min ${series.monitoringMin.toFixed(2)}`,
              align: "right",
              y: 12,
              style: { color: "#94a3b8", fontSize: "9px", fontWeight: "600" },
            },
          },
        ],
      },

      // â”€â”€ Tooltip: Fare Ã¼zerine gelince bilgi kutusu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      tooltip: {
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "12px" },
        xDateFormat: "%Y-%m-%d %H:%M:%S",
        formatter: function (this: any) {
          const date = new Date(this.x as number).toLocaleString("tr-TR");
          return `<b>${date}</b><br/>Value: <b>${(this.y as number).toFixed(4)}</b>`;
        },
      },

      // â”€â”€ GÃ¶sterge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      legend: { enabled: false },

      // â”€â”€ Seri SeÃ§enekleri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      plotOptions: {
        line: {
          lineWidth: 1.5,
          animation: false,   // BÃ¼yÃ¼k veri setleri iÃ§in animasyon kapatÄ±ldÄ±
          marker: {
            enabled: chartData.length < 200,  // Az veri â†’ nokta gÃ¶ster
            radius: 3,
          },
          states: { hover: { lineWidth: 2 } },
        },
      },

      // â”€â”€ Veri Serisi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      series: [
        {
          type: "line",
          name: series.measurementName,
          // turboThreshold: Highcharts varsayÄ±lan olarak 1000 Ã¼zeri veriyi
          // otomatik basitleÅŸtirir. 30000'e Ã§Ä±kararak bunu engelliyoruz.
          turboThreshold: 30000,
          color: "#3b82f6",
          data: chartData,
          zIndex: 2,
        },
      ],
    };
  }, [series, height]);

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      immutable={false}
    />
  );
}


