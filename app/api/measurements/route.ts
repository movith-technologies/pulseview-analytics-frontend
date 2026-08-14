// =============================================================================
// app/api/measurements/route.ts
// Route Handler: GET /api/measurements?stationId=11&productId=816
//
// GetMeasurements'ı simüle eder.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { MOCK_MEASUREMENTS_BY_STATION } from "@/lib/mock/mockDb";

async function simulateDelay(min = 100, max = 300) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function GET(request: NextRequest) {
  await simulateDelay();

  const { searchParams } = new URL(request.url);
  const stationId = parseInt(searchParams.get("stationId") ?? "0");
  // productId alınır ama mock'ta istasyon bazlı filtreleme yeterli
  // Gerçek backend'de product da filtrede kullanılacak

  const measurements = MOCK_MEASUREMENTS_BY_STATION[stationId];
  if (!measurements) {
    return NextResponse.json(
      { error: `No measurements for station ${stationId}` },
      { status: 404 }
    );
  }

  return NextResponse.json(measurements);
}
