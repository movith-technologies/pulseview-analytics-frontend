// =============================================================================
// app/api/stations/route.ts
// Route Handler: GET /api/stations
//
// GetStations'ı simüle eder. Gerçek backend geldiğinde bu dosya silinir
// ve spcClient.ts'deki getBaseUrl() env variable'a döner.
// =============================================================================

import { NextResponse } from "next/server";
import { MOCK_STATIONS } from "@/lib/mock/mockDb";

/** Gerçekçi bir network gecikmesi simüle eder (ms) */
async function simulateDelay(min = 150, max = 350) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function GET() {
  await simulateDelay();
  return NextResponse.json(MOCK_STATIONS);
}
