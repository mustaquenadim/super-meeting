"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Role, User } from "@/lib/api/types"
import { supabase } from "@/lib/supabase"

type UserRoleRow = {
  role?: Role | Role[] | null
}

type UserRow = {
  id: number
  name: string
  email: string
  created_at: string
  user_roles?: UserRoleRow[]
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return "An unexpected error occurred."
}

const USERS_REFETCH_EVENT = "users-refetch"
function emitUsersRefetch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USERS_REFETCH_EVENT))
  }
}

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) throw error
  if (!session?.access_token) {
    throw new Error("You must be signed in to manage users.")
  }

  return session.access_token
}

async function fetchUserApi<T>(path: string, init: RequestInit) {
  const accessToken = await getAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  })

  const json = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      getErrorMessage(json?.error ?? json?.message ?? `HTTP ${response.status}`)
    )
  }

  return json as T
}

function normalizeUserRow(row: UserRow): User {
  const roles = (row.user_roles ?? []).flatMap((entry) => {
    if (!entry.role) return []
    return Array.isArray(entry.role) ? entry.role : [entry.role]
  })

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
    roles,
    role: roles[0]?.name,
  }
}

export function useUsers(_page: number, _limit: number) {
  return useQuery({
    queryKey: ["users", _page, _limit],
    queryFn: async () => {
      const { data, count, error } = await supabase
        .from("users")
        .select(
          `
          id,
          name,
          email,
          created_at,
          user_roles(role:roles(id, name))
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })

      if (error) throw new Error(getErrorMessage(error))

      const normalized = ((data ?? []) as UserRow[]).map(normalizeUserRow)
      return { data: normalized, total: count ?? normalized.length }
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      email: string
      password: string
      password_confirmation: string
      role?: string
    }) => {
      return fetchUserApi<{ data: User }>("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      emitUsersRefetch()
      toast.success("User created successfully.")
    },
    onError: (error) => {
      toast.error(`Error creating user: ${getErrorMessage(error)}`)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      id: number
      name?: string
      password?: string
      password_confirmation?: string
      role?: string
    }) => {
      return fetchUserApi<{ data: User }>(`/api/users/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      emitUsersRefetch()
      toast.success("User updated successfully.")
    },
    onError: (error) => {
      toast.error(`Error updating user: ${getErrorMessage(error)}`)
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      return fetchUserApi<{ data: { id: number } }>(`/api/users/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      emitUsersRefetch()
      toast.success("User deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Error deleting user: ${getErrorMessage(error)}`)
    },
  })
}

export function useAssignRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      roleIds,
    }: {
      userId: number
      roleIds: number[]
    }) => {
      return fetchUserApi<{ data: User }>(`/api/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ roleIds }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      emitUsersRefetch()
      toast.success("Roles updated successfully.")
    },
    onError: (error) => {
      toast.error(`Error assigning roles: ${getErrorMessage(error)}`)
    },
  })
}
