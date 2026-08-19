"use client";
// =============================================================================
// app/page.tsx
// Ana Dashboard Sayfası — Gün 6 Güncellemesi
//
// 4 Layout Tipi Tam Desteği:
//   - "Individual Values" → IndividualValuesLayout
//   - "SPC"               → SpcLayout
//   - "Pallet Analysis"   → PalletLayout
//   - "Compare Analysis"  → CompareLayout
//
// TanStack Query States:
//   isPending → Skeleton animasyonu (LoadingState)
//   isError   → Retry butonu + hata mesajı (ErrorState)
//
// State akışı:
//   Zustand committedFilters → TanStack Query tetiklenir → Layout render
// =============================================================================

import { useSpcStore } from "@/store/useSpcStore";
import {
  useIndividualValuesQuery,
  useSpcValuesQuery,
} from "@/hooks/useSpcQueries";
import { ParametersBar }          from "@/components/parameters/ParametersBar";
import { IndividualValuesLayout } from "@/components/charts/individual/IndividualValuesLayout";
import { SpcLayout }              from "@/components/charts/spc/SpcLayout";
import { PalletLayout }           from "@/components/charts/pallet/PalletLayout";
import { CompareLayout }          from "@/components/charts/compare/CompareLayout";
import {
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Layers,
} from "lucide-react";
import type { IndividualValueSeries, SpcSeries, LayoutType } from "@/types/spc";

// =============================================================================
// LOADING STATE — TanStack Query isPending
// Skeleton animasyonu + layout adı göstergesi
// =============================================================================
function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Başlık skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <div className="h-3 w-40 animate-pulse rounded-full bg-[var(--color-border)]" />
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      {/* Ana içerik skeleton kartları */}
      {Array.from({ length: label === "Individual Values" ? 2 : 1 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          {/* Kart başlık skeleton */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
            <div className="h-3 w-48 animate-pulse rounded-full bg-[var(--color-border)]" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="h-5 w-16 animate-pulse rounded-md bg-[var(--color-border)]"
                />
              ))}
            </div>
          </div>

          {/* Grafik alanı skeleton */}
          <div className="relative overflow-hidden p-4">
            <div className="h-64 w-full animate-pulse rounded-lg bg-[var(--color-border)]" />
            {/* Animasyonlu parlama efekti */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                animation: "shimmer 1.8s infinite",
              }}
            />
          </div>
        </div>
      ))}

      {/* İkinci satır (Individual Values için 2 sütunlu) */}
      {label === "Individual Values" && (
        <div className="grid grid-cols-[3fr_7fr] gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            />
          ))}
        </div>
      )}

      {/* Yükleme göstergesi */}
      <div className="flex items-center justify-center gap-2 py-2 text-[var(--color-muted)]">
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)]" style={{ animationDelay: "0ms" }} />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)]" style={{ animationDelay: "150ms" }} />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)]" style={{ animationDelay: "300ms" }} />
        <span className="ml-1 text-xs">Loading {label}...</span>
      </div>
    </div>
  );
}

