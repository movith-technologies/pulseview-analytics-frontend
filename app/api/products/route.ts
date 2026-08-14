// =============================================================================
// app/api/products/route.ts
// Route Handler: GET /api/products?stationId=11&number=200
//
// GetIndividualProducts'ı simüle eder.
// startDate ve endDate, populationSize'a göre geriye doğru hesaplanır.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  MOCK_PRODUCTS_BY_STATION,
  MOCK_STATIONS,
} from "@/lib/mock/mockDb";
import type { ApiProductsResponse } from "@/types/spc";

async function simulateDelay(min = 150, max = 400) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function GET(request: NextRequest) {
  await simulateDelay();

  const { searchParams } = new URL(request.url);
  const stationId = parseInt(searchParams.get("stationId") ?? "0");
  const number = parseInt(searchParams.get("number") ?? "200");

  // Stasyon doğrulama
  const station = MOCK_STATIONS.find((s) => s.StationID === stationId);
  if (!station) {
    return NextResponse.json(
      { error: `Station ${stationId} not found` },
      { status: 404 }
    );
  }

  const products = MOCK_PRODUCTS_BY_STATION[stationId] ?? [];
  if (products.length === 0) {
    return NextResponse.json(
      { error: `No products for station ${stationId}` },
      { status: 404 }
    );
  }

  // Tarih aralığı hesaplama:
  // Her 5 saniyede bir ölçüm → number * 5s geriye git
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - number * 5 * 1000);

  const response: ApiProductsResponse = {
    StartDate: startDate.toISOString(),
    EndDate: endDate.toISOString(),
    ProductList: products,
  };

  return NextResponse.json(response);
}
