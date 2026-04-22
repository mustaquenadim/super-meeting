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
  Filter,
  ChevronDown,
  Columns3Cog,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  UserCog,
  X,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
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
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import type { User } from "@/lib/api/types"
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useAssignRoles,
  useRoles,
} from "@/lib/hooks"
import {
  DraggableColumnHeader,
  DraggableTableCell,
} from "@/components/ui/data-table/column-header"
import { useDataTable, type ColumnDefinition } from "@/lib/hooks/use-data-table"
import { DataTablePagination } from "@/components/ui/data-table/pagination"

type UserColumnKey = "user" | "email" | "roles" | "joined" | "actions"

const DEFAULT_COLUMN_ORDER: UserColumnKey[] = [
  "user",
  "email",
  "roles",
  "joined",
  "actions",
]

export default function UsersPage() {
  const t = useTranslations("users")
  const tCommon = useTranslations("common")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(
    () => new Set()
  )
  const [currentPage, setCurrentPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  const canCreateUsers = true
  const canUpdateUsers = true
  const canDeleteUsers = true
  const canAssignRoles = true

  const { data: usersData, isLoading: isLoadingUsers } = useUsers(
    currentPage,
    rowsPerPage
  )
  const { data: rolesData } = useRoles()

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()
  const assignRolesMutation = useAssignRoles()

  const users = usersData?.data ?? []
  const availableRoles = rolesData ?? []

  const userColumns = React.useMemo<Record<UserColumnKey, ColumnDefinition>>(
    () => ({
      user: { label: t("table.user"), sortable: true, defaultVisible: true },
      email: { label: t("table.email"), sortable: true, defaultVisible: true },
      roles: { label: t("table.roles"), sortable: true, defaultVisible: true },
      joined: { label: t("table.joined"), sortable: true, defaultVisible: true },
      actions: {
        label: t("table.actions"),
        sortable: false,
        defaultVisible: true,
        hideable: false,
      },
    }),
    [t]
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
  } = useDataTable<UserColumnKey>({
    columns: userColumns,
    defaultOrder: DEFAULT_COLUMN_ORDER,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter])

  React.useEffect(() => {
    setSelectedIds(new Set())
  }, [currentPage, searchQuery, roleFilter])

  const getUserRolesText = (user: User) => {
    if (user.roles && user.roles.length > 0) {
      return user.roles
        .map((role) => role.name)
        .join(", ")
        .toLowerCase()
    }
    return (user.role ?? "").toLowerCase()
  }

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    const matchesRole =
      roleFilter === "all" ||
      user.role === roleFilter ||
      user.roles?.some((r) => r.name === roleFilter)
    return matchesSearch && matchesRole
  })

  const sortedUsers = sortRows(filteredUsers, (user, col) => {
    switch (col) {
      case "user":
        return user.name.toLowerCase()
      case "email":
        return user.email.toLowerCase()
      case "roles":
        return getUserRolesText(user)
      case "joined":
        return String(new Date(user.created_at).getTime())
      default:
        return ""
    }
  })

  const activeFilterCount = roleFilter !== "all" ? 1 : 0

  const clearFilters = () => {
    setRoleFilter("all")
    setCurrentPage(1)
  }

  const totalItems = sortedUsers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex)

  const allPageSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((user) => selectedIds.has(user.id))
  const somePageSelected = paginatedUsers.some((user) =>
    selectedIds.has(user.id)
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
      paginatedUsers.forEach((user) => {
        if (checked) next.add(user.id)
        else next.delete(user.id)
      })
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDeleteUsers = async () => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) => deleteUserMutation.mutateAsync(id))
    )
    const failed = results.filter((r) => r.status === "rejected").length
    if (failed === 0) {
      toast.success(t("messages.bulkDeleteSuccess"))
    }
    setIsBulkDeleteDialogOpen(false)
    clearSelection()
  }

  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [createFormData, setCreateFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "staff",
  })

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    password: "",
    password_confirmation: "",
    role: "",
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [deletingUser, setDeletingUser] = React.useState<User | null>(null)

  const [isManageRolesDialogOpen, setIsManageRolesDialogOpen] =
    React.useState(false)
  const [managingUser, setManagingUser] = React.useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createFormData.name.trim() || !createFormData.email.trim()) {
      toast.error(t("messages.nameEmailRequired"))
      return
    }
    if (createFormData.password !== createFormData.password_confirmation) {
      toast.error(t("messages.passwordsDontMatch"))
      return
    }

    await createUserMutation.mutateAsync({
      name: createFormData.name,
      email: createFormData.email,
      password: createFormData.password,
      password_confirmation: createFormData.password_confirmation,
      role: createFormData.role || undefined,
    })

    setIsCreateDialogOpen(false)
    setCreateFormData({
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "staff",
    })
  }

  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      name: user.name,
      password: "",
      password_confirmation: "",
      role: user.role ?? user.roles?.[0]?.name ?? "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !editFormData.name.trim()) {
      toast.error(t("messages.nameRequired"))
      return
    }
    if (
      editFormData.password &&
      editFormData.password !== editFormData.password_confirmation
    ) {
      toast.error(t("messages.passwordsDontMatch"))
      return
    }

    await updateUserMutation.mutateAsync({
      id: editingUser.id,
      name: editFormData.name,
      ...(editFormData.password
        ? {
            password: editFormData.password,
            password_confirmation: editFormData.password_confirmation,
          }
        : {}),
      ...(editFormData.role ? { role: editFormData.role } : {}),
    })

    setIsEditDialogOpen(false)
    setEditingUser(null)
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    await deleteUserMutation.mutateAsync(deletingUser.id)
    setIsDeleteDialogOpen(false)
    setDeletingUser(null)
  }

  const handleOpenManageRolesDialog = (user: User) => {
    setManagingUser(user)
    setSelectedRoles(
      user.roles?.map((r) => r.name) ?? (user.role ? [user.role] : [])
    )
    setIsManageRolesDialogOpen(true)
  }

  const handleSaveRoles = async () => {
    if (!managingUser) return
    const roleIds = availableRoles
      .filter((r) => selectedRoles.includes(r.name))
      .map((r) => r.id)
    await assignRolesMutation.mutateAsync({
      userId: managingUser.id,
      roleIds,
    })
    setIsManageRolesDialogOpen(false)
    setManagingUser(null)
    setSelectedRoles([])
  }

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    )
  }

  const getUserInitials = (name: string) => {
    const words = name.split(" ")
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getRoleColor = (roleName: string) => {
    const roleColors: Record<string, string> = {
      admin: "bg-red-500/10 text-red-700 border-red-200",
      manager: "bg-blue-500/10 text-blue-700 border-blue-200",
      staff: "bg-green-500/10 text-green-700 border-green-200",
      viewer: "bg-gray-500/10 text-gray-700 border-gray-200",
    }
    return (
      roleColors[roleName.toLowerCase()] ||
      "bg-gray-500/10 text-gray-700 border-gray-200"
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        {canCreateUsers && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t("createUser")}
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
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      {t("filters")}
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5">
                          {activeFilterCount}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="space-y-2 p-2">
                      <Label className="text-xs text-muted-foreground">
                        {t("role")}
                      </Label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder={t("allRoles")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("allRoles")}</SelectItem>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={clearFilters}
                      disabled={activeFilterCount === 0}
                    >
                      {t("clearAll")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Columns3Cog className="h-4 w-4" />
                      {t("columns")}
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
                        {userColumns[col].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t("activeFilters")}</span>
                <Badge variant="secondary" className="gap-1">
                  {t("role")}: {roleFilter}
                  <button
                    type="button"
                    onClick={() => setRoleFilter("all")}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}

            {selectedIds.size > 0 && canDeleteUsers && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
                <span className="text-sm font-medium">
                  {t("usersSelected", { count: selectedIds.size })}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="me-1 h-4 w-4" />
                  {t("delete")}
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  {t("clear")}
                </Button>
              </div>
            )}
          </div>

          <div className="w-full max-w-full min-w-0">
            {isLoadingUsers ? (
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
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 py-12 text-center">
                <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">{t("noUsersFound")}</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {searchQuery
                    ? t("tryAnotherSearch")
                    : t("noUsersDescription")}
                </p>
                {!searchQuery && canCreateUsers && (
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="me-2 h-4 w-4" />
                    {t("createUser")}
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
                          aria-label="Select all rows"
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
                            label={userColumns[col].label}
                            sortable={userColumns[col].sortable}
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
                    {paginatedUsers.map((user) => (
                      <SortableContext
                        key={user.id}
                        items={orderedVisibleColumns}
                        strategy={horizontalListSortingStrategy}
                      >
                        <TableRow
                          data-state={
                            selectedIds.has(user.id) ? "selected" : undefined
                          }
                        >
                          <TableCell className="w-10 px-4">
                            <Checkbox
                              checked={selectedIds.has(user.id)}
                              onCheckedChange={(value) =>
                                handleSelectRow(user.id, value === true)
                              }
                              aria-label="Select row"
                            />
                          </TableCell>
                          {orderedVisibleColumns.map((col) => {
                            if (col === "user") {
                              return (
                                <DraggableTableCell key={col} columnKey={col}>
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {getUserInitials(user.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {user.name}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {user.email}
                                      </span>
                                    </div>
                                  </div>
                                </DraggableTableCell>
                              )
                            }

                            if (col === "email") {
                              return (
                                <DraggableTableCell key={col} columnKey={col}>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                  </div>
                                </DraggableTableCell>
                              )
                            }

                            if (col === "roles") {
                              return (
                                <DraggableTableCell key={col} columnKey={col}>
                                  <div className="flex flex-wrap gap-1">
                                    {user.roles && user.roles.length > 0 ? (
                                      user.roles.map((role) => (
                                        <Badge
                                          key={role.id}
                                          variant="outline"
                                          className={getRoleColor(role.name)}
                                        >
                                          {role.name}
                                        </Badge>
                                      ))
                                    ) : user.role ? (
                                      <Badge
                                        variant="outline"
                                        className={getRoleColor(user.role)}
                                      >
                                        {user.role}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-muted-foreground"
                                      >
                                        {t("table.noRole")}
                                      </Badge>
                                    )}
                                  </div>
                                </DraggableTableCell>
                              )
                            }

                            if (col === "joined") {
                              return (
                                <DraggableTableCell key={col} columnKey={col}>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(user.created_at)}
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
                                    {canUpdateUsers && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleOpenEditDialog(user)
                                        }
                                      >
                                        <Edit className="me-2 h-4 w-4" />
                                        {t("table.editUser")}
                                      </DropdownMenuItem>
                                    )}
                                    {canAssignRoles && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleOpenManageRolesDialog(user)
                                        }
                                      >
                                        <UserCog className="me-2 h-4 w-4" />
                                        {t("table.manageRoles")}
                                      </DropdownMenuItem>
                                    )}
                                    {canDeleteUsers && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => {
                                            setDeletingUser(user)
                                            setIsDeleteDialogOpen(true)
                                          }}
                                        >
                                          <Trash2 className="me-2 h-4 w-4" />
                                          {t("table.deleteUser")}
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

          {!isLoadingUsers && filteredUsers.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              itemLabel={t("title").toLowerCase()}
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
            <AlertDialogTitle>{t("dialogs.bulkDelete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.bulkDelete.description", { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialogs.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleBulkDeleteUsers}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogs.create.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.create.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("dialogs.create.fullName")}</Label>
                <Input
                  id="name"
                  placeholder={t("dialogs.create.fullNamePlaceholder")}
                  value={createFormData.name}
                  onChange={(event) =>
                    setCreateFormData({
                      ...createFormData,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("dialogs.create.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("dialogs.create.emailPlaceholder")}
                  value={createFormData.email}
                  onChange={(event) =>
                    setCreateFormData({
                      ...createFormData,
                      email: event.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("dialogs.create.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("dialogs.create.passwordPlaceholder")}
                  value={createFormData.password}
                  onChange={(event) =>
                    setCreateFormData({
                      ...createFormData,
                      password: event.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">{t("dialogs.create.confirmPassword")}</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  placeholder={t("dialogs.create.confirmPassword")}
                  value={createFormData.password_confirmation}
                  onChange={(event) =>
                    setCreateFormData({
                      ...createFormData,
                      password_confirmation: event.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t("role")}</Label>
                <Select
                  value={createFormData.role}
                  onValueChange={(value) =>
                    setCreateFormData({ ...createFormData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder={t("dialogs.create.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                {t("dialogs.cancel")}
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending && <Spinner className="me-2" />}
                {t("createUser")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogs.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.edit.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("dialogs.create.fullName")}</Label>
                <Input
                  id="edit-name"
                  placeholder={t("dialogs.create.fullNamePlaceholder")}
                  value={editFormData.name}
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">{t("role")}</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, role: value })
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder={t("dialogs.create.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">{t("dialogs.edit.newPassword")}</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder={t("dialogs.edit.passwordHelp")}
                  value={editFormData.password}
                  onChange={(event) =>
                    setEditFormData({
                      ...editFormData,
                      password: event.target.value,
                    })
                  }
                />
              </div>
              {editFormData.password && (
                <div className="space-y-2">
                  <Label htmlFor="edit-password-confirmation">
                    {t("dialogs.edit.confirmNewPassword")}
                  </Label>
                  <Input
                    id="edit-password-confirmation"
                    type="password"
                    placeholder={t("dialogs.edit.confirmNewPassword")}
                    value={editFormData.password_confirmation}
                    onChange={(event) =>
                      setEditFormData({
                        ...editFormData,
                        password_confirmation: event.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                {t("dialogs.cancel")}
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending && <Spinner className="me-2" />}
                <Edit className="me-2 h-4 w-4" />
                {t("table.editUser")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.delete.description", {
                name: deletingUser?.name ?? t("title").toLowerCase(),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUser(null)}>
              {t("dialogs.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending && <Spinner className="me-2" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isManageRolesDialogOpen}
        onOpenChange={setIsManageRolesDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dialogs.manageRoles.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.manageRoles.description", {
                name: managingUser?.name ?? t("title").toLowerCase(),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">{managingUser?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {managingUser?.email}
                </div>
              </div>
              <Badge variant="secondary">
                {t("dialogs.manageRoles.rolesCount", {
                  count: selectedRoles.length,
                })}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>{t("dialogs.manageRoles.availableRoles")}</Label>
              <ScrollArea className="h-72 rounded-md border">
                <div className="space-y-4 p-4">
                  {availableRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start space-x-3 rounded-lg border p-3 rtl:space-x-reverse"
                    >
                      <Checkbox
                        id={`role-${role.name}`}
                        checked={selectedRoles.includes(role.name)}
                        onCheckedChange={() => toggleRole(role.name)}
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={`role-${role.name}`}
                          className="cursor-pointer font-medium capitalize"
                        >
                          {role.name}
                        </Label>
                        {role.permissions && role.permissions.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {t("dialogs.manageRoles.permissions", {
                              count: role.permissions.length,
                            })}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={getRoleColor(role.name)}
                      >
                        {role.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsManageRolesDialogOpen(false)
                setManagingUser(null)
                setSelectedRoles([])
              }}
            >
              {t("dialogs.cancel")}
            </Button>
            <Button
              onClick={handleSaveRoles}
              disabled={assignRolesMutation.isPending}
            >
              {assignRolesMutation.isPending && <Spinner className="me-2" />}
              <UserCog className="me-2 h-4 w-4" />
              {t("dialogs.manageRoles.saveRoles")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
