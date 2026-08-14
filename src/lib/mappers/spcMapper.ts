// =============================================================================
// src/lib/mappers/spcMapper.ts
// API ↔ UI Dönüşüm Katmanı (Mapper)
//
// Bu dosyanın tek sorumluluğu: Ham API alan adlarını temiz UI adlarına
// dönüştürmek. Özellikle AverageChart.vue'dan keşfedilen "renk tersliği"
// burada düzeltilir.
//
// Terslik özeti:
//   API.Max → UI.ucl          (yeşil dar bant — Control Limit Üst)
//   API.Min → UI.lcl          (yeşil dar bant — Control Limit Alt)
//   API.PreMax → UI.monitoringMax  (sarı geniş bant — Monitoring Limit Üst)
//   API.PreMin → UI.monitoringMin  (sarı geniş bant — Monitoring Limit Alt)
//   API.UCL → UI.ucl          (Individual Values'ta zaten doğru geliyor)
//   API.LCL → UI.lcl          (Individual Values'ta zaten doğru geliyor)
// =============================================================================

import type {
  ApiIndividualValueSeries,
  ApiSpcSeries,
  ApiStation,
  ApiProduct,
  ApiMeasurement,
  IndividualValueSeries,
  SpcSeries,
  SelectOption,
  MeasurementOption,
  DataPoint,
} from "@/types/spc";

// ---------------------------------------------------------------------------
// İSTASYON / ÜRÜN / ÖLÇÜM MAPPER'LARI
// ---------------------------------------------------------------------------

/**
 * Ham istasyon listesini select dropdown için hazırlar.
 */
export function mapStationsToOptions(
  stations: ApiStation[]
): SelectOption<number>[] {
  return stations.map((s) => ({
    value: s.StationID,
    label: `${s.StationName} (${s.WorkcenterName} — Line ${s.LineName})`,
  }));
}

/**
 * Ham ürün listesini select dropdown için hazırlar.
 */
export function mapProductsToOptions(
  products: ApiProduct[]
): SelectOption<number>[] {
  return products.map((p) => ({
    value: p.Id,
    label: p.Name,
  }));
}

/**
 * Ham ölçüm listesini multi-select için hazırlar.
 */
export function mapMeasurementsToOptions(
  measurements: ApiMeasurement[]
): MeasurementOption[] {
  return measurements
    .filter((m) => m.IsVisible)
    .map((m) => ({
      id: m.ID,
      name: m.Name,
    }));
}

// ---------------------------------------------------------------------------
// INDIVIDUAL VALUES MAPPER
// Bu fonksiyon Individual Values API yanıtını temiz UI tipine dönüştürür.
// UCL/LCL alanları Individual Values API'sinde ZATEn doğru isimlendirilmiş.
// ---------------------------------------------------------------------------

/**
 * Ham API Individual Values serisini temiz UI tipine dönüştürür.
 *
 * Ham API'den gelen alanlar ve yeni UI karşılıkları:
 * ```
 * ApiIndividualValueSeries.UCL  → IndividualValueSeries.ucl
 * ApiIndividualValueSeries.LCL  → IndividualValueSeries.lcl
 * ApiIndividualValueSeries.Max  → IndividualValueSeries.monitoringMax
 * ApiIndividualValueSeries.Min  → IndividualValueSeries.monitoringMin
 * ApiIndividualValueSeries.Avg  → IndividualValueSeries.mean
 * ```
 */
export function mapIndividualValueSeries(
  raw: ApiIndividualValueSeries
): IndividualValueSeries {
  return {
    measurementName: raw.MeasurementName,
    measureTypeId: raw.MeasureTypeId,

    // Control Limits — Dar yeşil bant
    ucl: raw.UCL,
    lcl: raw.LCL,

    // Monitoring Limits — Geniş sarı bant
    // Individual Values API'sinde Max/Min monitoring limitleridir
    monitoringMax: raw.Max,
    monitoringMin: raw.Min,

    // İstatistikler
    mean: raw.Avg,
    ppm: raw.PPM,
    okCount: raw.OK,
    nokCount: raw.NOK,

    // Veri noktaları
    dataPoints: raw.IndividualValues.map(
      (point): DataPoint => ({
        date: point.Date,
        value: point.Value,
        palletNumber: point.Piece,
        productId: point.Product,
      })
    ),
  };
}

/**
 * Birden fazla seriyi dönüştürür.
 */
export function mapIndividualValueSeriesArray(
  rawArray: ApiIndividualValueSeries[]
): IndividualValueSeries[] {
  return rawArray.map(mapIndividualValueSeries);
}

// ---------------------------------------------------------------------------
// SPC VALUES MAPPER
// Bu fonksiyon SPC API yanıtını temiz UI tipine dönüştürür.
// ⚠️  KRİTİK: SPC API'sinde Max/Min ve PreMax/PreMin TERSINE İSİMLENDİRİLMİŞ
// ---------------------------------------------------------------------------

/**
 * Ham API SPC serisini temiz UI tipine dönüştürür.
 *
 * AverageChart.vue'dan tersine mühendislik ile keşfedilen eşleşme:
 * ```
 * ApiSpcSeries.Max     → SpcSeries.ucl            (plotBands: from=Max, to=Min → yeşil dar bant)
 * ApiSpcSeries.Min     → SpcSeries.lcl             (plotBands: from=Max, to=Min → yeşil dar bant)
 * ApiSpcSeries.PreMax  → SpcSeries.monitoringMax   (plotBands: from=PreMax, to=PreMin → sarı geniş bant)
 * ApiSpcSeries.PreMin  → SpcSeries.monitoringMin   (plotBands: from=PreMax, to=PreMin → sarı geniş bant)
 * ApiSpcSeries.AverageSpc → SpcSeries.mean         (kırmızı çizgi)
 * SpcValues[i].Avg     → groups[i].avg             (mavi x-bar grafiği)
 * SpcValues[i].Sigma   → groups[i].sigma           (standart sapma grafiği)
 * ```
 */
export function mapSpcSeries(raw: ApiSpcSeries): SpcSeries {
  return {
    measurementName: raw.MeasurementName,
    measureTypeId: raw.MeasureTypeId,

    // ⚠️  TERSLIK DÜZELTİLİYOR:
    // SPC API'sinde "Max/Min" yeşil banttır (Control Limits = UCL/LCL)
    ucl: raw.Max,
    lcl: raw.Min,

    // SPC API'sinde "PreMax/PreMin" sarı banttır (Monitoring Limits)
    monitoringMax: raw.PreMax,
    monitoringMin: raw.PreMin,

    // Genel ortalama
    mean: raw.AverageSpc,

    // Alt gruplar (her biri 200 ölçüm)
    groups: raw.SpcValues.map((g) => ({
      groupIndex: g.GroupIndex,
      avg: g.Avg,
      sigma: g.Sigma,
    })),
  };
}

/**
 * Birden fazla SPC serisini dönüştürür.
 */
export function mapSpcSeriesArray(rawArray: ApiSpcSeries[]): SpcSeries[] {
  return rawArray.map(mapSpcSeries);
}
