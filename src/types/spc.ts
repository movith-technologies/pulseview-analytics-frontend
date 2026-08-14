// =============================================================================
// src/types/spc.ts
// TypeScript Sözlüğü — Ham API tipleri ve temiz UI tipleri ayrı tutulur.
// =============================================================================

// ---------------------------------------------------------------------------
// 1. ENUM — Layout Tipleri
// ---------------------------------------------------------------------------
export type LayoutType =
  | "Individual Values"
  | "SPC"
  | "Pallet Analysis"
  | "Compare Analysis";

// ---------------------------------------------------------------------------
// 2. RAW API TİPLERİ
// Bunlar backend'in döndürdüğü alan adlarını birebir yansıtır.
// Değiştirme! Gerçek backend geldiğinde bu yapı korunacak.
// ---------------------------------------------------------------------------

/** GetStations API yanıtındaki her istasyon kaydı */
export interface ApiStation {
  PlantID: number;
  LineID: number;
  LineName: string;
  WorkcenterID: number;
  StationID: number;
  StationTypeID: number;
  WorkcenterName: string;
  StationTypeName: string;
  StationName: string;
  HASSPC: boolean;
}

/** GetIndividualProducts API yanıtı */
export interface ApiProductsResponse {
  StartDate: string;   // ISO 8601
  EndDate: string;     // ISO 8601
  ProductList: ApiProduct[];
}
export interface ApiProduct {
  Id: number;
  Name: string;
}

/** GetMeasurements API yanıtındaki her ölçüm tipi */
export interface ApiMeasurement {
  ID: number;
  StationID: number;
  Name: string;
  IsVisible: boolean;
}

/**
 * Ham tekil değer noktası (DataList içindeki her satır).
 * Pallet -> palet numarası, Piece -> mandren/navetta ID
 */
export interface ApiDataPoint {
  Date: string;        // ISO 8601
  Value: number;
  Product: number;
  MeasurementName: string;
  Piece: number | null;
  MandrenNavetta?: string;
}

/**
 * GetIndividualValues API yanıtındaki her ölçüm serisi.
 *
 * ⚠️  KRITIK TERSLIK NOTU:
 *   - "UCL" alanı → Gerçek UCL (Control Limit Üst)
 *   - "LCL" alanı → Gerçek LCL (Control Limit Alt)
 *   - "Max" alanı → Monitoring Limit Maks (geniş sarı bant ÜSTÜ)
 *   - "Min" alanı → Monitoring Limit Min  (geniş sarı bant ALTI)
 *   - "Avg" / "mean" → Genel ortalama
 * AverageChart.vue'da "data.Max" yeşil bant (UCL), "data.PreMax" sarı bant
 * (monitoringMax) olarak kullanılmıştır. Bu isimler artık mapper'da düzeltilir.
 */
export interface ApiIndividualValueSeries {
  MeasurementName: string;
  MeasureTypeId: number;
  UCL: number;           // Control Limit Üst
  LCL: number;           // Control Limit Alt
  Avg: number;           // Genel ortalama (mean)
  Max: number;           // Monitoring Limit Üst (geniş sarı bant)
  Min: number;           // Monitoring Limit Alt (geniş sarı bant)
  PPM: number;
  OK: number;
  NOK: number;
  IndividualValues: ApiDataPoint[];
}

/**
 * GetSPCValues API yanıtındaki her grup kaydı (200'lük örneklem).
 *
 * ⚠️  KRITIK TERSLIK NOTU (AverageChart.vue'dan tersine mühendislik):
 *   data.Max   → yeşil band → UCL (Control Limit Üst)
 *   data.Min   → yeşil band → LCL (Control Limit Alt)
 *   data.PreMax → sarı band → Monitoring Max
 *   data.PreMin → sarı band → Monitoring Min
 *   data.AverageSpc → kırmızı çizgi → genel ortalama
 *   data.SpcValues[i].Avg → mavi çizgi → grup ortalaması
 *   data.SpcValues[i].Sigma → grup standart sapması
 */
