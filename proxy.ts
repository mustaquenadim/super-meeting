import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies"

const PUBLIC_API_PATHS = [
  "/api/auth/forgot-password",
  "/api/auth/email-verification",
  "/api/auth/email-verification/success",
  "/api/v1/bookings",
  "/api/v1/bookings/verify-pin",
  "/api/payments/myfatoorah/callback",
]

function isPublicApiPath(pathname: string) {
  return PUBLIC_API_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

function isProtectedApiPath(pathname: string) {
  return pathname.startsWith("/api/") && !isPublicApiPath(pathname)
}

function isProtectedAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

async function hasValidSupabaseSession(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (!accessToken) return false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) return false

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  const {
    data: { user },
    error,
  } = await client.auth.getUser(accessToken)

  return Boolean(user && !error)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsApiAuth = isProtectedApiPath(pathname)
  const needsAdminAuth = isProtectedAdminPath(pathname)

  if (!needsApiAuth && !needsAdminAuth) return NextResponse.next()

  const isAuthenticated = await hasValidSupabaseSession(request)

  if (isAuthenticated) return NextResponse.next()

  if (needsApiAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/auth/login", request.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
