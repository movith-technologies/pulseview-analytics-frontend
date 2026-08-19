"use client";
// =============================================================================
// src/components/charts/individual/HistogramChart.tsx
// Individual Values â€” Frekans DaÄŸÄ±lÄ±mÄ± Yatay Bar GrafiÄŸi
//
// Histogram MantÄ±ÄŸÄ± (Highcharts tarafÄ±nda yapÄ±lÄ±r):
//   1. Veri noktalarÄ± [monitoringMin, monitoringMax] aralÄ±ÄŸÄ±nda daÄŸÄ±lÄ±r.
//   2. Bu aralÄ±k eÅŸit geniÅŸlikte BUCKET_COUNT (varsayÄ±lan 15) dilime bÃ¶lÃ¼nÃ¼r.
//   3. Her veri noktasÄ± hangi dilime dÃ¼ÅŸtÃ¼ÄŸÃ¼ne bakÄ±lÄ±r â†’ o dilimin sayacÄ± artar.
//   4. SonuÃ§: [{ name: "350kâ€“360k", y: 42 }, ...] formatÄ±nda veri dizisi.
//   5. Highcharts `bar` tipi (yatay) ile bu veri gÃ¶rselleÅŸtirilir.
//
// Renk KodlamasÄ±:
//   - UCL'nin Ã¼stÃ¼nde â†’ kÄ±rmÄ±zÄ± (control dÄ±ÅŸÄ±, yÃ¼ksek)
//   - LCL'nin altÄ±nda â†’ kÄ±rmÄ±zÄ± (control dÄ±ÅŸÄ±, dÃ¼ÅŸÃ¼k)
//   - UCL-LCL arasÄ±  â†’ yeÅŸil (kontrol iÃ§i)
//   - monitoringMax/Min dÄ±ÅŸÄ± â†’ koyu kÄ±rmÄ±zÄ± (kritik)
// =============================================================================

import { useMemo } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import type { IndividualValueSeries } from "@/types/spc";

const BUCKET_COUNT = 15; // Histogram dilim sayÄ±sÄ±

interface HistogramChartProps {
  series: IndividualValueSeries;
  height?: number;
}

/** Bir deÄŸerin hangi renk bÃ¶lgesinde olduÄŸunu belirler */
function getBucketColor(
  bucketMid: number,
  lcl: number,
  ucl: number,
  monitoringMin: number,
  monitoringMax: number
): string {
  if (bucketMid < monitoringMin || bucketMid > monitoringMax)
    return "#7f1d1d"; // Koyu kÄ±rmÄ±zÄ± â€” kritik monitoring dÄ±ÅŸÄ±
  if (bucketMid < lcl || bucketMid > ucl)
    return "#f87171"; // AÃ§Ä±k kÄ±rmÄ±zÄ± â€” warning bÃ¶lgesi
  return "#4ade80";   // YeÅŸil â€” kontrol iÃ§i
}

export function HistogramChart({ series, height = 300 }: HistogramChartProps) {
  const options = useMemo((): Highcharts.Options => {
    const values = series.dataPoints.map((p) => p.value);

    // Histogram sÄ±nÄ±rlarÄ±: verinin gerÃ§ek min/max'Ä± ile
    // monitoring limitlerinin birleÅŸimi (daha geniÅŸ olan seÃ§ilir)
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const rangeMin = Math.min(dataMin, series.monitoringMin);
    const rangeMax = Math.max(dataMax, series.monitoringMax);
    const bucketWidth = (rangeMax - rangeMin) / BUCKET_COUNT;

    // â”€â”€ Kova (bucket) hesaplama â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Her kova: { label: "350kâ€“360k", count: 42, midpoint: 355k }
    const buckets = Array.from({ length: BUCKET_COUNT }, (_, i) => {
      const low  = rangeMin + i * bucketWidth;
      const high = low + bucketWidth;
      const mid  = (low + high) / 2;

      // Bu dilime dÃ¼ÅŸen deÄŸer sayÄ±sÄ±
      const count = values.filter((v) => v >= low && (i === BUCKET_COUNT - 1 ? v <= high : v < high)).length;

      // SayÄ± formatÄ±: bÃ¼yÃ¼k sayÄ±lar iÃ§in K/M kÄ±saltmasÄ±
      const fmt = (n: number) =>
        Math.abs(n) >= 1_000_000
          ? `${(n / 1_000_000).toFixed(1)}M`
          : Math.abs(n) >= 1_000
          ? `${(n / 1_000).toFixed(1)}K`
          : n.toFixed(1);

      return {
        name: `${fmt(low)} â€“ ${fmt(high)}`,
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

      // â”€â”€ X Ekseni (yatay bar'da bu aslÄ±nda Y yÃ¶nÃ¼nde gÃ¶rÃ¼nÃ¼r) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Highcharts'ta bar tipinde X ve Y eksenleri gÃ¶rsel olarak deÄŸiÅŸir:
      // xAxis â†’ kategoriler (dilim isimleri) dikey sÄ±ralanÄ±r
      // yAxis â†’ sayÄ± deÄŸerleri yatay gÃ¶sterilir
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
        formatter: function (this: any) {
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


