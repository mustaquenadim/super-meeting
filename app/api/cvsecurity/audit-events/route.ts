import { NextRequest, NextResponse } from "next/server";
import { fetchCvSecurityTransactionMonitor } from "@/lib/cvsecurity/fetch-transaction-monitor";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("timestamp");
  const parsed =
    raw !== null && /^\d{10,16}$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
  const timestampMs = Number.isFinite(parsed) ? parsed : Date.now();

  const { events, error } = await fetchCvSecurityTransactionMonitor(timestampMs);

  return NextResponse.json({
    data: events,
    total: events.length,
    error: error ?? null,
    timestamp: timestampMs,
  });
}
