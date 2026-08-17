"use client";
// =============================================================================
// src/components/charts/spc/SpcStdDevChart.tsx
// SPC Görünüm Modu — Standart Sapma + Cp + Cpk Grafiği
//
// Vue'daki StandardDeviationChart.vue'nun karşılığı.
//
// Grafik Yapısı:
//   X ekseni: Grup index (G1, G2, G3...)
//   Birincil Y Ekseni (sol): Standart Sapma değerleri
//   İkincil Y Ekseni (sağ): Cp ve Cpk değerleri
//
// 3 Seri:
//   1. Standard Deviation (mavi) — her grubun sigma değeri
//   2. Cp (yeşil) — süreç yeterliliği
//   3. Cpk (sarı) — merkezli süreç yeterliliği
//
// Cp ve Cpk Formülleri:
//   Cp  = (UCL - LCL) / (6 × sigma)
//        → Süreç tolerans bandına sığıyor mu?
//        → 1.33 üzeri → yeterli, 1.67 üzeri → mükemmel
//   Cpk = min((UCL - mean) / (3 × sigma), (mean - LCL) / (3 × sigma))
//        → Süreç hem toleransa sığıyor hem de ortalanmış mı?
//        → Cpk < Cp ise süreç merkezi kaymış demektir.
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
    const tolerance = series.ucl - series.lcl; // Toplam tolerans bandı

    // Her grup için Cp ve Cpk hesaplanır
    const sigmaData: number[] = [];
    const cpData:    number[] = [];
    const cpkData:   number[] = [];

    series.groups.forEach((g) => {
      sigmaData.push(g.sigma);

      if (g.sigma === 0) {
        // Sigma 0 ise (tüm ölçümler eşit) tanımsız → maksimum değer koy
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

    // Cp/Cpk'nın ortalama değerlerini badge için hesapla
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

      // ── İki Y Ekseni: sol (sigma) + sağ (Cp/Cpk) ─────────────────────
      // Highcharts'ta birden fazla Y ekseni tanımlanabilir.
      // Her seri "yAxis: 0" veya "yAxis: 1" ile hangi eksene bağlandığını belirtir.
      yAxis: [
        // Birincil Y ekseni (sol) — Sigma değerleri
        {
          title: {
            text: "σ Std Dev",
            style: { color: "#3b82f6", fontSize: "10px" },
          },
          gridLineColor: "#21262d",
          labels: { style: { color: "#3b82f6", fontSize: "10px" } },
          // Referans çizgisi: sigma'nın beklenen üst sınırı
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
          opposite: true,         // Sağ tarafa yerleştirir
          gridLineWidth: 0,       // İkinci eksen grid çizgisi gösterme
          labels: { style: { color: "#8b949e", fontSize: "10px" } },
          // Cp ≥ 1.33 = yeterli sınır — kılavuz çizgisi
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
        shared: true,             // Birden fazla seri — tek tooltip'te göster
        formatter: function (this: Highcharts.TooltipFormatterContextObject) {
          const i = (this.points?.[0]?.point.index ?? 0);
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
          yAxis: 0,             // Birincil (sol) eksene bağlı
          color: "#3b82f6",
          data: sigmaData,
          zIndex: 3,
        },
        // Cp — Sağ Y ekseni, yeşil
        {
          type: "line",
          name: "Cp",
          yAxis: 1,             // İkincil (sağ) eksene bağlı
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
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
    />
  );
}
