import { NextResponse } from "next/server"
import type { Role } from "@/lib/api/types"
import { requireAdminRequest } from "@/lib/server/supabase"
import { sendUserWelcomeEmail } from "@/lib/server/welcome-email"

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return "An unexpected error occurred."
}

type CreateUserPayload = {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
  role?: string
}

function normalizeUser(data: {
  id: number
  name: string
  email: string
  created_at: string
  user_roles?: Array<{
    role?: Role | null
  }>
}) {
  const roles = (data.user_roles ?? [])
    .map((entry) => entry.role)
    .filter(Boolean) as Role[]

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    created_at: data.created_at,
    roles,
    role: roles[0]?.name,
  }
}

export async function POST(request: Request) {
  const authContext = await requireAdminRequest(request)
  if ("error" in authContext) return authContext.error

  const { serviceClient } = authContext
  const body = (await request
    .json()
    .catch(() => null)) as CreateUserPayload | null

  if (!body?.name?.trim() || !body?.email?.trim() || !body?.password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 }
    )
  }

  if (body.password !== body.password_confirmation) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 }
    )
  }

  const roleName = body.role?.trim() || "staff"
  const { data: role, error: roleError } = await serviceClient
    .from("roles")
    .select("id, name")
    .ilike("name", roleName)
    .maybeSingle()

  if (roleError || !role) {
    return NextResponse.json(
      { error: `Role \"${roleName}\" was not found.` },
      { status: 400 }
    )
  }

  const { data: authUser, error: createAuthError } =
    await serviceClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.name,
      },
    })

  if (createAuthError || !authUser.user) {
    return NextResponse.json(
      { error: getErrorMessage(createAuthError) },
      { status: 400 }
    )
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("users")
    .insert({
      auth_user_id: authUser.user.id,
      name: body.name,
      email: body.email,
    })
    .select(
      "id, name, email, created_at, user_roles(role:roles(id, name))"
    )
    .single()

  if (profileError || !profile) {
    await serviceClient.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json(
      { error: getErrorMessage(profileError) },
      { status: 400 }
    )
  }

  const { error: roleLinkError } = await serviceClient
    .from("user_roles")
    .insert({
      user_id: profile.id,
      role_id: role.id,
    })

  if (roleLinkError) {
    await serviceClient.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json(
      { error: getErrorMessage(roleLinkError) },
      { status: 400 }
    )
  }

  const { data: savedUser, error: fetchError } = await serviceClient
    .from("users")
    .select(
      "id, name, email, created_at, user_roles(role:roles(id, name))"
    )
    .eq("id", profile.id)
    .single()

  if (fetchError || !savedUser) {
    return NextResponse.json(
      { error: getErrorMessage(fetchError) },
      { status: 400 }
    )
  }

  try {
    await sendUserWelcomeEmail({
      to: savedUser.email,
      fullName: savedUser.name,
    })
  } catch (emailError) {
    console.error("Failed to send welcome email", emailError)
  }

  return NextResponse.json(
    {
      data: normalizeUser(
        savedUser as typeof savedUser & {
          user_roles?: Array<{ role?: Role | null }>
        }
      ),
    },
    { status: 201 }
  )
}
