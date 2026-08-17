"use client";
// =============================================================================
// src/components/charts/spc/SpcAverageChart.tsx
// SPC Görünüm Modu — X-Bar Ortalama Grafiği
//
// Bu grafik SPC'nin temel görünümüdür. Vue'daki AverageChart.vue'nun karşılığı.
//
// Grafik Yapısı:
//   X ekseni: Grup index (1, 2, 3... — her nokta 200 ölçümün ortalaması)
//   Y ekseni:
//     plotBands (renkli alanlar):
//       - SARI geniş bant: monitoringMin ↔ monitoringMax
//       - YEŞİL dar bant:  lcl ↔ ucl
//     plotLines (referans çizgileri):
//       - monitoringMax: sarı çizgi (üst izleme limiti)
//       - ucl:           yeşil çizgi (kontrol üst limiti)
//       - mean:          kırmızı kesikli (genel ortalama)
//       - lcl:           yeşil çizgi (kontrol alt limiti)
//       - monitoringMin: sarı çizgi (alt izleme limiti)
//   Seri: grup ortalama değerleri (x-bar) — mavi çizgi
//
// plotBands vs plotLines:
//   plotBands = dolgulu renkli alan (from → to arasındaki bölge)
//   plotLines = tek bir değerde yatay çizgi
//   İkisi birlikte kullanılır: bant arka plan, çizgi sınırı vurgular.
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

      // ── X Ekseni: Grup Kategorileri ────────────────────────────────────
      xAxis: {
        categories,
        lineColor: "#30363d",
        tickColor: "#30363d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        crosshair: { color: "rgba(255,255,255,0.08)", width: 1 },
      },

      // ── Y Ekseni: Değerler + plotBands + plotLines ─────────────────────
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: null },

        // ── plotBands: Renkli dolgulu alanlar ─────────────────────────────
        // Bu yapı, Highcharts'ta Y eksenine paralel dolgu alanlarıdır.
        // "from" ve "to" değerleri Y eksenindeki koordinatları belirtir.
        // zIndex: bandın grafik elemanlarına göre sırası (düşük = arkada)
        plotBands: [
          // SARI geniş bant: monitoringMin ↔ monitoringMax
          // Tüm izleme aralığını gösterir — arkada, soluk sarı
          {
            from: series.monitoringMin,
            to:   series.monitoringMax,
            color: "rgba(234, 179, 8, 0.08)",    // soluk sarı
            zIndex: 1,
          },
          // YEŞİL dar bant: lcl ↔ ucl
          // Kontrol sınırlarını gösterir — sarı bandın önünde, soluk yeşil
          {
            from: series.lcl,
            to:   series.ucl,
            color: "rgba(34, 197, 94, 0.12)",    // soluk yeşil
            zIndex: 2,
          },
        ],

        // ── plotLines: Referans sınır çizgileri ───────────────────────────
        // Her limit için ayrı bir yatay çizgi.
        // Bant sınırlarını (from/to) görsel olarak çizgiyle vurgular.
        plotLines: [
          // Monitoring Max — Sarı üst izleme limiti
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
          // UCL — Yeşil kontrol üst limiti
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
          // Mean — Kırmızı kesikli genel ortalama
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
          // LCL — Yeşil kontrol alt limiti
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
          // Monitoring Min — Sarı alt izleme limiti
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
        formatter: function (this: Highcharts.TooltipFormatterContextObject) {
          const g = series.groups[this.point.index];
          const status =
            g.avg > series.ucl || g.avg < series.lcl
              ? `<span style="color:#ef4444">⚠ Out of Control</span>`
              : `<span style="color:#22c55e">✓ In Control</span>`;
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
            // Out-of-control noktaları kırmızı göster
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
            // UCL veya LCL dışına çıkan noktalar kırmızı işaretlenir
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
