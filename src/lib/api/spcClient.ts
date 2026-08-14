// =============================================================================
// src/lib/api/spcClient.ts
// Merkezi API İstemcisi
//
// Tüm fetch çağrıları bu dosya üzerinden yapılır. Tek değişim noktası:
// Gerçek backend geldiğinde BASE_URL'i env variable'a bağlamak yeterli.
// Frontend bileşenleri bu dosyayı import eder, asla doğrudan fetch yazmaz.
// =============================================================================

import type {
  ApiStation,
  ApiProductsResponse,
  ApiMeasurement,
  ApiIndividualValueSeries,
  ApiSpcSeries,
  IndividualValueSeries,
  SpcSeries,
  SelectOption,
  MeasurementOption,
} from "@/types/spc";

import {
  mapStationsToOptions,
  mapProductsToOptions,
  mapMeasurementsToOptions,
  mapIndividualValueSeriesArray,
  mapSpcSeriesArray,
} from "@/lib/mappers/spcMapper";

// ---------------------------------------------------------------------------
// TEMEL YAPILANDIRMA
// ---------------------------------------------------------------------------

/**
 * API Base URL.
 * - Geliştirme: Next.js Route Handlers (aynı origin)
 * - Gerçek backend: NEXT_PUBLIC_API_URL env variable
 *
 * "typeof window" kontrolü: Bu istemci hem Server Component'lerden
 * hem Client Component'lerden çağrılabilir.
 */
function getBaseUrl(): string {
  // Server tarafında çalışıyorsa absolute URL gerekir
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  // Client tarafında relative path yeterli
  return "";
}

/**
 * Temel fetch sarmalayıcı — hata yönetimi ve JSON dönüşümü dahil.
 * Gerçek backend geldiğinde auth header vb. buraya eklenir.
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      // Gerçek backend için: Authorization: `Bearer ${token}`
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API Error ${response.status} ${response.statusText}: ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API FONKSİYONLARI — Ham API çağrıları
// Bu fonksiyonlar ham API yanıtını döndürür.
// ---------------------------------------------------------------------------

/** İstasyon listesini getirir */
export async function fetchStationsRaw(): Promise<ApiStation[]> {
  return apiFetch<ApiStation[]>("/api/stations");
}

/**
 * Ürün listesini ve tarih aralığını getirir.
 * @param stationId İstasyon ID'si
 * @param number    Kaç veri noktası alınacak (populationSize)
 */
export async function fetchProductsRaw(
  stationId: number,
  number: number
): Promise<ApiProductsResponse> {
  const params = new URLSearchParams({
    stationId: String(stationId),
    number: String(number),
  });
  return apiFetch<ApiProductsResponse>(`/api/products?${params}`);
}

/**
 * Ölçüm tipi listesini getirir.
 * @param stationId  İstasyon ID'si
 * @param productId  Ürün ID'si
 */
export async function fetchMeasurementsRaw(
  stationId: number,
  productId: number
): Promise<ApiMeasurement[]> {
  const params = new URLSearchParams({
    stationId: String(stationId),
    productId: String(productId),
  });
  return apiFetch<ApiMeasurement[]>(`/api/measurements?${params}`);
}

/**
 * Individual Values verisini getirir (ham API yanıtı).
 */
export async function fetchIndividualValuesRaw(params: {
  stationId: number;
  productId: number;
  measurements: string[];   // Ölçüm adları
  populationSize: number;
  startDate: string;
  endDate: string;
}): Promise<ApiIndividualValueSeries[]> {
  return apiFetch<ApiIndividualValueSeries[]>("/api/individual-values", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * SPC Values verisini getirir (ham API yanıtı).
 */
export async function fetchSpcValuesRaw(params: {
  stationId: number;
  productId: number;
  measurements: string[];
  populationSize: number;
  startDate: string;
  endDate: string;
}): Promise<ApiSpcSeries[]> {
  return apiFetch<ApiSpcSeries[]>("/api/spc-values", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ---------------------------------------------------------------------------
// API FONKSİYONLARI — Mapper entegreli (UI'a hazır veriler)
// Bileşenler genellikle bu fonksiyonları kullanır.
// ---------------------------------------------------------------------------

/** İstasyonları select için hazır döndürür */
export async function fetchStations(): Promise<SelectOption<number>[]> {
  const raw = await fetchStationsRaw();
  return mapStationsToOptions(raw);
}

/** Ürünleri select için hazır döndürür */
export async function fetchProducts(
  stationId: number,
  number: number
): Promise<{
  options: SelectOption<number>[];
  startDate: string;
  endDate: string;
}> {
  const raw = await fetchProductsRaw(stationId, number);
  return {
    options: mapProductsToOptions(raw.ProductList),
    startDate: raw.StartDate,
    endDate: raw.EndDate,
  };
}

/** Ölçüm tiplerini multi-select için hazır döndürür */
export async function fetchMeasurements(
  stationId: number,
  productId: number
): Promise<MeasurementOption[]> {
  const raw = await fetchMeasurementsRaw(stationId, productId);
  return mapMeasurementsToOptions(raw);
}

/** Individual Values verisini UI-ready (mapper'dan geçmiş) döndürür */
export async function fetchIndividualValues(params: {
  stationId: number;
  productId: number;
  measurements: string[];
  populationSize: number;
  startDate: string;
  endDate: string;
}): Promise<IndividualValueSeries[]> {
  const raw = await fetchIndividualValuesRaw(params);
  return mapIndividualValueSeriesArray(raw);
}

/** SPC Values verisini UI-ready (mapper'dan geçmiş) döndürür */
export async function fetchSpcValues(params: {
  stationId: number;
  productId: number;
  measurements: string[];
  populationSize: number;
  startDate: string;
  endDate: string;
}): Promise<SpcSeries[]> {
  const raw = await fetchSpcValuesRaw(params);
  return mapSpcSeriesArray(raw);
}
