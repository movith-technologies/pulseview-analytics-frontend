"use client";
// =============================================================================
// src/components/charts/individual/TimelineChart.tsx
// Individual Values — Zaman Serisi Çizgi Grafiği
//
// Highcharts'ta Next.js App Router entegrasyonunun kritik noktası:
//   1. "use client" direktifi ZORUNLU — Highcharts window.document kullanır.
//   2. HighchartsReact bileşeni otomatik olarak ref yönetimi yapar.
//   3. SSR sırasında Highcharts import'u yapılmaz (sunucu tarafı sorunu yok).
//
// Grafik Yapısı:
//   X ekseni: datetime — ISO tarih stringleri Unix timestamp'e çevrilir
//   Y ekseni: ham ölçüm değerleri + 3 referans çizgisi (plotLines)
//     - monitoringMax: Kırmızı, monitoring üst limiti
//     - mean:          Turuncu kesikli, ortalama
//     - monitoringMin: Siyah, monitoring alt limiti
//   Seri: turboThreshold: 30000 — büyük veri optimizasyonu
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
  // useMemo: veri değişmedikçe grafik seçenekleri yeniden hesaplanmaz.
  // Bu, React'in her render döngüsünde gereksiz yeniden çizimi önler.
  const options = useMemo((): Highcharts.Options => {
    // ISO string → Unix timestamp dönüşümü.
    // Highcharts datetime ekseni için milisaniye cinsinden değer bekler.
    const chartData = series.dataPoints.map((p) => [
      new Date(p.date).getTime(),
      p.value,
    ]);

    return {
      // ── Genel Ayarlar ──────────────────────────────────────────────────
      chart: {
        type: "line",
        height,
        backgroundColor: "transparent",  // Kart arka planı kullanılır
        animation: { duration: 400 },
        zooming: { type: "x" },           // X ekseninde yakınlaştırma
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
      },
      title:    { text: undefined },       // Başlık ChartCard'dan gelir
      credits:  { enabled: false },        // "Highcharts.com" yazısını gizle
      // ── Kaydırma çubuğu ve gezgin devre dışı ──────────────────────────
      scrollbar: { enabled: false },
      navigator: { enabled: false },
      rangeSelector: { enabled: false },

      // ── X Ekseni: Zaman ────────────────────────────────────────────────
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

      // ── Y Ekseni: Ölçüm Değerleri + Referans Çizgileri ────────────────
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: null },
        // ── plotLines: Referans sınır çizgileri ──────────────────────────
        // plotLines, grafik üzerine yatay (veya dikey) sabit çizgi çizer.
        // Her çizginin "value" alanı Y eksenindeki konumunu belirler.
        plotLines: [
          // Monitoring Max — Kırmızı üst limit
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
          // UCL — Yeşil kontrol üst limiti (daha ince)
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
          // Mean — Turuncu kesikli ortalama çizgisi
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
          // LCL — Yeşil kontrol alt limiti
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
          // Monitoring Min — Siyah alt limit
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

      // ── Tooltip: Fare üzerine gelince bilgi kutusu ─────────────────────
      tooltip: {
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "12px" },
        xDateFormat: "%Y-%m-%d %H:%M:%S",
        formatter: function (this: Highcharts.TooltipFormatterContextObject) {
          const date = new Date(this.x as number).toLocaleString("tr-TR");
          return `<b>${date}</b><br/>Value: <b>${(this.y as number).toFixed(4)}</b>`;
        },
      },

      // ── Gösterge ────────────────────────────────────────────────────────
      legend: { enabled: false },

      // ── Seri Seçenekleri ─────────────────────────────────────────────────
      plotOptions: {
        line: {
          lineWidth: 1.5,
          animation: false,   // Büyük veri setleri için animasyon kapatıldı
          marker: {
            enabled: chartData.length < 200,  // Az veri → nokta göster
            radius: 3,
          },
          states: { hover: { lineWidth: 2 } },
        },
      },

      // ── Veri Serisi ───────────────────────────────────────────────────────
      series: [
        {
          type: "line",
          name: series.measurementName,
          // turboThreshold: Highcharts varsayılan olarak 1000 üzeri veriyi
          // otomatik basitleştirir. 30000'e çıkararak bunu engelliyoruz.
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
