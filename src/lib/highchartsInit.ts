// =============================================================================
// src/lib/highchartsInit.ts
// Highcharts Global Modül Başlatma
//
// Boost modülü büyük veri setlerini (30k+ nokta) WebGL/Canvas ile hızlandırır.
// Bu dosya yalnızca istemci tarafında çalışır.
//
// Highcharts 13.x: ESM modülleri için dinamik import kullanılır.
// Boost default export doğrudan Highcharts fonksiyonunu çağırır.
// =============================================================================

import Highcharts from "highcharts";

let initialized = false;

export async function initHighcharts(): Promise<void> {
  // Sunucu tarafında çalışma — SSR'da window yoktur
  if (typeof window === "undefined") return;
  // Yalnızca bir kez başlat
  if (initialized) return;
  initialized = true;

  try {
    // Highcharts 13.x boost modülü: default export bir factory function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BoostModule: any = await import("highcharts/modules/boost");
    // ESM/CJS uyumu için .default veya doğrudan çağrı
    const boost = BoostModule.default ?? BoostModule;
    if (typeof boost === "function") {
      boost(Highcharts);
    }
  } catch {
    // Boost modülü yüklenemezse sessizce devam et
    console.warn("[Highcharts] Boost modülü yüklenemedi. WebGL devre dışı.");
  }

  // Highcharts global dark tema ayarları
  Highcharts.setOptions({
    lang: {
      thousandsSep: ",",
      decimalPoint: ".",
    },
    chart: {
      backgroundColor: "transparent",
      style: {
        fontFamily: "var(--font-inter, Inter, ui-sans-serif, system-ui, sans-serif)",
      },
    },
    credits: { enabled: false },
  });
}
