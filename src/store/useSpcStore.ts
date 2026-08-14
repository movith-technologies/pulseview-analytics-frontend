// =============================================================================
// src/store/useSpcStore.ts
// Zustand Global State Yönetimi
//
// Zustand vs TanStack Query iş bölümü:
//   - Zustand: UI STATE (kullanıcı seçimleri, filtreler, layout modu)
//     → "Kullanıcı şu anda ne seçti?" sorusunun cevabı
//   - TanStack Query: SERVER STATE (API'den gelen veriler)
//     → "Sunucu ne döndürüyor?" sorusunun cevabı + cache + loading/error
//
// Zustand'a koydukların:
//   layoutType, stationId, populationSize, selectedProduct, selectedMeasurements
//   committedFilters (GET butonuna basıldığında "snapshot" alınır)
//
// TanStack Query'e koydukların:
//   stations listesi, products listesi, measurements listesi
//   individualValues verisi, spcValues verisi
// =============================================================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { LayoutType, MeasurementOption, CommittedFilters, SpcStore } from "@/types/spc";

// ---------------------------------------------------------------------------
// BAŞLANGIÇ DEĞERLERİ
// ---------------------------------------------------------------------------
const DEFAULT_POPULATION_SIZE = 200;
const DEFAULT_LAYOUT_TYPE: LayoutType = "Individual Values";

// ---------------------------------------------------------------------------
// STORE TANIMI
// ---------------------------------------------------------------------------
export const useSpcStore = create<SpcStore>()(
  devtools(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // STATE
      // -----------------------------------------------------------------------
      layoutType: DEFAULT_LAYOUT_TYPE,
      stationId: null,
      populationSize: DEFAULT_POPULATION_SIZE,
      productId: null,
      selectedMeasurements: [],
      committedFilters: null,

      // -----------------------------------------------------------------------
      // ACTION: Layout tipini değiştir
      // SPC moduna geçildiğinde populationSize 200'ün katına yuvarlanır
      // -----------------------------------------------------------------------
      setLayoutType: (layout: LayoutType) => {
        set((state) => {
          let newPopulationSize = state.populationSize;

          if (layout === "SPC") {
            // SPC modunda 200'ün katı olmalı
            const remainder = newPopulationSize % 200;
            if (remainder !== 0) {
              if (remainder >= 100) {
                newPopulationSize += 200 - remainder;
              } else {
                newPopulationSize = Math.max(200, newPopulationSize - remainder);
              }
            }
            newPopulationSize = Math.max(200, newPopulationSize);
          }

          return { layoutType: layout, populationSize: newPopulationSize };
        });
      },

      // -----------------------------------------------------------------------
      // ACTION: İstasyonu değiştir
      // İstasyon değiştiğinde ürün ve ölçümler sıfırlanır (cascade)
      // -----------------------------------------------------------------------
      setStationId: (id: number | null) => {
        set({
          stationId: id,
          productId: null,              // Cascade: istasyon değişince ürün sıfırla
          selectedMeasurements: [],     // Cascade: ölçüm tiplerini sıfırla
          committedFilters: null,       // Önceki veri geçersiz
        });
      },

      // -----------------------------------------------------------------------
      // ACTION: Population Size değiştir
      // SPC modunda 200'ün katı olacak şekilde yuvarlanır
      // -----------------------------------------------------------------------
      setPopulationSize: (size: number) => {
        const { layoutType } = get();
        let corrected = Math.max(1, Math.min(30000, size));

        if (layoutType === "SPC") {
          const remainder = corrected % 200;
          if (remainder !== 0) {
            if (remainder >= 100) {
              corrected = Math.min(30000, corrected + (200 - remainder));
            } else {
              corrected = Math.max(200, corrected - remainder);
            }
          }
          corrected = Math.max(200, corrected);
        }

        set({ populationSize: corrected });
      },

      // -----------------------------------------------------------------------
      // ACTION: Ürün değiştir
      // -----------------------------------------------------------------------
      setProductId: (id: number | null) => {
        set({
          productId: id,
          selectedMeasurements: [],  // Cascade: ürün değişince ölçümler sıfırla
        });
      },

      // -----------------------------------------------------------------------
      // ACTION: Ölçüm seçimini güncelle
      // -----------------------------------------------------------------------
      setSelectedMeasurements: (measurements: MeasurementOption[]) => {
        set({ selectedMeasurements: measurements });
      },

      // -----------------------------------------------------------------------
      // ACTION: GET butonuna basıldığında filtreleri "commit" et
      // Bu action veri çekme sorgularını tetikler.
      // startDate ve endDate, products fetch'ten gelir ve buraya iletilir.
      // -----------------------------------------------------------------------
      commitFilters: (startDate: string, endDate: string) => {
        const state = get();

        if (!state.stationId || !state.productId || state.selectedMeasurements.length === 0) {
          console.warn("[SpcStore] commitFilters: Eksik filtreler, commit edilmedi.");
          return;
        }

        const committed: CommittedFilters = {
          layoutType: state.layoutType,
          stationId: state.stationId,
          populationSize: state.populationSize,
          productId: state.productId,
          measurements: state.selectedMeasurements,
          startDate,
          endDate,
        };

        set({ committedFilters: committed });
      },

      // -----------------------------------------------------------------------
      // ACTION: Tüm filtreleri sıfırla
      // -----------------------------------------------------------------------
      resetFilters: () => {
        set({
          layoutType: DEFAULT_LAYOUT_TYPE,
          stationId: null,
          populationSize: DEFAULT_POPULATION_SIZE,
          productId: null,
          selectedMeasurements: [],
          committedFilters: null,
        });
      },
    }),
    {
      name: "spc-store",  // Redux DevTools'da görünecek isim
    }
  )
);

// ---------------------------------------------------------------------------
// SELEKTİFLER — Bileşenler gereksiz re-render'dan kaçınmak için
// sadece ihtiyaç duydukları state parçasını seçer.
// ---------------------------------------------------------------------------

/** Layout tipini seç */
export const selectLayoutType = (s: SpcStore) => s.layoutType;

/** İstasyon ID'sini seç */
export const selectStationId = (s: SpcStore) => s.stationId;

/** Population size'ı seç */
export const selectPopulationSize = (s: SpcStore) => s.populationSize;

/** Ürün ID'sini seç */
export const selectProductId = (s: SpcStore) => s.productId;

/** Seçili ölçümleri seç */
export const selectMeasurements = (s: SpcStore) => s.selectedMeasurements;

/** Commit edilen filtreleri seç */
export const selectCommittedFilters = (s: SpcStore) => s.committedFilters;

/** Filtre barının geçerli/dolu olup olmadığını kontrol eder */
export const selectIsFilterReady = (s: SpcStore) =>
  s.stationId !== null &&
  s.productId !== null &&
  s.selectedMeasurements.length > 0;
