"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import type { PermissionName } from "@/lib/rbac/types"
import {
  ACTION_LABELS,
  MODULE_LABELS,
  MODULE_PERMISSIONS,
  PermissionModule,
} from "@/lib/rbac/types"
import type { Permission, RoleWithStats } from "@/lib/api/types"

interface RoleRow {
  id: number
  name: string
  permissions: Array<{ permission: PermissionName }>
  users: Array<{ user_id: number }>
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

let permissionId = 1
const mockPermissions: Permission[] = Object.entries(
  MODULE_PERMISSIONS
).flatMap(([, permissions]) =>
  permissions.map((name) => {
    const [module, action] = name.split(".") as [string, string]
    return {
      id: permissionId++,
      name,
      label: `${ACTION_LABELS[action] ?? action} ${
        MODULE_LABELS[module as PermissionModule] ?? module
      }`,
    }
  })
)

export function usePermissions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => mockPermissions,
    staleTime: Infinity,
  })

  return { data, isLoading, error }
}

export function useRoles() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select(
          `
          id,
          name,
          permissions:role_permissions(permission),
          users:user_roles(user_id)
        `
        )
        .order("id", { ascending: true })

      if (rolesError) throw new Error(getErrorMessage(rolesError))

      return (rolesData || []).map((role: RoleRow) => ({
        id: role.id,
        name: role.name,
        permissions: (role.permissions || []).map((p) => p.permission),
        permissions_count: (role.permissions || []).length,
        users_count: (role.users || []).length,
      })) as RoleWithStats[]
    },
  })

  return { data, isLoading, error }
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      permissions: PermissionName[]
    }) => {
      const { data: newRole, error: roleError } = await supabase
        .from("roles")
        .insert({ name: payload.name })
        .select()
        .single()

      if (roleError) throw new Error(getErrorMessage(roleError))

      if (payload.permissions.length > 0) {
        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(
            payload.permissions.map((permission) => ({
              role_id: newRole.id,
              permission,
            }))
          )

        if (permError) throw new Error(getErrorMessage(permError))
      }

      return newRole
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role created successfully.")
    },
    onError: (error) => {
      toast.error(`Error creating role: ${error.message}`)
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      id: number
      name: string
      permissions: PermissionName[]
    }) => {
      const { error: roleError } = await supabase
        .from("roles")
        .update({ name: payload.name })
        .eq("id", payload.id)

      if (roleError) throw new Error(getErrorMessage(roleError))

      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", payload.id)

      if (deleteError) throw new Error(getErrorMessage(deleteError))

      if (payload.permissions.length > 0) {
        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(
            payload.permissions.map((permission) => ({
              role_id: payload.id,
              permission,
            }))
          )

        if (permError) throw new Error(getErrorMessage(permError))
      }

      return payload
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role updated successfully.")
    },
    onError: (error) => {
      toast.error(`Error updating role: ${error.message}`)
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("roles").delete().eq("id", id)

      if (error) throw new Error(getErrorMessage(error))
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Error deleting role: ${error.message}`)
    },
  })
}
