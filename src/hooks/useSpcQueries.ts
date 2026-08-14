// =============================================================================
// src/hooks/useSpcQueries.ts
// TanStack Query Hook'ları
//
// Bu dosya sunucu verilerini (istasyon, ürün, ölçüm listeleri) cache'ler.
// TanStack Query'nin üstlendiği sorumluluklar:
//   - Otomatik yeniden istek (stale-while-revalidate)
//   - Loading ve error durumları
//   - Arka planda yenileme
//   - Filtre değiştiğinde otomatik refetch (queryKey)
//
// Zustand ile entegrasyon:
//   - Zustand'dan stationId, productId gibi değerleri oku
//   - Bu değerler queryKey içine girer → değişince sorgu otomatik çalışır
//   - fetchProducts sonucunda startDate/endDate alınır →
//     commitFilters'a iletilmek üzere döndürülür
// =============================================================================

"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchStations,
  fetchProducts,
  fetchMeasurements,
  fetchIndividualValues,
  fetchSpcValues,
} from "@/lib/api/spcClient";
import { useSpcStore } from "@/store/useSpcStore";

// ---------------------------------------------------------------------------
// CACHE SÜRE AYARLARI
// ---------------------------------------------------------------------------
const STALE_TIME = 5 * 60 * 1000;   // 5 dakika — bu süre boyunca "taze" sayılır
const GC_TIME    = 10 * 60 * 1000;  // 10 dakika — cache'den silinme süresi

// ---------------------------------------------------------------------------
// 1. İSTASYON LİSTESİ
// Koşul yok — sayfa açıldığında hemen çekilir.
// Cache 5 dakika boyunca geçerli (istasyonlar sık değişmez).
// ---------------------------------------------------------------------------
export function useStationsQuery() {
  return useQuery({
    queryKey: ["stations"],
    queryFn: fetchStations,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ---------------------------------------------------------------------------
// 2. ÜRÜN LİSTESİ
// stationId ve populationSize değiştiğinde otomatik yenilenir.
// stationId null ise sorgu çalışmaz (enabled: false).
// ---------------------------------------------------------------------------
export function useProductsQuery() {
  const stationId = useSpcStore((s) => s.stationId);
  const populationSize = useSpcStore((s) => s.populationSize);

  return useQuery({
    queryKey: ["products", stationId, populationSize],
    queryFn: () => fetchProducts(stationId!, populationSize),
    enabled: stationId !== null,  // İstasyon seçilmeden çalışmaz
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ---------------------------------------------------------------------------
// 3. ÖLÇÜM TİPİ LİSTESİ
// stationId veya productId değiştiğinde yenilenir.
// Her iki değer de dolu değilse çalışmaz.
// ---------------------------------------------------------------------------
export function useMeasurementsQuery() {
  const stationId = useSpcStore((s) => s.stationId);
  const productId = useSpcStore((s) => s.productId);

  return useQuery({
    queryKey: ["measurements", stationId, productId],
    queryFn: () => fetchMeasurements(stationId!, productId!),
    enabled: stationId !== null && productId !== null,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ---------------------------------------------------------------------------
// 4. INDIVIDUAL VALUES
// committedFilters değiştiğinde tetiklenir.
// Layout SPC değilken çalışır.
// ---------------------------------------------------------------------------
export function useIndividualValuesQuery() {
  const committedFilters = useSpcStore((s) => s.committedFilters);
  const isSpcMode = committedFilters?.layoutType === "SPC";

  return useQuery({
    queryKey: ["individual-values", committedFilters],
    queryFn: () =>
      fetchIndividualValues({
        stationId: committedFilters!.stationId,
        productId: committedFilters!.productId,
        measurements: committedFilters!.measurements.map((m) => m.name),
        populationSize: committedFilters!.populationSize,
        startDate: committedFilters!.startDate,
        endDate: committedFilters!.endDate,
      }),
    // Sadece commit edilmiş filtreler varsa ve SPC modunda değilsek çalış
    enabled: committedFilters !== null && !isSpcMode,
    staleTime: 0,       // Veri her GET'te taze alınır
    gcTime: GC_TIME,
  });
}

// ---------------------------------------------------------------------------
// 5. SPC VALUES
// committedFilters değiştiğinde tetiklenir.
// Sadece SPC layoutunda çalışır.
// ---------------------------------------------------------------------------
export function useSpcValuesQuery() {
  const committedFilters = useSpcStore((s) => s.committedFilters);
  const isSpcMode = committedFilters?.layoutType === "SPC";

  return useQuery({
    queryKey: ["spc-values", committedFilters],
    queryFn: () =>
      fetchSpcValues({
        stationId: committedFilters!.stationId,
        productId: committedFilters!.productId,
        measurements: committedFilters!.measurements.map((m) => m.name),
        populationSize: committedFilters!.populationSize,
        startDate: committedFilters!.startDate,
        endDate: committedFilters!.endDate,
      }),
    enabled: committedFilters !== null && isSpcMode,
    staleTime: 0,
    gcTime: GC_TIME,
  });
}
