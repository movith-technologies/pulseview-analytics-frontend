"use client";
// =============================================================================
// src/components/parameters/MeasurementMultiSelect.tsx
// Ã‡oklu Ã–lÃ§Ã¼m Tipi SeÃ§im BileÅŸeni
//
// Checkbox tabanlÄ± Ã¶zel dropdown. Native <select multiple> yerine bu
// bileÅŸen kullanÄ±ldÄ± Ã§Ã¼nkÃ¼:
// 1. Daha iyi UX (checkbox'lar, "TÃ¼mÃ¼nÃ¼ SeÃ§/KaldÄ±r")
// 2. Vue uygulamasÄ±ndaki PrimeVue MultiSelect davranÄ±ÅŸÄ±nÄ± taklit eder
// 3. Tailwind ile tam Ã¶zelleÅŸtirilebilir
// =============================================================================

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import clsx from "clsx";
import type { MeasurementOption } from "@/types/spc";

interface MeasurementMultiSelectProps {
  options: MeasurementOption[];
  selected: MeasurementOption[];
  onChange: (selected: MeasurementOption[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MeasurementMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select measurement types",
  disabled = false,
}: MeasurementMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // DÄ±ÅŸarÄ± tÄ±klandÄ±ÄŸÄ±nda kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSelected = (option: MeasurementOption) =>
    selected.some((s) => s.id === option.id);

  const toggleOption = (option: MeasurementOption) => {
    if (isSelected(option)) {
      onChange(selected.filter((s) => s.id !== option.id));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0].name
      : `${selected.length} measurement(s) selected`;

  return (
    <div ref={containerRef} className="relative min-w-[220px]">
      {/* Trigger */}
      <button
        type="button"
        id="measurement-multiselect-trigger"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className={clsx(
          "flex w-full items-center justify-between gap-2",
          "rounded-lg border px-3 py-2 text-sm",
          "bg-[var(--color-surface)] text-[var(--color-text)]",
          "transition-colors duration-150",
          disabled
            ? "cursor-not-allowed opacity-50 border-[var(--color-border)]"
            : "cursor-pointer border-[var(--color-border)] hover:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={clsx(
            "truncate",
            selected.length === 0 && "text-[var(--color-muted)]"
          )}
        >
          {displayText}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              onKeyDown={(e) => e.key === "Enter" && clearAll()}
              className="rounded hover:bg-white/10 p-0.5"
            >
              <X size={12} className="text-[var(--color-muted)]" />
            </span>
          )}
          <ChevronDown
            size={14}
            className={clsx(
              "transition-transform duration-200 text-[var(--color-muted)]",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={clsx(
            "absolute left-0 top-full z-50 mt-1 w-full",
            "rounded-lg border border-[var(--color-border)]",
            "bg-[var(--color-surface-elevated)] shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 duration-100"
          )}
          role="listbox"
          aria-multiselectable="true"
        >
          {/* TÃ¼mÃ¼nÃ¼ SeÃ§ / KaldÄ±r */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              {selected.length}/{options.length} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                All
              </button>
              <span className="text-[var(--color-muted)]">Â·</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                None
              </button>
            </div>
          </div>

          {/* SeÃ§enekler */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {options.map((option) => {
              const checked = isSelected(option);
              return (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggleOption(option)}
                  className={clsx(
                    "flex cursor-pointer items-center gap-2.5 border-l-2 px-3 py-2 text-sm",
                    "transition-colors duration-100",
                    checked
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-text)]"
                      : "border-transparent text-[var(--color-text-secondary)] hover:bg-white/5"
                  )}
                >
                  {/* Checkbox */}
                  <span
                    className={clsx(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded",
                      "border transition-all duration-150",
                      checked
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                        : "border-[var(--color-border)]"
                    )}
                  >
                    {checked && <Check size={10} strokeWidth={3} className="text-white" />}
                  </span>
                  <span className="truncate">{option.name}</span>
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-[var(--color-muted)]">
                No measurement types available
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

