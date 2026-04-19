/**
 * CVSecurity third-party API — person lookup by PIN.
 * @see ZKBio CVSecurity 3rd Party API User Manual (person/get).
 *
 * Env:
 * - CVS_BASE_URL — e.g. http://host:8099 (no trailing slash)
 * - CVS_API_ACCESS_TOKEN — optional; if unset, CVS_CLIENT_SECRET is sent as access_token
 */

interface CvSecurityPersonResponse {
  code: number
  message?: string
  data?: {
    pin?: string
    name?: string
    accEndTime?: string
  } | null
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "")
}

function normalizeDateTime(value: string) {
  const trimmed = value.trim().replace("T", " ")
  if (!trimmed) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed} 23:59:59`
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`
  }
  return trimmed.length === 19 ? trimmed : trimmed.slice(0, 19)
}

function buildBookingEndDateTime(bookingDate: string, bookingEndTime: string) {
  return normalizeDateTime(`${bookingDate.trim()} ${bookingEndTime.trim()}`)
}

export async function verifyCvSecurityPersonPin(
  pin: string,
  options?: { bookingDate?: string; bookingEndTime?: string }
): Promise<{
  exists: boolean
  error?: string
}> {
  const normalizedPin = pin.trim()
  if (!normalizedPin) return { exists: false }

  const baseRaw = process.env.CVS_BASE_URL?.trim()
  const token = (
    process.env.CVS_API_ACCESS_TOKEN ?? process.env.CVS_CLIENT_SECRET
  )?.trim()

  if (!baseRaw || !token) {
    return {
      exists: false,
      error:
        "CVSecurity is not configured (set CVS_BASE_URL and CVS_CLIENT_SECRET or CVS_API_ACCESS_TOKEN).",
    }
  }

  const base = normalizeBaseUrl(baseRaw)
  const url = new URL(
    `${base}/api/person/get/${encodeURIComponent(normalizedPin)}`
  )
  url.searchParams.set("access_token", token)

  let res: Response
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error"
    return { exists: false, error: `CVSecurity request failed: ${msg}` }
  }

  if (!res.ok) {
    return {
      exists: false,
      error: `CVSecurity returned HTTP ${res.status} for person lookup.`,
    }
  }

  let json: CvSecurityPersonResponse
  try {
    json = (await res.json()) as CvSecurityPersonResponse
  } catch {
    return { exists: false, error: "CVSecurity response was not JSON." }
  }

  if (json.code !== 0) {
    return { exists: false }
  }

  const personPin = json.data?.pin?.trim()

  if (personPin !== normalizedPin) {
    return { exists: false }
  }

  const accessEndTime = normalizeDateTime(json.data?.accEndTime ?? "")
  const bookingEndTime =
    options?.bookingDate && options?.bookingEndTime
      ? buildBookingEndDateTime(options.bookingDate, options.bookingEndTime)
      : ""

  if (bookingEndTime && accessEndTime && bookingEndTime > accessEndTime) {
    return {
      exists: false,
      error: "Customer access has expired for this booking time.",
    }
  }

  return { exists: true }
}
