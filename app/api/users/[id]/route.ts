import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Role } from "@/lib/api/types"
import { requireAdminRequest } from "@/lib/server/supabase"

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return "An unexpected error occurred."
}

type UpdateUserPayload = {
  id?: number
  name?: string
  password?: string
  password_confirmation?: string
  role?: string
  roleIds?: number[]
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

type ServiceClient = SupabaseClient

async function loadUser(serviceClient: ServiceClient, userId: number) {
  return serviceClient
    .from("users")
    .select(
      "id, auth_user_id, name, email, created_at, user_roles(role:roles(id, name))"
    )
    .eq("id", userId)
    .single()
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authContext = await requireAdminRequest(request)
  if ("error" in authContext) return authContext.error

  const { serviceClient } = authContext
  const { id: idParam } = params
  const userId = Number(idParam)

  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 })
  }

  const body = (await request
    .json()
    .catch(() => null)) as UpdateUserPayload | null
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    )
  }

  const { data: existingUser, error: existingError } = await serviceClient
    .from("users")
    .select("id, auth_user_id, name, email")
    .eq("id", userId)
    .single()

  if (existingError || !existingUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const updates: { name?: string } = {}
  if (body.name?.trim()) updates.name = body.name.trim()

  if (Object.keys(updates).length > 0) {
    const { error: profileError } = await serviceClient
      .from("users")
      .update(updates)
      .eq("id", userId)

    if (profileError) {
      return NextResponse.json(
        { error: getErrorMessage(profileError) },
        { status: 400 }
      )
    }
  }

  if (body.password) {
    if (body.password !== body.password_confirmation) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      )
    }

    const { error: authError } = await serviceClient.auth.admin.updateUserById(
      existingUser.auth_user_id,
      {
        password: body.password,
        user_metadata: {
          full_name: body.name?.trim() || existingUser.name,
        },
      }
    )

    if (authError) {
      return NextResponse.json(
        { error: getErrorMessage(authError) },
        { status: 400 }
      )
    }
  }

  if (body.roleIds || body.role) {
    const desiredRoleIds = Array.isArray(body.roleIds)
      ? body.roleIds.filter((roleId) => Number.isFinite(roleId))
      : []

    if (body.role && desiredRoleIds.length === 0) {
      const { data: role, error: roleError } = await serviceClient
        .from("roles")
        .select("id")
        .ilike("name", body.role)
        .maybeSingle()

      if (roleError || !role) {
        return NextResponse.json(
          { error: `Role \"${body.role}\" was not found.` },
          { status: 400 }
        )
      }

      desiredRoleIds.push(role.id)
    }

    const { error: deleteError } = await serviceClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId)

    if (deleteError) {
      return NextResponse.json(
        { error: getErrorMessage(deleteError) },
        { status: 400 }
      )
    }

    if (desiredRoleIds.length > 0) {
      const { error: insertError } = await serviceClient
        .from("user_roles")
        .insert(
          desiredRoleIds.map((roleId) => ({
            user_id: userId,
            role_id: roleId,
          }))
        )

      if (insertError) {
        return NextResponse.json(
          { error: getErrorMessage(insertError) },
          { status: 400 }
        )
      }
    }
  }

  const { data: updatedUser, error: fetchError } = await loadUser(
    serviceClient,
    userId
  )

  if (fetchError || !updatedUser) {
    return NextResponse.json(
      { error: getErrorMessage(fetchError) },
      { status: 400 }
    )
  }

  return NextResponse.json({
    data: normalizeUser(
      updatedUser as typeof updatedUser & {
        user_roles?: Array<{ role?: Role | null }>
      }
    ),
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authContext = await requireAdminRequest(request)
  if ("error" in authContext) return authContext.error

  const { serviceClient } = authContext
  const { id: idParam } = params
  const userId = Number(idParam)

  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 })
  }

  const { data: existingUser, error: existingError } = await serviceClient
    .from("users")
    .select("auth_user_id")
    .eq("id", userId)
    .single()

  if (existingError || !existingUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(
    existingUser.auth_user_id
  )

  if (deleteError) {
    return NextResponse.json(
      { error: getErrorMessage(deleteError) },
      { status: 400 }
    )
  }

  return NextResponse.json({ data: { id: userId } })
}
