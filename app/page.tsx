"use client";
// =============================================================================
// app/page.tsx
// Ana Sayfa — Gün 3 İskelet Görünümü
//
// Bu sayfa şunları içerir:
// 1. ParametersBar — üstte filtre barı
// 2. Aktif Filtre Özeti — seçilen filtreleri gösterir (veri doğrulama için)
// 3. Layout İçerik Alanı — Gün 4-5-6'da grafik bileşenleri buraya gelecek
// =============================================================================

import { useSpcStore } from "@/store/useSpcStore";
import { useIndividualValuesQuery, useSpcValuesQuery } from "@/hooks/useSpcQueries";
import { ParametersBar } from "@/components/parameters/ParametersBar";
import {
  Activity,
  BarChart2,
  GitCompare,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Database,
  Clock,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";

// ---------------------------------------------------------------------------
// Veri Özet Kartı
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  color = "blue",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: "blue" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    blue:   "text-blue-400 bg-blue-400/10 border-blue-400/20",
    green:  "text-green-400 bg-green-400/10 border-green-400/20",
    yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    red:    "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        colorClasses[color]
      )}
    >
      <Icon size={18} />
      <div>
        <div className="text-xs opacity-70">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout Alan Placeholder'ı
// Gün 4-5-6'da grafik bileşenleriyle değiştirilecek
// ---------------------------------------------------------------------------
function ContentAreaPlaceholder({
  layoutType,
  isLoading,
  error,
  data,
}: {
  layoutType: string;
  isLoading: boolean;
  error: Error | null;
  data: unknown[] | undefined;
}) {
  const icons = {
    "Individual Values": Activity,
    "SPC": BarChart2,
    "Pallet Analysis": Layers,
    "Compare Analysis": GitCompare,
  };
  const Icon = icons[layoutType as keyof typeof icons] ?? Activity;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-[var(--color-muted)]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-[var(--color-border)]" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[var(--color-accent)]" />
        </div>
        <p className="text-sm">Fetching {layoutType} data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-red-400">
        <AlertCircle size={48} />
        <p className="text-lg font-semibold">Data Error</p>
        <p className="max-w-md text-center text-sm text-[var(--color-muted)]">
          {error.message}
        </p>
      </div>
    );
  }

  if (data && data.length > 0) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">
            Data fetched successfully — {data.length} measurement series received
          </span>
        </div>

        {/* Ham veri önizleme */}
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              📊 Raw API Response Preview
            </h3>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              Gün 4-6&apos;da bu veri grafik bileşenlerine prop olarak geçilecek
            </p>
          </div>
          <div className="overflow-x-auto p-4">
            <pre className="font-mono text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap break-all">
              {JSON.stringify(
                data.map((series: any) => ({
                  measurementName: series.measurementName,
                  ucl: series.ucl,
                  lcl: series.lcl,
                  monitoringMax: series.monitoringMax,
                  monitoringMin: series.monitoringMin,
                  mean: series.mean,
                  dataPointCount: series.dataPoints?.length ?? series.groups?.length,
                  firstDataPoint: series.dataPoints?.[0] ?? series.groups?.[0],
                })),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Henüz veri yok — bekleme ekranı
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
          to fetch data. Charts will appear here in Day 4–6.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ANA SAYFA
// ---------------------------------------------------------------------------
export default function SpcDashboardPage() {
  const committedFilters = useSpcStore((s) => s.committedFilters);
  const layoutType       = useSpcStore((s) => s.layoutType);

  const individualQuery  = useIndividualValuesQuery();
  const spcQuery         = useSpcValuesQuery();

  const isSpc    = layoutType === "SPC";
  const isLoading = isSpc ? spcQuery.isLoading : individualQuery.isLoading;
  const error     = isSpc ? spcQuery.error    : individualQuery.error;
  const data      = isSpc ? spcQuery.data     : individualQuery.data;

  return (
    <div className="flex h-full flex-col">
      {/* ── Üst Bar: Logo + Başlık ──────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
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
          <span>
            {new Date().toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </header>

      {/* ── Filtre Barı ──────────────────────────────────────────── */}
      <ParametersBar />

      {/* ── Aktif Filtre Özeti ───────────────────────────────────── */}
      {committedFilters && (
        <div
          id="filter-summary"
          className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            Active:
          </span>

          <StatCard
            icon={Database}
            label="Layout"
            value={committedFilters.layoutType}
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Population"
            value={committedFilters.populationSize.toLocaleString()}
            color="blue"
          />
          <StatCard
            icon={Activity}
            label="Measurements"
            value={committedFilters.measurements.length}
            color="green"
          />

          {/* Seçili ölçüm adları */}
          <div className="flex flex-wrap gap-1.5">
            {committedFilters.measurements.map((m) => (
              <span
                key={m.id}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]"
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── İçerik Alanı ────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-auto">
        <ContentAreaPlaceholder
          layoutType={layoutType}
          isLoading={isLoading}
          error={error as Error | null}
          data={data as unknown[] | undefined}
        />
      </main>
    </div>
  );
}
