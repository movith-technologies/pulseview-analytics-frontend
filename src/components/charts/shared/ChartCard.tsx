"use client";
// =============================================================================
// src/components/charts/shared/ChartCard.tsx
// Grafik sarmalayıcı kart — başlık, istatistik badge'leri ve içerik alanı.
//
// Tüm grafik bileşenleri bu kartın içinde render edilir.
// Bu sayede tutarlı kenarlık, arka plan ve başlık formatı sağlanır.
// =============================================================================

import clsx from "clsx";

interface BadgeProps {
  label: string;
  value: string | number;
  color: "green" | "red" | "yellow" | "blue" | "gray";
}

interface ChartCardProps {
  title: string;
  badges?: BadgeProps[];
  children: React.ReactNode;
  className?: string;
}

const BADGE_COLORS: Record<BadgeProps["color"], string> = {
  green:  "bg-green-500/15  text-green-400  border-green-500/30",
  red:    "bg-red-500/15    text-red-400    border-red-500/30",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  blue:   "bg-blue-500/15   text-blue-400   border-blue-500/30",
  gray:   "bg-white/5       text-[var(--color-muted)] border-[var(--color-border)]",
};

export function ChartCard({ title, badges = [], children, className }: ChartCardProps) {
  return (
    <div
      className={clsx(
        "flex flex-col overflow-hidden rounded-xl",
        "border border-[var(--color-border)] bg-[var(--color-surface)]",
        className
      )}
    >
      {/* Kart Başlığı */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
          {title}
        </h3>
        {badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {badges.map((b) => (
              <span
                key={b.label}
                className={clsx(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  BADGE_COLORS[b.color]
                )}
              >
                <span className="opacity-70">{b.label}</span>
                <span>{b.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grafik İçeriği */}
      <div className="flex-1 p-1">{children}</div>
    </div>
  );
}
