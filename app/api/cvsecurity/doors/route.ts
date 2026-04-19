import { NextResponse } from "next/server";
import type { Door } from "@/lib/api/types";
import { fetchCvSecurityDoors } from "@/lib/cvsecurity/fetch-doors";

export async function GET() {
  const { doors: rows, error } = await fetchCvSecurityDoors();

  const data: Door[] = rows.map((d) => ({
    id: d.id,
    name: d.name,
    deviceId: d.deviceId,
  }));

  return NextResponse.json({
    data,
    total: data.length,
    error: error ?? null,
  });
}
