"use client";
// =============================================================================
// src/components/charts/individual/HistogramChart.tsx
// Individual Values — Frekans Dağılımı Yatay Bar Grafiği
//
// Histogram Mantığı (Highcharts tarafında yapılır):
//   1. Veri noktaları [monitoringMin, monitoringMax] aralığında dağılır.
//   2. Bu aralık eşit genişlikte BUCKET_COUNT (varsayılan 15) dilime bölünür.
//   3. Her veri noktası hangi dilime düştüğüne bakılır → o dilimin sayacı artar.
//   4. Sonuç: [{ name: "350k–360k", y: 42 }, ...] formatında veri dizisi.
//   5. Highcharts `bar` tipi (yatay) ile bu veri görselleştirilir.
//
// Renk Kodlaması:
//   - UCL'nin üstünde → kırmızı (control dışı, yüksek)
//   - LCL'nin altında → kırmızı (control dışı, düşük)
//   - UCL-LCL arası  → yeşil (kontrol içi)
//   - monitoringMax/Min dışı → koyu kırmızı (kritik)
// =============================================================================

import { useMemo } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { IndividualValueSeries } from "@/types/spc";

const BUCKET_COUNT = 15; // Histogram dilim sayısı

interface HistogramChartProps {
  series: IndividualValueSeries;
  height?: number;
}

/** Bir değerin hangi renk bölgesinde olduğunu belirler */
function getBucketColor(
  bucketMid: number,
  lcl: number,
  ucl: number,
  monitoringMin: number,
  monitoringMax: number
): string {
  if (bucketMid < monitoringMin || bucketMid > monitoringMax)
    return "#7f1d1d"; // Koyu kırmızı — kritik monitoring dışı
  if (bucketMid < lcl || bucketMid > ucl)
    return "#f87171"; // Açık kırmızı — warning bölgesi
  return "#4ade80";   // Yeşil — kontrol içi
}

export function HistogramChart({ series, height = 300 }: HistogramChartProps) {
  const options = useMemo((): Highcharts.Options => {
    const values = series.dataPoints.map((p) => p.value);

    // Histogram sınırları: verinin gerçek min/max'ı ile
    // monitoring limitlerinin birleşimi (daha geniş olan seçilir)
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const rangeMin = Math.min(dataMin, series.monitoringMin);
    const rangeMax = Math.max(dataMax, series.monitoringMax);
    const bucketWidth = (rangeMax - rangeMin) / BUCKET_COUNT;

    // ── Kova (bucket) hesaplama ──────────────────────────────────────────
    // Her kova: { label: "350k–360k", count: 42, midpoint: 355k }
    const buckets = Array.from({ length: BUCKET_COUNT }, (_, i) => {
      const low  = rangeMin + i * bucketWidth;
      const high = low + bucketWidth;
      const mid  = (low + high) / 2;

      // Bu dilime düşen değer sayısı
      const count = values.filter((v) => v >= low && (i === BUCKET_COUNT - 1 ? v <= high : v < high)).length;

      // Sayı formatı: büyük sayılar için K/M kısaltması
      const fmt = (n: number) =>
        Math.abs(n) >= 1_000_000
          ? `${(n / 1_000_000).toFixed(1)}M`
          : Math.abs(n) >= 1_000
          ? `${(n / 1_000).toFixed(1)}K`
          : n.toFixed(1);

      return {
        name: `${fmt(low)} – ${fmt(high)}`,
        y: count,
        mid,
        color: getBucketColor(mid, series.lcl, series.ucl, series.monitoringMin, series.monitoringMax),
      };
    });

    return {
      chart: {
        type: "bar",          // "bar" = yatay, "column" = dikey
        height,
        backgroundColor: "transparent",
        animation: { duration: 300 },
        style: { fontFamily: "var(--font-inter, Inter, sans-serif)" },
      },
      title:   { text: undefined },
      credits: { enabled: false },

      // ── X Ekseni (yatay bar'da bu aslında Y yönünde görünür) ──────────
      // Highcharts'ta bar tipinde X ve Y eksenleri görsel olarak değişir:
      // xAxis → kategoriler (dilim isimleri) dikey sıralanır
      // yAxis → sayı değerleri yatay gösterilir
      xAxis: {
        categories: buckets.map((b) => b.name),
        lineColor: "#30363d",
        labels: {
          style: { color: "#8b949e", fontSize: "9px" },
          align: "right",
        },
      },
      yAxis: {
        title: { text: "Count", style: { color: "#484f58", fontSize: "10px" } },
        gridLineColor: "#21262d",
        labels: { style: { color: "#8b949e", fontSize: "10px" } },
        allowDecimals: false,
      },

      tooltip: {
        backgroundColor: "#21262d",
        borderColor: "#30363d",
        style: { color: "#e6edf3", fontSize: "11px" },
        formatter: function (this: Highcharts.TooltipFormatterContextObject) {
          const b = buckets[this.point.index];
          const pct = values.length > 0 ? ((b.y / values.length) * 100).toFixed(1) : "0";
          return `<b>${b.name}</b><br/><b>${b.y}</b> measurements (${pct}%)`;
        },
      },

      legend: { enabled: false },

      plotOptions: {
        bar: {
          borderRadius: 3,
          borderWidth: 0,
          groupPadding: 0,
          pointPadding: 0.05,
          dataLabels: {
            enabled: true,
            format: "{y}",
            style: { color: "#8b949e", fontSize: "9px", fontWeight: "400" },
          },
        },
      },

      series: [
        {
          type: "bar",
          name: "Frequency",
          data: buckets.map((b) => ({ y: b.y, color: b.color })),
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
