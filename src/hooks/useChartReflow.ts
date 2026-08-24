// =============================================================================
// src/hooks/useChartReflow.ts
// Highcharts Responsive Reflow Hook
//
// Problem: Highcharts grafikleri statik boyutla render edilir.
// Container boyutu değiştiğinde grafik taşabilir veya boşluk bırakabilir.
//
// Çözüm: ResizeObserver API kullanarak container boyut değişimlerini
// takip eder ve Highcharts chart.reflow() metodunu tetikler.
//
// Kullanım:
//   const chartRef = useRef<HighchartsReact.RefObject>(null);
//   const containerRef = useChartReflow<HTMLDivElement>(chartRef);
//   return (
//     <div ref={containerRef}>
//       <HighchartsReact ref={chartRef} ... />
//     </div>
//   );
// =============================================================================

"use client";

import { useRef, useEffect, useCallback, type RefObject } from "react";
import type HighchartsReact from "highcharts-react-official";

/**
 * ResizeObserver ile Highcharts reflow hook'u.
 *
 * @param chartRef - HighchartsReact bileşeninin ref'i
 * @param debounceMs - Reflow geciktirme süresi (ms), varsayılan 150ms
 * @returns containerRef - İzlenecek kapsayıcı elementin ref'i
 */
export function useChartReflow<T extends HTMLElement = HTMLDivElement>(
  chartRef: RefObject<HighchartsReact.RefObject | null>,
  debounceMs = 150
): RefObject<T | null> {
  const containerRef = useRef<T>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced reflow: Boyut değişimlerini toplu işler
  const handleResize = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const chart = chartRef.current?.chart;
      if (chart) {
        try {
          // chart.reflow() grafiği container boyutuna sığdırır
          chart.reflow();
        } catch {
          // Unmount sırasında chart silinmiş olabilir — sessizce geç
        }
      }
    }, debounceMs);
  }, [chartRef, debounceMs]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ResizeObserver: container boyutu değiştiğinde handleResize çağırır
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    // İlk render sonrası bir kez reflow uygula
    handleResize();

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleResize]);

  return containerRef;
}
