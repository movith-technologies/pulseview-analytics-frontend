// =============================================================================
// src/lib/mock/mockDb.ts
// Sabit referans verileri — İstasyon, ürün ve ölçüm listeleri.
// Gerçek backend geldiğinde bu dosya tamamen silinir.
// =============================================================================

import type { ApiStation, ApiProduct, ApiMeasurement } from "@/types/spc";

// ---------------------------------------------------------------------------
// İstasyon Listesi
// Orijinal API response'undan (responses.txt) alınan yapı korundu.
// ---------------------------------------------------------------------------
export const MOCK_STATIONS: ApiStation[] = [
  {
    PlantID: 1,
    LineID: 1,
    LineName: "101",
    WorkcenterID: 1,
    StationID: 11,
    StationTypeID: 1,
    WorkcenterName: "APL",
    StationTypeName: "Camera",
    StationName: "Primary Camera",
    HASSPC: true,
  },
  {
    PlantID: 1,
    LineID: 1,
    LineName: "102",
    WorkcenterID: 2,
    StationID: 22,
    StationTypeID: 2,
    WorkcenterName: "WLD",
    StationTypeName: "Welder",
    StationName: "Welding Station A",
    HASSPC: true,
  },
  {
    PlantID: 1,
    LineID: 2,
    LineName: "201",
    WorkcenterID: 3,
    StationID: 33,
    StationTypeID: 1,
    WorkcenterName: "QC",
    StationTypeName: "Camera",
    StationName: "Secondary Camera",
    HASSPC: true,
  },
  {
    PlantID: 1,
    LineID: 2,
    LineName: "202",
    WorkcenterID: 4,
    StationID: 44,
    StationTypeID: 2,
    WorkcenterName: "WLD",
    StationTypeName: "Welder",
    StationName: "Welding Station B",
    HASSPC: false,
  },
];

// ---------------------------------------------------------------------------
// Her istasyona ait ürün listeleri
// ---------------------------------------------------------------------------
export const MOCK_PRODUCTS_BY_STATION: Record<number, ApiProduct[]> = {
  11: [
    { Id: 816, Name: "BMW G3" },
    { Id: 817, Name: "BMW G5" },
    { Id: 818, Name: "Toyota Corolla Hybrid" },
  ],
  22: [
    { Id: 901, Name: "Volkswagen ID.4" },
    { Id: 902, Name: "Audi e-tron" },
  ],
  33: [
    { Id: 816, Name: "BMW G3" },
    { Id: 1001, Name: "Mercedes EQC" },
    { Id: 1002, Name: "Mercedes EQS" },
  ],
  44: [
    { Id: 1101, Name: "Ford Mustang Mach-E" },
    { Id: 1102, Name: "Ford F-150 Lightning" },
  ],
};

// ---------------------------------------------------------------------------
// Her istasyon+ürün kombinasyonuna ait ölçüm tipleri
// ---------------------------------------------------------------------------
export const MOCK_MEASUREMENTS_BY_STATION: Record<number, ApiMeasurement[]> = {
  11: [
    { ID: 134937, StationID: 11, Name: "T1 Left Wire Height", IsVisible: true },
    { ID: 134938, StationID: 11, Name: "T1 Right Wire Height", IsVisible: true },
    { ID: 134939, StationID: 11, Name: "T1 Left Wire Width", IsVisible: true },
    { ID: 134940, StationID: 11, Name: "T1 Right Wire Width", IsVisible: true },
    { ID: 134941, StationID: 11, Name: "Weld Penetration Depth", IsVisible: true },
  ],
  22: [
    { ID: 200001, StationID: 22, Name: "Arc Voltage", IsVisible: true },
    { ID: 200002, StationID: 22, Name: "Wire Feed Speed", IsVisible: true },
    { ID: 200003, StationID: 22, Name: "Heat Input", IsVisible: true },
    { ID: 200004, StationID: 22, Name: "Travel Speed", IsVisible: true },
  ],
  33: [
    { ID: 300001, StationID: 33, Name: "Part Height", IsVisible: true },
    { ID: 300002, StationID: 33, Name: "Part Width", IsVisible: true },
    { ID: 300003, StationID: 33, Name: "Surface Roughness Ra", IsVisible: true },
  ],
  44: [
    { ID: 400001, StationID: 44, Name: "Torque Output", IsVisible: true },
    { ID: 400002, StationID: 44, Name: "Current Draw", IsVisible: true },
  ],
};

