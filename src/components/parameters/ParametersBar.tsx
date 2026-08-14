"use client";
// =============================================================================
// src/components/parameters/ParametersBar.tsx
// Üst Filtre Barı Bileşeni
//
// Bu bileşen Gün 3'ün kalbidir. Şu sorumlulukları üstlenir:
// 1. Zustand store'undan mevcut filter state'ini okur
// 2. TanStack Query ile dropdown listelerini (istasyon/ürün/ölçüm) çeker
// 3. Kullanıcı seçimlerini Zustand store'una yazar
// 4. GET butonuna basıldığında committedFilters snapshot'ı oluşturur
//
// Vue karşılaştırması:
// - selectedStation, selectedProduct → Zustand store (Vuex yerine)
// - stations/products/measurements listesi → useQuery (axios Promise yerine)
// - getValues() metodu → commitFilters action + useIndividualValuesQuery
// =============================================================================

import { useEffect, useCallback } from "react";
import { Activity, BarChart2, GitCompare, Layers, Loader2, ChevronDown, Play } from "lucide-react";
import clsx from "clsx";

import { useSpcStore } from "@/store/useSpcStore";
import {
  useStationsQuery,
  useProductsQuery,
  useMeasurementsQuery,
} from "@/hooks/useSpcQueries";
import { MeasurementMultiSelect } from "./MeasurementMultiSelect";
import type { LayoutType, MeasurementOption } from "@/types/spc";

// ---------------------------------------------------------------------------
// LAYOUT İKONLARI
// ---------------------------------------------------------------------------
const LAYOUT_ICONS: Record<LayoutType, React.ElementType> = {
  "Individual Values": Activity,
  "SPC": BarChart2,
  "Pallet Analysis": Layers,
  "Compare Analysis": GitCompare,
};

const LAYOUT_TYPES: LayoutType[] = [
  "Individual Values",
  "SPC",
  "Pallet Analysis",
  "Compare Analysis",
];

// ---------------------------------------------------------------------------
// ALT BİLEŞENLER
// ---------------------------------------------------------------------------

