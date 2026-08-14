// =============================================================================
// src/lib/mock/dataEngine.ts
// İstatistiksel Mock Veri Motoru
//
// Bu modül, gerçekçi üretim verisi simüle etmek için Box-Muller dönüşümü
// kullanarak normal dağılımlı rastgele sayılar üretir.
//
// Temel Kural: monitoringMin < lcl < mean < ucl < monitoringMax
//               Her üretilen veri noktası bu aralıkta yoğunlaşır,
//               ancak nadir outlier'lar gerçekçilik için dahil edilir.
// =============================================================================

import type {
  ApiIndividualValueSeries,
  ApiSpcSeries,
  ApiSpcGroup,
  ApiDataPoint,
} from "@/types/spc";
import {
  MEASUREMENT_PARAMS,
  DEFAULT_MEASUREMENT_PARAMS,
  type MeasurementParams,
} from "./mockDb";

// ---------------------------------------------------------------------------
// TEMEL İSTATİSTİK ARAÇLARI
// ---------------------------------------------------------------------------

/**
 * Box-Muller Dönüşümü — Normal dağılımlı rastgele sayı üretir.
 * @param mean   Dağılımın ortalaması (merkezi)
 * @param stdDev Standart sapma (dağılımın genişliği)
 * @returns Normal dağılıma uygun bir sayı
 */
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  // Box-Muller Dönüşümü: Uniform → Normal
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stdDev;
}

/**
 * Bir sayıyı belirli bir aralığa sıkıştırır.
 * @param value Sıkıştırılacak değer
 * @param min   Alt sınır
 * @param max   Üst sınır
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Verilen bir dizi sayının ortalamasını hesaplar.
 */
function calcMean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Verilen bir dizi sayının standart sapmasını hesaplar.
 */
