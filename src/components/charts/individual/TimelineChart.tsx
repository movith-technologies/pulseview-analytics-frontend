"use client";
// =============================================================================
// src/components/charts/individual/TimelineChart.tsx
// Individual Values — Zaman Serisi Grafiği (Timeline / Control Chart)
//
// Vue karşılığı: ControlChart.vue
// Veri akışı: IndividualValueSeries → Highcharts line (Stock chart)
//
// Özellikler:
//   - useChartReflow: ResizeObserver ile otomatik reflow
//   - turboThreshold: 30000 → büyük veri optimizasyonu
//   - Boost modülü (providers.tsx'te başlatılır): 30k+ nokta için WebGL
//   - plotLines: UCL, LCL, Mean, monitoringMax, monitoringMin referans çizgileri
//   - Zoom: X ekseninde fare ile yakınlaştırma (zooming.type: "x")
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
  // Highcharts chart instance'ına erişim için ref
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  // ResizeObserver ile otomatik reflow — container boyutu değiştiğinde tetiklenir
  const containerRef = useChartReflow<HTMLDivElement>(chartRef);

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
      // ═══ Genel Ayarlar ════════════════════════════════════════════════════
      chart: {
        type: "line",
        height,
        backgroundColor: "transparent",
        animation: { duration: 400 },
        zooming: { type: "x" },
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
        // reflow() için panelin her boyutlandırılmasında çalışır
        events: {
          load() {
            // İlk yüklemede container boyutuna sığdır
            this.reflow();
          },
        },
      },
      title:    { text: undefined },       // Başlık ChartCard'dan gelir
      credits:  { enabled: false },        // "Highcharts.com" yazısını gizle
      // ═══ Kaydırma Çubuğu ve Gezgin Devre Dışı ════════════════════════════
      scrollbar: { enabled: false },
      navigator: { enabled: false },
      rangeSelector: { enabled: false },

      // ═══ X Ekseni: Zaman ══════════════════════════════════════════════════
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

      // ═══ Y Ekseni: Ölçüm Değerleri + Referans Çizgileri ═════════════════
      yAxis: {
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        title: { text: undefined },
        // ─── plotLines: Referans sınır çizgileri ──────────────────────────
        plotLines: [
          // Monitoring Max → Kırmızı üst limit
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
          // UCL → Yeşil kontrol üst limiti (daha ince)
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
          // Mean → Turuncu kesikli ortalama çizgisi
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
          // LCL → Yeşil kontrol alt limiti
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
          // Monitoring Min → Alt limit
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

      // ═══ Tooltip: Fare üzerine gelince bilgi kutusu ═══════════════════════
      tooltip: {
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "12px" },
        xDateFormat: "%Y-%m-%d %H:%M:%S",
        formatter: // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function (this: any) {
          const date = new Date(this.x as number).toLocaleString("tr-TR");
          return `<b>${date}</b><br/>Value: <b>${(this.y as number).toFixed(4)}</b>`;
        },
      },

      // ═══ Gösterge ════════════════════════════════════════════════════════
      legend: { enabled: false },

      // ═══ Seri Seçenekleri ════════════════════════════════════════════════
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

      // ═══ Veri Serisi ══════════════════════════════════════════════════════
      series: [
        {
          type: "line",
          name: series.measurementName,
          // turboThreshold: Highcharts varsayılan olarak 1000 üzeri veriyi
          // otomatik basitleştirir. 30000'e çıkararak bunu engelliyoruz.
          // Boost modülü (WebGL) bu eşiğin üzerindeki veriyi GPU'da işler.
          turboThreshold: 30000,
          color: "#3b82f6",
          data: chartData,
          zIndex: 2,
          // Boost: 1000+ nokta için WebGL hızlandırma
          // (providers.tsx'te initHighcharts() ile aktifleştirilir)
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
        immutable={false}
      />
    </div>
  );
}