/** Filtre etiketi + içerik sarmalayıcı */
function FilterGroup({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/** Standart select dropdown */
function StyledSelect({
  id,
  value,
  onChange,
  disabled,
  children,
}: {
  id: string;
  value: string | number;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={clsx(
          "appearance-none rounded-lg border px-3 py-2 pr-8 text-sm",
          "bg-[var(--color-surface)] text-[var(--color-text)]",
          "border-[var(--color-border)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]",
          "transition-colors duration-150",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ANA BİLEŞEN
// ---------------------------------------------------------------------------
export function ParametersBar() {
  // --- Zustand Store ---
  const layoutType         = useSpcStore((s) => s.layoutType);
  const stationId          = useSpcStore((s) => s.stationId);
  const populationSize     = useSpcStore((s) => s.populationSize);
  const productId          = useSpcStore((s) => s.productId);
  const selectedMeasurements = useSpcStore((s) => s.selectedMeasurements);

  const setLayoutType         = useSpcStore((s) => s.setLayoutType);
  const setStationId          = useSpcStore((s) => s.setStationId);
  const setPopulationSize     = useSpcStore((s) => s.setPopulationSize);
  const setProductId          = useSpcStore((s) => s.setProductId);
  const setSelectedMeasurements = useSpcStore((s) => s.setSelectedMeasurements);
  const commitFilters         = useSpcStore((s) => s.commitFilters);

  // --- TanStack Query ---
  const stationsQuery     = useStationsQuery();
  const productsQuery     = useProductsQuery();
  const measurementsQuery = useMeasurementsQuery();

  const isParametersLoading =
    stationsQuery.isLoading ||
    productsQuery.isFetching ||
    measurementsQuery.isFetching;

  // -----------------------------------------------------------------------
  // Efektler: Cascade otomatik seçimler
  // Vue'daki watch() + store dispatch zincirinin React karşılığı
  // -----------------------------------------------------------------------

  // İstasyon listesi gelince ilk istasyonu otomatik seç
  useEffect(() => {
    if (stationsQuery.data && stationsQuery.data.length > 0 && stationId === null) {
      const firstStation = stationsQuery.data[0];
      setStationId(firstStation.value);
    }
  }, [stationsQuery.data, stationId, setStationId]);

  // Ürün listesi gelince ilk ürünü otomatik seç
  useEffect(() => {
    if (productsQuery.data && productsQuery.data.options.length > 0 && productId === null) {
      setProductId(productsQuery.data.options[0].value);
    }
  }, [productsQuery.data, productId, setProductId]);

  // Ölçüm listesi gelince ilk ölçümü otomatik seç
  useEffect(() => {
    if (measurementsQuery.data && measurementsQuery.data.length > 0 && selectedMeasurements.length === 0) {
      setSelectedMeasurements([measurementsQuery.data[0]]);
    }
  }, [measurementsQuery.data, selectedMeasurements.length, setSelectedMeasurements]);

  // -----------------------------------------------------------------------
  // GET butonuna basıldığında
  // -----------------------------------------------------------------------
  const handleGetClick = useCallback(() => {
    const startDate = productsQuery.data?.startDate ?? new Date(Date.now() - 86400000).toISOString();
    const endDate   = productsQuery.data?.endDate   ?? new Date().toISOString();
    commitFilters(startDate, endDate);
  }, [productsQuery.data, commitFilters]);

  // -----------------------------------------------------------------------
  // Population Size: SPC modunda 200'ün katı
  // -----------------------------------------------------------------------
  const popSizeMin  = layoutType === "SPC" ? 200 : 1;
  const popSizeStep = layoutType === "SPC" ? 200 : 1;

  const handlePopSizeInput = (raw: string) => {
    const num = parseInt(raw);
    if (!isNaN(num)) setPopulationSize(num);
  };

  const handlePopSizeBlur = () => {
    // Blur'da kesin düzeltme (clamp + round)
    setPopulationSize(populationSize);
  };

  // -----------------------------------------------------------------------
  // GET butonu aktif mi?
  // -----------------------------------------------------------------------
  const canGet =
    !isParametersLoading &&
    stationId !== null &&
    productId !== null &&
    selectedMeasurements.length > 0;

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------
  return (
    <div
      id="parameters-bar"
      className={clsx(
        "flex flex-wrap items-end gap-4 px-4 py-3",
        "border-b border-[var(--color-border)]",
        "bg-[var(--color-surface)] backdrop-blur-sm"
      )}
    >
      {/* ── Layout Type ──────────────────────────────────────── */}
      <FilterGroup label="Layout Type" htmlFor="select-layout-type">
        <StyledSelect
          id="select-layout-type"
          value={layoutType}
          onChange={(v) => setLayoutType(v as LayoutType)}
        >
          {LAYOUT_TYPES.map((lt) => {
            const Icon = LAYOUT_ICONS[lt];
            return (
              <option key={lt} value={lt}>
                {lt}
              </option>
            );
          })}
        </StyledSelect>
      </FilterGroup>

      {/* Separator */}
      <div className="hidden h-10 w-px bg-[var(--color-border)] sm:block" />

      {/* ── Station ─────────────────────────────────────────── */}
      <FilterGroup label="Station" htmlFor="select-station">
        {stationsQuery.isLoading ? (
          <div className="flex h-9 w-40 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-muted)]">
            <Loader2 size={12} className="animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          <StyledSelect
            id="select-station"
            value={stationId ?? ""}
            onChange={(v) => setStationId(parseInt(v))}
          >
            {stationId === null && (
              <option value="" disabled>
                Select station
              </option>
            )}
            {stationsQuery.data?.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </StyledSelect>
        )}
      </FilterGroup>

      {/* ── Population Size ──────────────────────────────────── */}
      <FilterGroup label="Population Size" htmlFor="input-pop-size">
        <div className="flex flex-col gap-1">
          <input
            id="input-pop-size"
            type="number"
            min={popSizeMin}
            max={30000}
            step={popSizeStep}
            value={populationSize}
            onChange={(e) => handlePopSizeInput(e.target.value)}
            onBlur={handlePopSizeBlur}
            className={clsx(
              "w-24 rounded-lg border px-3 py-2 text-sm",
              "bg-[var(--color-surface)] text-[var(--color-text)]",
              "border-[var(--color-border)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40",
              "transition-colors duration-150 [appearance:textfield]",
              "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            )}
          />
          <input
            id="slider-pop-size"
            type="range"
            min={popSizeMin}
            max={30000}
            step={popSizeStep}
            value={populationSize}
            onChange={(e) => handlePopSizeInput(e.target.value)}
            onMouseUp={handlePopSizeBlur}
            className={clsx(
              "w-24 accent-[var(--color-accent)] cursor-pointer",
              "h-1 rounded-full"
            )}
          />
        </div>
      </FilterGroup>

      {/* ── Selected Product ─────────────────────────────────── */}
      <FilterGroup label="Product" htmlFor="select-product">
        {productsQuery.isFetching ? (
          <div className="flex h-9 w-40 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-muted)]">
            <Loader2 size={12} className="animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          <StyledSelect
            id="select-product"
            value={productId ?? ""}
            onChange={(v) => setProductId(parseInt(v))}
            disabled={stationId === null}
          >
            {productId === null && (
              <option value="" disabled>
                Select product
              </option>
            )}
            {productsQuery.data?.options.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </StyledSelect>
        )}
      </FilterGroup>

      {/* ── Measurement Types ────────────────────────────────── */}
      <FilterGroup label="Measurement Types">
        {measurementsQuery.isFetching ? (
          <div className="flex h-9 w-52 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-muted)]">
            <Loader2 size={12} className="animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          <MeasurementMultiSelect
            options={measurementsQuery.data ?? []}
            selected={selectedMeasurements}
            onChange={(opts: MeasurementOption[]) => setSelectedMeasurements(opts)}
            disabled={productId === null}
          />
        )}
      </FilterGroup>

      {/* ── GET Butonu ───────────────────────────────────────── */}
      <div className="flex items-end">
        <button
          id="btn-get-data"
          type="button"
          onClick={handleGetClick}
          disabled={!canGet}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold",
            "transition-all duration-200",
            canGet
              ? [
                  "bg-[var(--color-accent)] text-white",
                  "hover:bg-[var(--color-accent-hover)] hover:shadow-lg hover:shadow-[var(--color-accent)]/30",
                  "active:scale-95",
                ]
              : "cursor-not-allowed bg-[var(--color-border)] text-[var(--color-muted)]"
          )}
        >
          {isParametersLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
          GET
        </button>
      </div>
    </div>
  );
}
