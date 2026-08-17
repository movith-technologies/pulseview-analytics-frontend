"use client";
// =============================================================================
// app/page.tsx
// Ana Dashboard Sayfası — Gün 4 & 5 Güncellemesi
//
// Sorumluluklar:
//   1. Header (logo + saat)
//   2. ParametersBar (filtre barı)
//   3. Aktif Filtre Özeti (GET sonrası)
//   4. İçerik Alanı → layoutType'a göre doğru bileşeni render eder:
//       - "Individual Values" → IndividualValuesLayout
//       - "SPC"               → SpcLayout
//       - "Pallet Analysis"   → Gün 6 placeholder
//       - "Compare Analysis"  → Gün 6 placeholder
//
// State akışı:
//   1. Kullanıcı filtre barından seçimler yapar (Zustand store güncellenir)
//   2. GET butonuna basılır → committedFilters snapshot'ı oluşur
//   3. TanStack Query committedFilters değişimini fark eder → API isteği atar
//   4. Veri gelince layoutType'a bakılır → doğru layout bileşeni render edilir
// =============================================================================

import { useSpcStore } from "@/store/useSpcStore";
import {
  useIndividualValuesQuery,
  useSpcValuesQuery,
} from "@/hooks/useSpcQueries";
import { ParametersBar } from "@/components/parameters/ParametersBar";
import { IndividualValuesLayout } from "@/components/charts/individual/IndividualValuesLayout";
import { SpcLayout }               from "@/components/charts/spc/SpcLayout";
import {
  Activity,
  BarChart2,
  GitCompare,
  Layers,
  AlertCircle,
  Clock,
  TrendingUp,
  Database,
} from "lucide-react";
import clsx from "clsx";
import type { IndividualValueSeries, SpcSeries } from "@/types/spc";

// ---------------------------------------------------------------------------
// Yükleme Spinner'ı
// ---------------------------------------------------------------------------
function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-[var(--color-muted)]">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-[var(--color-border)]" />
        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[var(--color-accent)]" />
      </div>
      <p className="text-sm">Fetching {label} data...</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hata Durumu
// ---------------------------------------------------------------------------
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-red-400">
      <AlertCircle size={48} />
      <p className="text-lg font-semibold">Data Error</p>
      <p className="max-w-md text-center text-sm text-[var(--color-muted)]">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Boş Durum — GET butonu bekleniyor
// ---------------------------------------------------------------------------
function EmptyState({ layoutType }: { layoutType: string }) {
  const icons: Record<string, React.ElementType> = {
    "Individual Values": Activity,
    "SPC":               BarChart2,
    "Pallet Analysis":   Layers,
    "Compare Analysis":  GitCompare,
  };
  const Icon = icons[layoutType] ?? Activity;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-[var(--color-muted)]">
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Icon size={40} strokeWidth={1.5} className="text-[var(--color-accent)]/50" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[var(--color-text-secondary)]">
          {layoutType} Ready
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed">
          Configure your filters above and press{" "}
          <span className="font-semibold text-[var(--color-accent)]">GET</span>{" "}
          to load charts.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gün 6 Placeholder
// ---------------------------------------------------------------------------
function PlaceholderState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-[var(--color-muted)]">
      <div className="rounded-xl border border-dashed border-[var(--color-border)] px-8 py-6 text-center">
        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{label}</p>
        <p className="mt-1 text-xs">Coming in Day 6</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aktif Filtre Badge'i
// ---------------------------------------------------------------------------
function FilterBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px]">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="font-semibold text-[var(--color-text)]">{value}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// ANA SAYFA
// ---------------------------------------------------------------------------
export default function SpcDashboardPage() {
  const committedFilters = useSpcStore((s) => s.committedFilters);
  const layoutType       = useSpcStore((s) => s.layoutType);

  // ── TanStack Query ─────────────────────────────────────────────────────
  // Her iki hook da her zaman çağrılır (React Hook kuralı).
  // "enabled" koşulları hook içinde yönetilir — layoutType ve
  // committedFilters'a bakarak gereksiz istekleri durdurur.
  const individualQuery = useIndividualValuesQuery();
  const spcQuery        = useSpcValuesQuery();

  const isSpc = layoutType === "SPC";
  const isIndividual = layoutType === "Individual Values";

  // Aktif sorguya göre loading/error/data seç
  const isLoading = isSpc ? spcQuery.isLoading : isIndividual ? individualQuery.isLoading : false;
  const error     = isSpc ? spcQuery.error    : isIndividual ? individualQuery.error    : null;

  // ── İçerik Alanı Karar Ağacı ──────────────────────────────────────────
  function renderContent() {
    // Commit edilmiş filtre yoksa — bekleme ekranı
    if (!committedFilters) {
      return <EmptyState layoutType={layoutType} />;
    }

    // Yükleniyor
    if (isLoading) {
      return <LoadingState label={layoutType} />;
    }

    // Hata
    if (error) {
      return <ErrorState message={(error as Error).message} />;
    }

    // Layout'a göre doğru bileşeni render et
    switch (layoutType) {
      case "Individual Values": {
        const data = individualQuery.data as IndividualValueSeries[] | undefined;
        if (!data || data.length === 0) return <EmptyState layoutType={layoutType} />;
        return <IndividualValuesLayout series={data} />;
      }

      case "SPC": {
        const data = spcQuery.data as SpcSeries[] | undefined;
        if (!data || data.length === 0) return <EmptyState layoutType={layoutType} />;
        return <SpcLayout series={data} />;
      }

      case "Pallet Analysis":
        return <PlaceholderState label="Pallet Analysis" />;

      case "Compare Analysis":
        return <PlaceholderState label="Compare Analysis" />;

      default:
        return <EmptyState layoutType={layoutType} />;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────────────── */}
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

      {/* ── Filtre Barı ──────────────────────────────────────────────── */}
      <div className="shrink-0">
        <ParametersBar />
      </div>

      {/* ── Aktif Filtre Özeti ────────────────────────────────────────── */}
      {committedFilters && (
        <div
          id="filter-summary"
          className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            Active:
          </span>
          <FilterBadge label="Layout"     value={committedFilters.layoutType} />
          <FilterBadge label="Population" value={committedFilters.populationSize.toLocaleString()} />
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

      {/* ── Ana İçerik Alanı ─────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

// Saat bileşeni ayrı kaldı — re-render izolasyonu için
function LiveClock() {
  return (
    <time>
      {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}
