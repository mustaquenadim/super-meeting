/**
 * CVSecurity third-party API — real-time access transaction monitor.
 * @see ZKBio CVSecurity 3rd Party API User Manual §2.18.5 (transaction/monitor).
 *
 * The upstream API expects a stable `timestamp` (ms) for the session: set it on the
 * first request and reuse it on later polls. Poll interval should not be too high
 * (manual recommends ≥10 seconds).
 */

export interface CvSecurityMonitorEvent {
  id?: string;
  eventTime?: string;
  pin?: string;
  name?: string;
  lastName?: string;
  deptName?: string;
  areaName?: string;
  cardNo?: string | null;
  devSn?: string;
  verifyModeName?: string;
  eventName?: string;
  eventPointName?: string;
  readerName?: string;
  devName?: string;
  eventNumber?: string;
}

/** Stable row identity for deduplication and React keys (upstream may repeat rows). */
export function cvSecurityMonitorEventKey(e: CvSecurityMonitorEvent): string {
  return [
    e.eventTime ?? "",
    e.devSn ?? "",
    e.pin ?? "",
    e.eventName ?? "",
    e.readerName ?? "",
    String(e.cardNo ?? ""),
    e.verifyModeName ?? "",
    e.eventPointName ?? "",
    e.eventNumber ?? "",
    e.id ?? "",
  ].join("\u001f");
}

interface CvSecurityMonitorResponse {
  code: number;
  message?: string;
  data?: CvSecurityMonitorEvent[];
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

export async function fetchCvSecurityTransactionMonitor(
  timestampMs: number
): Promise<{ events: CvSecurityMonitorEvent[]; error?: string }> {
  const baseRaw = process.env.CVS_BASE_URL?.trim();
  const token = (
    process.env.CVS_API_ACCESS_TOKEN ?? process.env.CVS_CLIENT_SECRET
  )?.trim();

  if (!baseRaw || !token) {
    return {
      events: [],
      error:
        "CVSecurity is not configured (set CVS_BASE_URL and CVS_CLIENT_SECRET or CVS_API_ACCESS_TOKEN).",
    };
  }

  const base = normalizeBaseUrl(baseRaw);
  const url = new URL(`${base}/api/transaction/monitor`);
  url.searchParams.set("timestamp", String(timestampMs));
  url.searchParams.set("access_token", token);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { events: [], error: `CVSecurity request failed: ${msg}` };
  }

  if (!res.ok) {
    return {
      events: [],
      error: `CVSecurity returned HTTP ${res.status} for transaction monitor.`,
    };
  }

  let json: CvSecurityMonitorResponse;
  try {
    json = (await res.json()) as CvSecurityMonitorResponse;
  } catch {
    return { events: [], error: "CVSecurity response was not JSON." };
  }

  if (json.code !== 0) {
    return {
      events: [],
      error:
        json.message?.trim() ||
        `CVSecurity error code ${json.code} for transaction monitor.`,
    };
  }

  const events = Array.isArray(json.data) ? json.data : [];
  return { events };
}
