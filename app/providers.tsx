"use client";
// =============================================================================
// app/providers.tsx
// TanStack Query Client Provider + Highcharts Global Init
// =============================================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { initHighcharts } from "@/lib/highchartsInit";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 0,
          },
        },
      })
  );

  // Highcharts Boost modülünü istemci tarafında bir kez başlat
  useEffect(() => {
    void initHighcharts();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
