import "server-only"

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unexpected server error occurred."
}

function getPublicSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function createRouteSupabaseClient(accessToken: string) {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseConfig()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return null
  return authorization.slice("Bearer ".length)
}

export async function requireAdminRequest(request: Request) {
  const accessToken = getBearerToken(request)
  if (!accessToken) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const authClient = createRouteSupabaseClient(accessToken)
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken)

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: isAdmin, error: roleError } = await authClient.rpc("has_role", {
    user_id: user.id,
    role_name: "admin",
  })

  if (roleError || !isAdmin) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  try {
    return {
      user,
      serviceClient: createServerSupabaseClient(),
    }
  } catch (error) {
    return {
      error: NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 500 }
      ),
    }
  }
}
