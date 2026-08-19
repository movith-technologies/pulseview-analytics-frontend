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
// 2. RAW API TIPLERI
// ---------------------------------------------------------------------------

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

export interface ApiProductsResponse {
  StartDate: string;
  EndDate: string;
  ProductList: ApiProduct[];
}
export interface ApiProduct {
  Id: number;
  Name: string;
}

export interface ApiMeasurement {
  ID: number;
  StationID: number;
  Name: string;
  IsVisible: boolean;
}

/**
 * Ham tekil veri noktası.
 * Pallet -> palet numarası, Piece -> mandren/navetta ID.
 * ÖNEMLİ: API bazen Pallet, bazen Piece döndürür.
 * Mapper'da: palletNumber = e.Pallet ?? e.Piece ?? null (fallback zinciri)
 */
export interface ApiDataPoint {
  Date: string;
  Value: number;
  Product: number;
  MeasurementName: string;
  Pallet?: number | null;
  Piece?: number | null;
  ProdId?: number;
  MandrenNavetta?: string;
}

export interface ApiIndividualValueSeries {
  MeasurementName: string;
  MeasureTypeId: number;
  UCL: number;
  LCL: number;
  Avg: number;
  Max: number;
  Min: number;
  PPM: number;
  OK: number;
  NOK: number;
  IndividualValues: ApiDataPoint[];
}

export interface ApiSpcGroup {
  Avg: number;
  Sigma: number;
  GroupIndex: number;
}

export interface ApiSpcSeries {
  MeasurementName: string;
  MeasureTypeId: number;
  Max: number;
  Min: number;
  PreMax: number;
  PreMin: number;
  AverageSpc: number;
  SpcValues: ApiSpcGroup[];
}

// ---------------------------------------------------------------------------
// 3. UI TIPLERI (Mapper çıktısı — temiz isimler)
// ---------------------------------------------------------------------------

export interface SelectOption<T = number> {
  value: T;
  label: string;
}

export interface MeasurementOption {
  id: number;
  name: string;
}

/** Tekil değer — tek bir zaman noktasındaki ölçüm */
export interface DataPoint {
  date: string;
  value: number;
  /**
   * Palet numarası.
   * Kaynak: ApiDataPoint.Pallet ?? ApiDataPoint.Piece ?? null
   * PalletChart bu alanı X ekseni olarak kullanır.
   */
  palletNumber: number | null;
  productId: number;
}

/** Temiz adlandırılmış Individual Values serisi */
export interface IndividualValueSeries {
  measurementName: string;
  measureTypeId: number;
  ucl: number;
  lcl: number;
  monitoringMax: number;
  monitoringMin: number;
  mean: number;
  ppm: number;
  okCount: number;
  nokCount: number;
  dataPoints: DataPoint[];
}

// ---------------------------------------------------------------------------
// 4. PALLET ANALİZİ TİPLERİ
// ---------------------------------------------------------------------------

/**
 * Scatter plot için hazırlanmış tek palet noktası.
 * x = palletNumber, y = value
 * PalletChart bu yapıyı Highcharts scatter serisi olarak kullanır.
 */
export interface PalletPoint {
  /** X ekseni: palet numarası (Pallet ?? Piece fallback) */
  x: number;
  /** Y ekseni: ölçüm değeri */
  y: number;
  /** Tooltip'te gösterilecek ürün ID'si */
  prodId: number;
  /** Tooltip'te gösterilecek palet numarası */
  pallet: number;
}

/**
 * PalletChart bileşenine iletilen tam seri verisi.
 * IndividualValueSeries'ten türetilir.
 */
export interface PalletSeries {
  measurementName: string;
  measureTypeId: number;
  /** X ekseninin üst sınırı: maxPalletNumber + 1 */
  maxPalletValue: number;
  /** Monitoring Limit Üst (kırmızı çizgi) */
  monitoringMax: number;
  /** Monitoring Limit Alt (kırmızı çizgi) */
  monitoringMin: number;
  /** Ortalama (turuncu kesikli) */
  mean: number;
  /** Scatter noktaları */
  points: PalletPoint[];
}

// ---------------------------------------------------------------------------
// 5. COMPARE ANALİZİ TİPLERİ
// ---------------------------------------------------------------------------

/**
 * Compare Analysis için zaman-eksenli tek nokta.
 * x = Unix timestamp (ms), y = değer
 */
export interface ComparePoint {
  x: number;     // Unix ms — Highcharts datetime ekseni
  y: number;
  pallet: number | null;
  date: string;  // Formatlanmış string (tooltip)
}

/**
 * CompareChart'ın tek serisi (her ölçüm tipi bir seri).
 */
export interface CompareSeries {
  measurementName: string;
  measureTypeId: number;
  /** Monitoring Limit Üst — ilk seriden alınır */
  monitoringMax: number;
  /** Monitoring Limit Alt */
  monitoringMin: number;
  /** Ortalama */
  mean: number;
  points: ComparePoint[];
}

// ---------------------------------------------------------------------------
// 6. SPC TİPLERİ
// ---------------------------------------------------------------------------

export interface SpcSeries {
  measurementName: string;
  measureTypeId: number;
  ucl: number;
  lcl: number;
  monitoringMax: number;
  monitoringMin: number;
  mean: number;
  groups: SpcGroup[];
}

export interface SpcGroup {
  groupIndex: number;
  avg: number;
  sigma: number;
}

// ---------------------------------------------------------------------------
// 7. STORE TİPLERİ
// ---------------------------------------------------------------------------

export interface SpcStoreState {
  layoutType: LayoutType;
  stationId: number | null;
  populationSize: number;
  productId: number | null;
  selectedMeasurements: MeasurementOption[];
  committedFilters: CommittedFilters | null;
}

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
