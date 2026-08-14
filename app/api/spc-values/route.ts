// =============================================================================
// app/api/spc-values/route.ts
// Route Handler: POST /api/spc-values
//
// GetSPCValues'ı simüle eder.
// populationSize otomatik olarak 200'ün katına yuvarlanır.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { generateSpcValues } from "@/lib/mock/dataEngine";
import { MOCK_MEASUREMENTS_BY_STATION } from "@/lib/mock/mockDb";

async function simulateDelay(min = 250, max = 700) {
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

  // SPC için 200'ün katına yuvarla
  const clampedSize = Math.max(200, Math.min(30000, parseInt(String(populationSize))));
  const correctedSize = Math.round(clampedSize / 200) * 200;

  // İstasyon'daki ölçüm tanımlarını al
  const allMeasurements = MOCK_MEASUREMENTS_BY_STATION[stationId] ?? [];

  const requestedMeasurements = allMeasurements.filter(
    (m) =>
      measurementNames.includes(m.Name) ||
      measurementNames.includes(String(m.ID))
  );

  const targetMeasurements =
    requestedMeasurements.length > 0
      ? requestedMeasurements
      : allMeasurements.slice(0, 1);

  const data = generateSpcValues(
    targetMeasurements.map((m) => m.ID),
    targetMeasurements.map((m) => m.Name),
    correctedSize,
    productId
  );

  return NextResponse.json(data);
}