export interface ApiSpcGroup {
  Avg: number;    // Bu grubun ortalaması (x-bar)
  Sigma: number;  // Bu grubun standart sapması
  GroupIndex: number;
}

export interface ApiSpcSeries {
  MeasurementName: string;
  MeasureTypeId: number;
  Max: number;        // → UCL (Control Limit Üst) — YEŞİL bant
  Min: number;        // → LCL (Control Limit Alt) — YEŞİL bant
  PreMax: number;     // → Monitoring Max — SARI bant
  PreMin: number;     // → Monitoring Min — SARI bant
  AverageSpc: number; // → Genel ortalama — KIRMIZI çizgi
  SpcValues: ApiSpcGroup[];
}

// ---------------------------------------------------------------------------
// 3. UI TİPLERİ (Mapper çıktısı — temiz isimler)
// Grafik bileşenleri yalnızca bu tipleri kullanır.
// ---------------------------------------------------------------------------

/** Seçilebilir bir dropdown/select seçeneği */
export interface SelectOption<T = number> {
  value: T;
  label: string;
}

/** Çoklu seçim için ölçüm tipi seçeneği */
export interface MeasurementOption {
  id: number;
  name: string;
}

/** Tekil değer — tek bir zaman noktasındaki ölçüm */
export interface DataPoint {
  date: string;        // ISO 8601
  value: number;
  palletNumber: number | null;  // Palet analizi için
  productId: number;
}

/**
 * Temiz adlandırılmış Individual Values serisi.
 * Grafik bileşeni bu tipi prop olarak alır.
 */
export interface IndividualValueSeries {
  measurementName: string;
  measureTypeId: number;
  // Kontrol Limitleri (Control Limits) — DAR YEŞİL bant
  ucl: number;
  lcl: number;
  // İzleme Limitleri (Monitoring Limits) — GENİŞ SARI bant
  monitoringMax: number;
  monitoringMin: number;
  // İstatistikler
  mean: number;
  ppm: number;
  okCount: number;
  nokCount: number;
  // Veri noktaları
  dataPoints: DataPoint[];
}

/** Temiz adlandırılmış SPC serisi */
export interface SpcSeries {
  measurementName: string;
  measureTypeId: number;
  // Kontrol Limitleri — DAR YEŞİL bant
  ucl: number;
  lcl: number;
  // İzleme Limitleri — GENİŞ SARI bant
  monitoringMax: number;
  monitoringMin: number;
  // Genel ortalama — KIRMIZI çizgi
  mean: number;
  // 200'lük alt gruplar
  groups: SpcGroup[];
}

/** SPC alt grubu (200 ölçümden hesaplanmış) */
export interface SpcGroup {
  groupIndex: number;
  avg: number;    // x-bar
  sigma: number;  // standart sapma
}

// ---------------------------------------------------------------------------
// 4. STORE TİPLERİ
// ---------------------------------------------------------------------------

/** Zustand store'unun şekli */
export interface SpcStoreState {
  layoutType: LayoutType;
  stationId: number | null;
  populationSize: number;
  productId: number | null;
  selectedMeasurements: MeasurementOption[];
  // Filtre geçmişi (datalar buradan tetiklenir)
  committedFilters: CommittedFilters | null;
}

/** GET butonuna basıldığında store'a "commit" edilen filtreler */
export interface CommittedFilters {
  layoutType: LayoutType;
  stationId: number;
  populationSize: number;
  productId: number;
  measurements: MeasurementOption[];
  startDate: string;
  endDate: string;
}

export interface SpcStoreActions {
  setLayoutType: (layout: LayoutType) => void;
  setStationId: (id: number | null) => void;
  setPopulationSize: (size: number) => void;
  setProductId: (id: number | null) => void;
  setSelectedMeasurements: (measurements: MeasurementOption[]) => void;
  commitFilters: (startDate: string, endDate: string) => void;
  resetFilters: () => void;
}

export type SpcStore = SpcStoreState & SpcStoreActions;