// =============================================================================
// ERROR STATE — TanStack Query isError
// Hata mesajı + retry butonu
// =============================================================================
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8">
      {/* Hata ikonu */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
        <AlertCircle size={32} className="text-red-400" />
      </div>

      {/* Hata başlığı */}
      <div className="text-center">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          Data Load Failed
        </h2>
        <p className="mt-1 max-w-md text-sm text-[var(--color-muted)]">
          An error occurred while fetching chart data.
        </p>
      </div>

      {/* Hata mesajı — teknik detay */}
      <div className="max-w-lg rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
        <p className="break-words font-mono text-xs text-red-400">{message}</p>
      </div>

      {/* Retry butonu */}
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-95"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

// =============================================================================
// EMPTY STATE — committedFilters henüz yok
// =============================================================================
function EmptyState({ layoutType }: { layoutType: LayoutType }) {
  const layoutIcons: Record<LayoutType, React.ReactNode> = {
    "Individual Values": <TrendingUp size={28} className="text-[var(--color-accent)]" />,
    "SPC":               <Layers size={28} className="text-[var(--color-accent)]" />,
    "Pallet Analysis":   <TrendingUp size={28} className="text-[var(--color-accent)]" />,
    "Compare Analysis":  <TrendingUp size={28} className="text-[var(--color-accent)]" />,
  };

  const layoutDescriptions: Record<LayoutType, string> = {
    "Individual Values": "Select station, product, and measurement types, then press GET to load individual values charts.",
    "SPC":               "Select station, product, and measurement types, then press GET to load SPC X-bar and Std Dev charts.",
    "Pallet Analysis":   "Select station, product, and measurement types, then press GET to load pallet scatter analysis.",
    "Compare Analysis":  "Select multiple measurement types, then press GET to compare them on a single time-series chart.",
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-[var(--color-muted)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {layoutIcons[layoutType]}
      </div>
      <div className="text-center">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
          {layoutType}
        </h2>
        <p className="mt-1 max-w-sm text-xs leading-relaxed">
          {layoutDescriptions[layoutType]}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// AKTİF FİLTRE BADGE'İ
// =============================================================================
function FilterBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px]">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="font-semibold text-[var(--color-text)]">{value}</span>
    </span>
  );
}

// =============================================================================
// ANA SAYFA
// =============================================================================
export default function SpcDashboardPage() {
  const committedFilters = useSpcStore((s) => s.committedFilters);
  const layoutType       = useSpcStore((s) => s.layoutType);

  // ── TanStack Query ──────────────────────────────────────────────────────────
  // Her iki hook her zaman çağrılır (React Rules of Hooks).
  // "enabled" koşulları hook içinde yönetilir:
  //   - individualQuery → SPC değilken ve committedFilters varken çalışır
  //   - spcQuery        → SPC modundayken ve committedFilters varken çalışır
  const individualQuery = useIndividualValuesQuery();
  const spcQuery        = useSpcValuesQuery();

  const isSpc        = layoutType === "SPC";
  const isPallet     = layoutType === "Pallet Analysis";
  const isCompare    = layoutType === "Compare Analysis";
  const isIndividual = layoutType === "Individual Values";

  // Aktif sorguyu belirle (Pallet ve Compare Individual Values verisini kullanır)
  const activeQuery = isSpc ? spcQuery : individualQuery;
  const isLoading   = committedFilters !== null && activeQuery.isPending;
  const error       = committedFilters !== null ? activeQuery.error : null;

  // Retry fonksiyonu — TanStack Query refetch
  const handleRetry = () => activeQuery.refetch();

  // ── İçerik Alanı Karar Ağacı ───────────────────────────────────────────────
  function renderContent() {
    // Commit edilmiş filtre yoksa → bekleme ekranı
    if (!committedFilters) {
      return <EmptyState layoutType={layoutType} />;
    }

    // TanStack Query isPending → skeleton loading
    if (isLoading) {
      return <LoadingState label={layoutType} />;
    }

    // TanStack Query isError → retry butonu
    if (error) {
      return (
        <ErrorState
          message={(error as Error).message}
          onRetry={handleRetry}
        />
      );
    }

    // ── Layout yönlendirme ─────────────────────────────────────────────────
    switch (layoutType) {

      // Individual Values: Timeline + Histogram
      case "Individual Values": {
        const data = individualQuery.data as IndividualValueSeries[] | undefined;
        if (!data || data.length === 0) return <EmptyState layoutType={layoutType} />;
        return <IndividualValuesLayout series={data} />;
      }

      // SPC: X-Bar Average + Std Dev
      case "SPC": {
        const data = spcQuery.data as SpcSeries[] | undefined;
        if (!data || data.length === 0) return <EmptyState layoutType={layoutType} />;
        return <SpcLayout series={data} />;
      }

      // Pallet Analysis: Scatter Plot (X=palet no, Y=değer)
      // Individual Values verisi kullanılır — PalletLayout içinde mapper çalışır
      case "Pallet Analysis": {
        const data = individualQuery.data as IndividualValueSeries[] | undefined;
        if (!data || data.length === 0) return <EmptyState layoutType={layoutType} />;
        return <PalletLayout series={data} />;
      }

      // Compare Analysis: Multi-series time-series overlay
      // Individual Values verisi kullanılır — CompareLayout içinde mapper çalışır
      case "Compare Analysis": {
        const data = individualQuery.data as IndividualValueSeries[] | undefined;
        if (!data || data.length === 0) return <EmptyState layoutType={layoutType} />;
        return <CompareLayout series={data} />;
      }

      default:
        return <EmptyState layoutType={layoutType} />;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--color-text)]">
              Pulseview SPC
            </h1>
            <p className="text-[10px] text-[var(--color-muted)]">
              Statistical Process Control Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <Clock size={12} />
          <LiveClock />
        </div>
      </header>

      {/* ── Filtre Barı ─────────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <ParametersBar />
      </div>

      {/* ── Aktif Filtre Özeti ───────────────────────────────────────────────── */}
      {committedFilters && (
        <div
          id="filter-summary"
          className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            Active:
          </span>
          <FilterBadge label="Layout"      value={committedFilters.layoutType} />
          <FilterBadge label="Population"  value={committedFilters.populationSize.toLocaleString()} />
          <FilterBadge label="Measurements" value={committedFilters.measurements.length} />
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <div className="flex flex-wrap gap-1">
            {committedFilters.measurements.map((m) => (
              <span
                key={m.id}
                className="rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Ana İçerik Alanı ─────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

// Saat bileşeni — re-render izolasyonu için ayrı tutulur
function LiveClock() {
  return (
    <time>
      {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}