function calcStdDev(values: number[], mean: number): number {
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// VERİ NOKTALARI ÜRETİMİ
// ---------------------------------------------------------------------------

/**
 * Belirli sayıda veri noktası üretir.
 *
 * Üretim stratejisi:
 * - %75 veri: LCL ile UCL arasında (süreç kontrolde)
 * - %20 veri: Monitoring sınırları içinde ama kontrol dışı (uyarı bölgesi)
 * - %5  veri: Monitoring sınırları dışında (outlier)
 */
function generateDataPoints(
  count: number,
  params: MeasurementParams,
  measurementName: string,
  productId: number,
  startDate: Date
): ApiDataPoint[] {
  const points: ApiDataPoint[] = [];
  const intervalMs = 5000; // Her 5 saniyede bir ölçüm

  // Palet numarası —bir palet genelde 50-200 arası ölçüm içerir
  const PIECES_PER_PALLET = Math.floor(50 + Math.random() * 150);

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + i * intervalMs);
    const pallet = Math.floor(i / PIECES_PER_PALLET) + 1;

    // Strateji: hangi bölgeden veri üretelim?
    const rand = Math.random();
    let value: number;

    if (rand < 0.75) {
      // Kontrol bölgesi: LCL ile UCL arasında yoğunlaşmış
      value = randomNormal(params.mean, params.stdDev * 0.5);
      value = clamp(value, params.lcl, params.ucl);
    } else if (rand < 0.95) {
      // Uyarı bölgesi: Monitoring sınırları içinde ama UCL/LCL dışında
      value = randomNormal(params.mean, params.stdDev * 0.9);
      value = clamp(value, params.monitoringMin, params.monitoringMax);
    } else {
      // Outlier: Monitoring sınırları dışında
      const isHigh = Math.random() > 0.5;
      if (isHigh) {
        value = params.monitoringMax * (1 + Math.random() * 0.2);
      } else {
        value = params.monitoringMin * (1 - Math.random() * 0.2);
      }
    }

    points.push({
      Date: date.toISOString(),
      Value: parseFloat(value.toFixed(4)),
      Product: productId,
      MeasurementName: measurementName,
      Piece: pallet,
      MandrenNavetta: `M${(i % 4) + 1}`,
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// INDIVIDUAL VALUES ÜRETİMİ
// ---------------------------------------------------------------------------

/**
 * GetIndividualValues API yanıtını taklit eder.
 *
 * @param measurementIds Ölçüm tipi ID'leri
 * @param measurementNames Ölçüm tipi adları
 * @param populationSize Kaç veri noktası üretileceği (1-30000)
 * @param productId Ürün ID'si
 * @param stationId İstasyon ID'si
 */
export function generateIndividualValues(
  measurementIds: number[],
  measurementNames: string[],
  populationSize: number,
  productId: number,
  stationId: number
): ApiIndividualValueSeries[] {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - Math.ceil(populationSize / 720));

  return measurementIds.map((id, index) => {
    const name = measurementNames[index] ?? `Measurement ${id}`;
    const params = MEASUREMENT_PARAMS[id] ?? DEFAULT_MEASUREMENT_PARAMS;

    const points = generateDataPoints(
      populationSize,
      params,
      name,
      productId,
      startDate
    );

    const allValues = points.map((p) => p.Value);
    const actualMean = calcMean(allValues);

    // NOK: monitoring sınırları dışındaki değer sayısı
    const nokCount = allValues.filter(
      (v) => v < params.monitoringMin || v > params.monitoringMax
    ).length;

    return {
      MeasurementName: name,
      MeasureTypeId: id,
      // ⚠️  Ham API'de şu isimler kullanılır:
      // UCL/LCL = gerçek kontrol limitleri
      // Max/Min = monitoring (geniş) limitleri
      UCL: params.ucl,
      LCL: params.lcl,
      Avg: parseFloat(actualMean.toFixed(4)),
      Max: params.monitoringMax,   // Monitoring Limit Üst → Mapper'da monitoringMax olacak
      Min: params.monitoringMin,   // Monitoring Limit Alt → Mapper'da monitoringMin olacak
      PPM: parseFloat(((nokCount / populationSize) * 1_000_000).toFixed(0)),
      OK: populationSize - nokCount,
      NOK: nokCount,
      IndividualValues: points,
    };
  });
}

// ---------------------------------------------------------------------------
// SPC VALUES ÜRETİMİ
// ---------------------------------------------------------------------------

/**
 * GetSPCValues API yanıtını taklit eder.
 * populationSize / 200 = grup sayısı (her grup 200 ölçümden oluşur)
 *
 * @param measurementIds Ölçüm tipi ID'leri
 * @param measurementNames Ölçüm tipi adları
 * @param populationSize 200'ün katı olmalı
 * @param productId Ürün ID'si
 */
export function generateSpcValues(
  measurementIds: number[],
  measurementNames: string[],
  populationSize: number,
  productId: number
): ApiSpcSeries[] {
  // SPC modunda populationSize 200'ün katı olmalı
  const correctedSize = Math.max(200, Math.round(populationSize / 200) * 200);
  const groupCount = correctedSize / 200;

  return measurementIds.map((id, index) => {
    const name = measurementNames[index] ?? `Measurement ${id}`;
    const params = MEASUREMENT_PARAMS[id] ?? DEFAULT_MEASUREMENT_PARAMS;

    const groups: ApiSpcGroup[] = [];

    for (let g = 0; g < groupCount; g++) {
      // Her grup için 200 ölçüm simüle et
      const groupValues: number[] = [];
      for (let i = 0; i < 200; i++) {
        const rand = Math.random();
        let v: number;
        if (rand < 0.85) {
          v = randomNormal(params.mean, params.stdDev * 0.4);
        } else {
          v = randomNormal(params.mean, params.stdDev * 0.8);
        }
        groupValues.push(v);
      }

      const groupMean = calcMean(groupValues);
      const groupSigma = calcStdDev(groupValues, groupMean);

      groups.push({
        Avg: parseFloat(groupMean.toFixed(4)),
        Sigma: parseFloat(groupSigma.toFixed(4)),
        GroupIndex: g + 1,
      });
    }

    // Tüm grup ortalamalarından genel istatistikler
    const allGroupAvgs = groups.map((g) => g.Avg);
    const overallMean = calcMean(allGroupAvgs);

    return {
      MeasurementName: name,
      MeasureTypeId: id,
      // ⚠️  Ham API'de terslik var (mapper'da düzeltilir):
      // Max → UCL (control limit üst)
      // Min → LCL (control limit alt)
      // PreMax → Monitoring Max (geniş sarı bant üstü)
      // PreMin → Monitoring Min (geniş sarı bant alti)
      Max: params.ucl,           // → mapper: ucl
      Min: params.lcl,           // → mapper: lcl
      PreMax: params.monitoringMax,  // → mapper: monitoringMax
      PreMin: params.monitoringMin,  // → mapper: monitoringMin
      AverageSpc: parseFloat(overallMean.toFixed(4)),  // → mapper: mean
      SpcValues: groups,
    };
  });
}
