"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  Plus,
  Search,
  ChevronDown,
  Columns3Cog,
  Users,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  ACTION_LABELS,
  MODULE_LABELS,
  MODULE_PERMISSIONS,
  PermissionModule,
  type PermissionName,
} from "@/lib/rbac/types"
import type { RoleWithStats } from "@/lib/api/types"
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "@/lib/hooks/use-roles"
import { DataTablePagination } from "@/components/ui/data-table/pagination"
import {
  DraggableColumnHeader,
  DraggableTableCell,
} from "@/components/ui/data-table/column-header"
import { useDataTable } from "@/lib/hooks/use-data-table"

type RoleColumnKey = "roleName" | "users" | "permissions" | "actions"

const DEFAULT_COLUMN_ORDER: RoleColumnKey[] = [
  "roleName",
  "users",
  "permissions",
  "actions",
]

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-700 border-red-200",
  manager: "bg-blue-500/10 text-blue-700 border-blue-200",
  staff: "bg-green-500/10 text-green-700 border-green-200",
  viewer: "bg-gray-500/10 text-gray-700 border-gray-200",
}

function getPermissionLabel(permission: PermissionName) {
  const [module, action] = permission.split(".") as [string, string]
  return `${ACTION_LABELS[action] ?? action} ${
    MODULE_LABELS[module as PermissionModule] ?? module
  }`
}

