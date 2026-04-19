/**
 * CVSecurity third-party API — door list.
 * @see ZKBio CVSecurity 3rd Party API User Manual (door/list).
 *
 * Env:
 * - CVS_BASE_URL — e.g. http://host:8099 (no trailing slash)
 * - CVS_API_ACCESS_TOKEN — optional; if unset, CVS_CLIENT_SECRET is sent as access_token (common ZKBio registration pattern)
 */

export interface CvSecurityDoorRow {
  id: string;
  name: string;
  deviceId?: string;
}

interface CvSecurityListResponse {
  code: number;
  message?: string;
  data?: CvSecurityDoorRow[];
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

export async function fetchCvSecurityDoors(): Promise<{
  doors: CvSecurityDoorRow[];
  error?: string;
}> {
  const baseRaw = process.env.CVS_BASE_URL?.trim();
  const token = (
    process.env.CVS_API_ACCESS_TOKEN ?? process.env.CVS_CLIENT_SECRET
  )?.trim();

  if (!baseRaw || !token) {
    return {
      doors: [],
      error:
        "CVSecurity is not configured (set CVS_BASE_URL and CVS_CLIENT_SECRET or CVS_API_ACCESS_TOKEN).",
    };
  }

  const base = normalizeBaseUrl(baseRaw);
  const pageSize = 100;
  const all: CvSecurityDoorRow[] = [];

  for (let pageNo = 1; pageNo <= 50; pageNo++) {
    const url = new URL(`${base}/api/door/list`);
    url.searchParams.set("pageNo", String(pageNo));
    url.searchParams.set("pageSize", String(pageSize));
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
      return {
        doors: all,
        error: all.length ? undefined : `CVSecurity request failed: ${msg}`,
      };
    }

    if (!res.ok) {
      return {
        doors: all,
        error:
          all.length > 0
            ? undefined
            : `CVSecurity returned HTTP ${res.status} for door list.`,
      };
    }

    let json: CvSecurityListResponse;
    try {
      json = (await res.json()) as CvSecurityListResponse;
    } catch {
      return {
        doors: all,
        error: all.length > 0 ? undefined : "CVSecurity response was not JSON.",
      };
    }

    if (json.code !== 0) {
      return {
        doors: all,
        error:
          all.length > 0
            ? undefined
            : json.message?.trim() ||
              `CVSecurity error code ${json.code} for door list.`,
      };
    }

    const chunk = Array.isArray(json.data) ? json.data : [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }

  return { doors: all };
}
