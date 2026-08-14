"use client";
// =============================================================================
// app/providers.tsx
// TanStack Query Client Provider
//
// Next.js App Router'da tüm Provider'lar "use client" direktifine sahip
// bir wrapper bileşende tanımlanır ve layout.tsx içinde kullanılır.
// Bu sayede Server Component'lerin avantajları korunur.
// =============================================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient her render'da yeni oluşmasın diye useState içinde tutuyoruz.
  // Singleton pattern — uygulama boyunca tek bir cache paylaşılır.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Sayfa yeniden odaklandığında otomatik refetch (production için faydalı)
            refetchOnWindowFocus: false,
            // Hata durumunda otomatik tekrar denemeler
            retry: 1,
            // Standart stale time (her sorgu kendi değerini override edebilir)
            staleTime: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