export default function RolesPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(
    () => new Set()
  )
  const [currentPage, setCurrentPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [createFormData, setCreateFormData] = React.useState({ name: "" })
  const [selectedPermissions, setSelectedPermissions] = React.useState<
    PermissionName[]
  >([])

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<RoleWithStats | null>(
    null
  )
  const [editFormData, setEditFormData] = React.useState({ name: "" })
  const [editPermissions, setEditPermissions] = React.useState<
    PermissionName[]
  >([])

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [deletingRole, setDeletingRole] = React.useState<RoleWithStats | null>(
    null
  )

  const [canCreateRoles] = React.useState(true)
  const [canUpdateRoles] = React.useState(true)
  const [canDeleteRoles] = React.useState(true)

  const { data: roles, isLoading: isLoadingRoles } = useRoles()
  const { data: permissions, isLoading: isLoadingPermissions } =
    usePermissions()

  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

  const groupedPermissions = React.useMemo(
    () =>
      Object.entries(MODULE_PERMISSIONS).map(([module, permissions]) => ({
        module: module as PermissionModule,
        permissions,
      })),
    []
  )

  const isModuleSelected = (moduleKey: PermissionModule, edit = false) => {
    const group = groupedPermissions.find((group) => group.module === moduleKey)
    if (!group) return false
    const names = group.permissions
    const selected = edit ? editPermissions : selectedPermissions
    return names.every((name) => selected.includes(name))
  }

  const isModulePartiallySelected = (
    moduleKey: PermissionModule,
    edit = false
  ) => {
    const group = groupedPermissions.find((group) => group.module === moduleKey)
    if (!group) return false
    const names = group.permissions
    const selected = edit ? editPermissions : selectedPermissions
    const count = names.filter((name) => selected.includes(name)).length
    return count > 0 && count < names.length
  }

  const toggleModulePermissions = (
    moduleKey: PermissionModule,
    edit = false
  ) => {
    const group = groupedPermissions.find((group) => group.module === moduleKey)
    if (!group) return
    const names = group.permissions
    const selected = edit ? editPermissions : selectedPermissions
    const setter = edit ? setEditPermissions : setSelectedPermissions

    const allSelected = names.every((name) => selected.includes(name))
    if (allSelected) {
      setter((prev) => prev.filter((name) => !names.includes(name)))
    } else {
      setter(
        (prev) => Array.from(new Set([...prev, ...names])) as PermissionName[]
      )
    }
  }

  const areAllPermissionsSelected = (edit = false) => {
    const available = permissions ?? []
    const selected = edit ? editPermissions : selectedPermissions
    return available.length > 0 && selected.length === available.length
  }

  const toggleAllPermissions = (edit = false) => {
    const available = permissions ?? []
    const setter = edit ? setEditPermissions : setSelectedPermissions
    const selected = edit ? editPermissions : selectedPermissions

    if (available.length === 0) return
    if (selected.length === available.length) {
      setter([])
      return
    }

    setter(available.map((permission) => permission.name as PermissionName))
  }

  const handleCreateRole = () => {
    if (!createFormData.name.trim()) {
      toast.error("Role name is required.")
      return
    }
    createRoleMutation.mutate({
      name: createFormData.name,
      permissions: selectedPermissions,
    })
    setIsCreateDialogOpen(false)
    setCreateFormData({ name: "" })
    setSelectedPermissions([])
  }

  const handleOpenEditDialog = (role: RoleWithStats) => {
    setEditingRole(role)
    setEditFormData({ name: role.name })
    setEditPermissions((role.permissions as PermissionName[]) ?? [])
    setIsEditDialogOpen(true)
  }

  const handleUpdateRole = () => {
    if (!editingRole || !editFormData.name.trim()) {
      toast.error("Role name is required.")
      return
    }
    updateRoleMutation.mutate({
      id: editingRole.id,
      name: editFormData.name,
      permissions: editPermissions,
    })
    setIsEditDialogOpen(false)
    setEditingRole(null)
    setEditFormData({ name: "" })
    setEditPermissions([])
  }

  const handleDeleteRole = () => {
    if (!deletingRole) return
    deleteRoleMutation.mutate(deletingRole.id)
    setIsDeleteDialogOpen(false)
    setDeletingRole(null)
  }

  const handleDuplicateRole = (role: RoleWithStats) => {
    createRoleMutation.mutate({
      name: `${role.name} Copy`,
      permissions: (role.permissions as PermissionName[]) ?? [],
    })
  }

  const togglePermission = (permission: PermissionName, edit = false) => {
    const setter = edit ? setEditPermissions : setSelectedPermissions
    setter((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    )
  }

  const getRoleBadgeColor = (roleName: string) => {
    return (
      ROLE_COLORS[roleName.toLowerCase()] ||
      "bg-purple-500/10 text-purple-700 border-purple-200"
    )
  }

  const filteredRoles = (roles ?? []).filter((role) => {
    const q = searchQuery.trim().toLowerCase()
    return !q || role.name.toLowerCase().includes(q)
  })

  const roleColumns = React.useMemo(
    () => ({
      roleName: { label: "Role", sortable: true, defaultVisible: true },
      users: { label: "Users", sortable: true, defaultVisible: true },
      permissions: {
        label: "Permissions",
        sortable: true,
        defaultVisible: true,
      },
      actions: {
        label: "Actions",
        sortable: false,
        defaultVisible: true,
        hideable: false,
      },
    }),
    []
  )

  const {
    columnVisibility,
    sortColumn,
    sortDirection,
    orderedVisibleColumns,
    handleSort,
    handleDragEnd,
    toggleColumnVisibility,
    sortRows,
  } = useDataTable<RoleColumnKey>({
    columns: roleColumns,
    defaultOrder: DEFAULT_COLUMN_ORDER,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  React.useEffect(() => {
    setSelectedIds(new Set())
  }, [currentPage, searchQuery])

  const sortedRoles = sortRows(filteredRoles, (role, col) => {
    switch (col) {
      case "roleName":
        return role.name.toLowerCase()
      case "users":
        return String(role.users_count ?? 0)
      case "permissions":
        return String(role.permissions_count ?? role.permissions?.length ?? 0)
      default:
        return ""
    }
  })

  const totalItems = sortedRoles.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedRoles = sortedRoles.slice(startIndex, endIndex)

  const allPageSelected =
    paginatedRoles.length > 0 &&
    paginatedRoles.every((role) => selectedIds.has(role.id))
  const somePageSelected = paginatedRoles.some((role) =>
    selectedIds.has(role.id)
  )

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      paginatedRoles.forEach((role) => {
        if (checked) next.add(role.id)
        else next.delete(role.id)
      })
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDeleteRoles = async () => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) => deleteRoleMutation.mutateAsync(id))
    )
    const failed = results.filter(
      (result) => result.status === "rejected"
    ).length
    if (failed === 0) {
      toast.success("Selected roles deleted successfully.")
    }
    setIsBulkDeleteDialogOpen(false)
    clearSelection()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground">
            Manage roles and the permissions granted to each role.
          </p>
        </div>
        {canCreateRoles && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            Create role
          </Button>
        )}
      </div>

      <Card className="min-w-0">
        <CardContent className="overflow-x-hidden p-0">
          <div className="space-y-3 border-b p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search roles"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="ps-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Columns3Cog className="h-4 w-4" />
                      Columns
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {DEFAULT_COLUMN_ORDER.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col}
                        checked={columnVisibility[col]}
                        onCheckedChange={() => toggleColumnVisibility(col)}
                        disabled={col === "actions"}
                      >
                        {roleColumns[col].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {selectedIds.size > 0 && canDeleteRoles && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
                <span className="text-sm font-medium">
                  {selectedIds.size} role(s) selected
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="me-1 h-4 w-4" />
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          <div className="w-full max-w-full min-w-0">
            {isLoadingRoles || isLoadingPermissions ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-60" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : sortedRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 py-12 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No roles yet</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Create a role to start granting permissions across the
                  platform.
                </p>
                {canCreateRoles && (
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="me-2 h-4 w-4" />
                    Create role
                  </Button>
                )}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 px-4">
                        <Checkbox
                          checked={
                            allPageSelected
                              ? true
                              : somePageSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={(value) =>
                            handleSelectAll(value === true)
                          }
                          aria-label="Select all roles"
                        />
                      </TableHead>
                      <SortableContext
                        items={orderedVisibleColumns}
                        strategy={horizontalListSortingStrategy}
                      >
                        {orderedVisibleColumns.map((col) => (
                          <DraggableColumnHeader
                            key={col}
                            columnKey={col}
                            label={roleColumns[col].label}
                            sortable={roleColumns[col].sortable}
                            align={col === "actions" ? "right" : "left"}
                            draggable={col !== "actions"}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                          />
                        ))}
                      </SortableContext>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRoles.map((role) => (
                      <SortableContext
                        key={role.id}
                        items={orderedVisibleColumns}
                        strategy={horizontalListSortingStrategy}
                      >
                        <TableRow
                          data-state={
                            selectedIds.has(role.id) ? "selected" : undefined
                          }
                        >
                          <TableCell className="w-10 px-4">
                            <Checkbox
                              checked={selectedIds.has(role.id)}
                              onCheckedChange={(value) =>
                                handleSelectRow(role.id, value === true)
                              }
                              aria-label="Select role"
                            />
                          </TableCell>
                          {orderedVisibleColumns.map((col) => {
                            if (col === "roleName") {
                              return (
                                <DraggableTableCell key={col} columnKey={col}>
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant="outline"
                                      className={getRoleBadgeColor(role.name)}
                                    >
                                      {role.name}
                                    </Badge>
                                  </div>
                                </DraggableTableCell>
                              )
                            }
                            if (col === "users") {
                              return (
                                <DraggableTableCell key={col} columnKey={col}>
                                  <div className="text-sm text-muted-foreground">
                                    {role.users_count ?? 0} users
                                  </div>
                                </DraggableTableCell>
                              )
                            }
                            if (col === "permissions") {
                              return (
                                <DraggableTableCell key={col} columnKey={col}>
                                  <div className="text-sm text-muted-foreground">
                                    {role.permissions_count ??
                                      role.permissions?.length ??
                                      0}{" "}
                                    permissions
                                  </div>
                                </DraggableTableCell>
                              )
                            }
                            return (
                              <DraggableTableCell
                                key={col}
                                columnKey={col}
                                className="text-end"
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {canUpdateRoles && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleOpenEditDialog(role)
                                        }
                                      >
                                        <Edit className="me-2 h-4 w-4" />
                                        Edit role
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => handleDuplicateRole(role)}
                                    >
                                      <Copy className="me-2 h-4 w-4" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    {canDeleteRoles && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => {
                                            setDeletingRole(role)
                                            setIsDeleteDialogOpen(true)
                                          }}
                                        >
                                          <Trash2 className="me-2 h-4 w-4" />
                                          Delete role
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </DraggableTableCell>
                            )
                          })}
                        </TableRow>
                      </SortableContext>
                    ))}
                  </TableBody>
                </Table>
              </DndContext>
            )}
          </div>

          {!isLoadingRoles && sortedRoles.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows)
                setCurrentPage(1)
              }}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected roles</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected
              role(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleBulkDeleteRoles}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>
              Create a role and assign permissions to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={createFormData.name}
                onChange={(event) =>
                  setCreateFormData({ name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllPermissions(false)}
                >
                  {areAllPermissionsSelected(false)
                    ? "Clear all"
                    : "Select all"}
                </Button>
              </div>
              <ScrollArea className="h-72 rounded-md border">
                <div className="space-y-4 p-4">
                  {groupedPermissions.map((group) => (
                    <div key={group.module} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={
                            isModuleSelected(group.module)
                              ? true
                              : isModulePartiallySelected(group.module)
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={() =>
                            toggleModulePermissions(group.module)
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium capitalize">
                            {MODULE_LABELS[group.module]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.permissions.length} permission(s)
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.permissions.map((permission) => (
                          <label
                            key={permission}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border p-3"
                          >
                            <Checkbox
                              checked={selectedPermissions.includes(permission)}
                              onCheckedChange={() =>
                                togglePermission(permission)
                              }
                            />
                            <span className="text-sm">
                              {getPermissionLabel(permission)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={createRoleMutation.isPending}
            >
              {createRoleMutation.isPending && <Spinner className="me-2" />}
              Create role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>
              Update the role name and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">Role name</Label>
              <Input
                id="edit-role-name"
                value={editFormData.name}
                onChange={(event) =>
                  setEditFormData({ name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllPermissions(true)}
                >
                  {areAllPermissionsSelected(true) ? "Clear all" : "Select all"}
                </Button>
              </div>
              <ScrollArea className="h-72 rounded-md border">
                <div className="space-y-4 p-4">
                  {groupedPermissions.map((group) => (
                    <div key={group.module} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={
                            isModuleSelected(group.module, true)
                              ? true
                              : isModulePartiallySelected(group.module, true)
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={() =>
                            toggleModulePermissions(group.module, true)
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium capitalize">
                            {MODULE_LABELS[group.module]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.permissions.length} permission(s)
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.permissions.map((permission) => (
                          <label
                            key={permission}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border p-3"
                          >
                            <Checkbox
                              checked={editPermissions.includes(permission)}
                              onCheckedChange={() =>
                                togglePermission(permission, true)
                              }
                            />
                            <span className="text-sm">
                              {getPermissionLabel(permission)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending && <Spinner className="me-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {deletingRole?.name ?? "this role"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRole(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              disabled={deleteRoleMutation.isPending}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {deleteRoleMutation.isPending && <Spinner className="me-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
