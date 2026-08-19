// =============================================================================
// src/lib/mappers/spcMapper.ts
// API → UI Dönüşüm Katmanı (Mapper)
// =============================================================================

import type {
  ApiIndividualValueSeries,
  ApiSpcSeries,
  ApiStation,
  ApiProduct,
  ApiMeasurement,
  IndividualValueSeries,
  SpcSeries,
  PalletSeries,
  PalletPoint,
  CompareSeries,
  ComparePoint,
  SelectOption,
  MeasurementOption,
  DataPoint,
} from "@/types/spc";

// ---------------------------------------------------------------------------
// İSTASYON / ÜRÜN / ÖLÇÜM MAPPER'LARI
// ---------------------------------------------------------------------------

export function mapStationsToOptions(stations: ApiStation[]): SelectOption<number>[] {
  return stations.map((s) => ({
    value: s.StationID,
    label: `${s.StationName} (${s.WorkcenterName} — Line ${s.LineName})`,
  }));
}

export function mapProductsToOptions(products: ApiProduct[]): SelectOption<number>[] {
  return products.map((p) => ({ value: p.Id, label: p.Name }));
}

export function mapMeasurementsToOptions(measurements: ApiMeasurement[]): MeasurementOption[] {
  return measurements
    .filter((m) => m.IsVisible)
    .map((m) => ({ id: m.ID, name: m.Name }));
}

// ---------------------------------------------------------------------------
// INDIVIDUAL VALUES MAPPER
// ---------------------------------------------------------------------------

export function mapIndividualValueSeries(raw: ApiIndividualValueSeries): IndividualValueSeries {
  return {
    measurementName: raw.MeasurementName,
    measureTypeId: raw.MeasureTypeId,
    ucl: raw.UCL,
    lcl: raw.LCL,
    monitoringMax: raw.Max,
    monitoringMin: raw.Min,
    mean: raw.Avg,
    ppm: raw.PPM,
    okCount: raw.OK,
    nokCount: raw.NOK,
    dataPoints: raw.IndividualValues.map(
      (point): DataPoint => ({
        date: point.Date,
        value: point.Value,
        // ÖNEMLİ FALLBACK: e.Pallet ?? e.Piece ?? null
        // Eski PalletScatterChart.vue'daki "e.Pallet" kullanımını karşılar.
        // Backend bazı endpoint'lerde Piece, bazılarında Pallet döndürebilir.
        palletNumber: point.Pallet ?? point.Piece ?? null,
        productId: point.ProdId ?? point.Product,
      })
    ),
  };
}

export function mapIndividualValueSeriesArray(
  rawArray: ApiIndividualValueSeries[]
): IndividualValueSeries[] {
  return rawArray.map(mapIndividualValueSeries);
}

// ---------------------------------------------------------------------------
// SPC VALUES MAPPER
// ---------------------------------------------------------------------------

export function mapSpcSeries(raw: ApiSpcSeries): SpcSeries {
  return {
    measurementName: raw.MeasurementName,
    measureTypeId: raw.MeasureTypeId,
    ucl: raw.Max,
    lcl: raw.Min,
    monitoringMax: raw.PreMax,
    monitoringMin: raw.PreMin,
    mean: raw.AverageSpc,
    groups: raw.SpcValues.map((g) => ({
      groupIndex: g.GroupIndex,
      avg: g.Avg,
      sigma: g.Sigma,
    })),
  };
}

export function mapSpcSeriesArray(rawArray: ApiSpcSeries[]): SpcSeries[] {
  return rawArray.map(mapSpcSeries);
}

// ---------------------------------------------------------------------------
// PALLET ANALİZİ MAPPER
// IndividualValueSeries → PalletSeries
// Bu mapper IndividualValues verisini PalletChart'a uygun formata dönüştürür.
// X ekseni = palletNumber (Pallet ?? Piece fallback zaten DataPoint'te uygulandı)
// ---------------------------------------------------------------------------

export function mapIndividualToPalletSeries(series: IndividualValueSeries): PalletSeries {
  let maxPalletValue = 0;

  const points: PalletPoint[] = series.dataPoints
    .filter((p) => p.palletNumber !== null)
    .map((p): PalletPoint => {
      const palletNum = p.palletNumber as number;
      if (palletNum > maxPalletValue) maxPalletValue = palletNum;
      return {
        x: palletNum,
        y: p.value,
        prodId: p.productId,
        pallet: palletNum,
      };
    });

  return {
    measurementName: series.measurementName,
    measureTypeId: series.measureTypeId,
    maxPalletValue,
    monitoringMax: series.monitoringMax,
    monitoringMin: series.monitoringMin,
    mean: series.mean,
    points,
  };
}

export function mapIndividualToPalletSeriesArray(
  seriesArray: IndividualValueSeries[]
): PalletSeries[] {
  return seriesArray.map(mapIndividualToPalletSeries);
}

// ---------------------------------------------------------------------------
// COMPARE ANALİZİ MAPPER
// IndividualValueSeries[] → CompareSeries[]
// Birden fazla ölçüm tipi tek bir grafikte üst üste gösterilir.
// X ekseni = Unix timestamp (ms), timezone offset uygulanır.
// ---------------------------------------------------------------------------

export function mapIndividualToCompareSeries(series: IndividualValueSeries): CompareSeries {
  const tzOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;

  const points: ComparePoint[] = series.dataPoints.map((p): ComparePoint => {
    const date = new Date(p.date);
    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "full",
      timeStyle: "medium",
    }).format(date);

    return {
      x: date.getTime() - tzOffsetMs,
      y: p.value,
      pallet: p.palletNumber,
      date: formattedDate,
    };
  });

  return {
    measurementName: series.measurementName,
    measureTypeId: series.measureTypeId,
    monitoringMax: series.monitoringMax,
    monitoringMin: series.monitoringMin,
    mean: series.mean,
    points,
  };
}

export function mapIndividualToCompareSeriesArray(
  seriesArray: IndividualValueSeries[]
): CompareSeries[] {
  return seriesArray.map(mapIndividualToCompareSeries);
}