// ---------------------------------------------------------------------------
// Her ölçüm için istatistiksel parametreler
// Bunlar mock motor tarafından tutarlı veri üretmek için kullanılır.
// ---------------------------------------------------------------------------
export interface MeasurementParams {
  mean: number;       // Süreç ortalaması
  stdDev: number;     // Süreç standart sapması
  ucl: number;        // Control Limit Üst (dar yeşil bant)
  lcl: number;        // Control Limit Alt (dar yeşil bant)
  monitoringMax: number;  // Monitoring Limit Üst (geniş sarı bant)
  monitoringMin: number;  // Monitoring Limit Alt (geniş sarı bant)
}

export const MEASUREMENT_PARAMS: Record<number, MeasurementParams> = {
  // Stasyon 11 - BMW kamera
  134937: { mean: 350000, stdDev: 40000, ucl: 450000, lcl: 250000, monitoringMax: 520000, monitoringMin: 180000 },
  134938: { mean: 355000, stdDev: 42000, ucl: 460000, lcl: 248000, monitoringMax: 530000, monitoringMin: 175000 },
  134939: { mean: 1200,   stdDev: 80,    ucl: 1420,   lcl: 980,    monitoringMax: 1500,   monitoringMin: 900    },
  134940: { mean: 1210,   stdDev: 85,    ucl: 1430,   lcl: 990,    monitoringMax: 1510,   monitoringMin: 895    },
  134941: { mean: 4.5,    stdDev: 0.3,   ucl: 5.4,    lcl: 3.6,    monitoringMax: 5.8,    monitoringMin: 3.2    },
  // Stasyon 22 - Kaynak
  200001: { mean: 24.5,   stdDev: 0.8,   ucl: 27.0,   lcl: 22.0,   monitoringMax: 28.5,   monitoringMin: 20.5   },
  200002: { mean: 8500,   stdDev: 200,   ucl: 9100,   lcl: 7900,   monitoringMax: 9500,   monitoringMin: 7500   },
  200003: { mean: 1.2,    stdDev: 0.05,  ucl: 1.35,   lcl: 1.05,   monitoringMax: 1.45,   monitoringMin: 0.95   },
  200004: { mean: 350,    stdDev: 15,    ucl: 395,    lcl: 305,    monitoringMax: 420,    monitoringMin: 280    },
  // Stasyon 33 - QC
  300001: { mean: 125.0,  stdDev: 0.5,   ucl: 126.5,  lcl: 123.5,  monitoringMax: 127.5,  monitoringMin: 122.5  },
  300002: { mean: 80.0,   stdDev: 0.3,   ucl: 80.9,   lcl: 79.1,   monitoringMax: 81.5,   monitoringMin: 78.5   },
  300003: { mean: 0.8,    stdDev: 0.05,  ucl: 0.95,   lcl: 0.65,   monitoringMax: 1.05,   monitoringMin: 0.55   },
  // Stasyon 44 - Motor
  400001: { mean: 85.0,   stdDev: 2.5,   ucl: 92.5,   lcl: 77.5,   monitoringMax: 96.0,   monitoringMin: 74.0   },
  400002: { mean: 12.5,   stdDev: 0.4,   ucl: 13.7,   lcl: 11.3,   monitoringMax: 14.5,   monitoringMin: 10.5   },
};

// Varsayılan parametreler (tanımlanmamış ölçümler için fallback)
export const DEFAULT_MEASUREMENT_PARAMS: MeasurementParams = {
  mean: 100, stdDev: 10, ucl: 130, lcl: 70, monitoringMax: 150, monitoringMin: 50,
};
