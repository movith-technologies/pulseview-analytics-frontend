// =============================================================================
// app/api/individual-values/route.ts
// Route Handler: POST /api/individual-values
//
// GetIndividualValues'ı simüle eder.
// Gelen request body'si:
// {
//   stationId: number,
//   productId: number,
//   measurements: string[],   // Ölçüm adları
//   populationSize: number,
//   startDate: string,
//   endDate: string
// }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { generateIndividualValues } from "@/lib/mock/dataEngine";
import { MOCK_MEASUREMENTS_BY_STATION } from "@/lib/mock/mockDb";

async function simulateDelay(min = 200, max = 600) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function POST(request: NextRequest) {
  await simulateDelay();

  const body = await request.json().catch(() => null);

  if (!body || !body.stationId || !body.productId || !body.measurements) {
    return NextResponse.json(
      { error: "Missing required fields: stationId, productId, measurements" },
      { status: 400 }
    );
  }

  const { stationId, productId, measurements: measurementNames, populationSize = 200 } = body;

  // İstasyon'daki tüm ölçüm tanımlarını al
  const allMeasurements = MOCK_MEASUREMENTS_BY_STATION[stationId] ?? [];

  // İstek edilen ölçüm adlarını filtrele ve ID'lerini bul
  const requestedMeasurements = allMeasurements.filter(
    (m) =>
      measurementNames.includes(m.Name) ||
      measurementNames.includes(String(m.ID))
  );

  // Eğer isim eşleşmesi yoksa ilk ölçümü kullan (fallback)
  const targetMeasurements =
    requestedMeasurements.length > 0
      ? requestedMeasurements
      : allMeasurements.slice(0, 1);

  const clampedSize = Math.max(1, Math.min(30000, parseInt(String(populationSize))));

  const data = generateIndividualValues(
    targetMeasurements.map((m) => m.ID),
    targetMeasurements.map((m) => m.Name),
    clampedSize,
    productId,
    stationId
  );

  return NextResponse.json(data);
}
