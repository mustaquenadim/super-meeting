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
  DoorOpen,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  X,
  Columns3Cog,
} from "lucide-react"
import { useTranslations } from "next-intl"

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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DataTablePagination } from "@/components/ui/data-table/pagination"
import {
  DraggableColumnHeader,
  DraggableTableCell,
} from "@/components/ui/data-table/column-header"
import { useDataTable, type ColumnDefinition } from "@/lib/hooks/use-data-table"

import { Switch } from "@/components/ui/switch"

import FullPageSpinner from "@/components/ui/full-page-spinner"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  useRoomCategories,
  useCreateRoomCategory,
  useDeleteRoomCategory,
} from "@/lib/hooks"
import type {
  RoomCategory as ApiRoomCategory,
  PaginatedResponse,
} from "@/lib/api/types"

type Category = {
  id: number
  name: string
  description?: string
  status?: string
  roomCount?: number
}

type CategoryColumnKey = "name" | "description" | "rooms" | "status" | "actions"


const DEFAULT_COLUMN_ORDER: CategoryColumnKey[] = [
  "name",
  "description",
  "rooms",
  "status",
  "actions",
]


function getCategorySortVal(
  category: Category,
  col: CategoryColumnKey
): string {
  switch (col) {
    case "name":
      return category.name.toLowerCase()
    case "description":
      return String(category.description ?? "").toLowerCase()
    case "rooms":
      return String(category.roomCount ?? 0)
    case "status":
      return String(category.status ?? "").toLowerCase()
    default:
      return ""
  }
}

export default function RoomCategoriesPage() {
  const t = useTranslations("rooms.categories")
  const tCommon = useTranslations("rooms.common")

  const CATEGORY_COLUMNS: Record<CategoryColumnKey, ColumnDefinition> =
    React.useMemo(
      () => ({
        name: {
          label: t("table.name"),
          sortable: true,
          defaultVisible: true,
        },
        description: {
          label: t("table.description"),
          sortable: true,
          defaultVisible: true,
        },
        rooms: {
          label: t("table.rooms"),
          sortable: true,
          defaultVisible: true,
        },
        status: {
          label: tCommon("status"),
          sortable: true,
          defaultVisible: true,
        },
        actions: {
          label: tCommon("actions"),
          sortable: false,
          defaultVisible: true,
          hideable: false,
        },
      }),
      [t, tCommon]
    )
  const { data: categoriesData, isLoading: categoriesLoading } =
    useRoomCategories(1, 200)
  const createCategory = useCreateRoomCategory()
  const deleteCategory = useDeleteRoomCategory()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false)
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(
    () => new Set()
  )
  const clearSelection = () => setSelectedIds(new Set())

  const [currentPage, setCurrentPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  const {
    columnVisibility,
    sortColumn,
    sortDirection,
    orderedVisibleColumns,
    handleSort,
    handleDragEnd,
    toggleColumnVisibility,
    sortRows,
  } = useDataTable<CategoryColumnKey>({
    columns: CATEGORY_COLUMNS,
    defaultOrder: DEFAULT_COLUMN_ORDER,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  React.useEffect(() => {
    clearSelection()
  }, [currentPage, searchQuery, statusFilter])
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    status: "active",
  })

  if (categoriesLoading) return <FullPageSpinner />

  const categories: Category[] =
    (categoriesData as PaginatedResponse<ApiRoomCategory[]> | undefined)
      ?.data ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCategory.mutateAsync({
        name: formData.name,
        description: formData.description,
        status: formData.status,
      } as Partial<ApiRoomCategory>)
      toast.success(t("messages.created"))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("messages.failedCreate")
      toast.error(errorMessage)
    } finally {
      setFormData({
        name: "",
        description: "",
        status: "active",
      })
      setIsDialogOpen(false)
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description ?? "",
      status: category.status ?? "active",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle edit submission
    console.log("Updated category:", selectedCategory?.id, formData)
    // Reset and close dialog
    setIsEditDialogOpen(false)
    setSelectedCategory(null)
    setFormData({
      name: "",
      description: "",
      status: "active",
    })
  }

  const handleView = (category: Category) => {
    setSelectedCategory(category)
    setIsViewDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    try {
      await deleteCategory.mutateAsync(String(selectedCategory.id))
      toast.success(t("messages.deleted"))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("messages.failedDelete")
      toast.error(errorMessage)
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
    }
  }

  const getStatusVariant = (status: string) => {
    return status === "active" ? "default" : "secondary"
  }

  const filteredCategories = categories.filter((category) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      category.name.toLowerCase().includes(q) ||
      String(category.description ?? "")
        .toLowerCase()
        .includes(q)
    const matchesStatus =
      statusFilter === "all" ? true : category.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedCategories = sortRows(filteredCategories, getCategorySortVal)

  const activeFilterCount = statusFilter !== "all" ? 1 : 0

  const clearFilters = () => {
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const totalItems = sortedCategories.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedCategories = sortedCategories.slice(startIndex, endIndex)

  const allPageSelected =
    paginatedCategories.length > 0 &&
    paginatedCategories.every((c) => selectedIds.has(c.id))
  const somePageSelected = paginatedCategories.some((c) =>
    selectedIds.has(c.id)
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
      paginatedCategories.forEach((category) => {
        if (checked) next.add(category.id)
        else next.delete(category.id)
      })
      return next
    })
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) => deleteCategory.mutateAsync(String(id)))
    )
    const failed = results.filter((result) => result.status === "rejected")

    if (failed.length === 0) {
      toast.success(t("messages.bulkDeleted", { count: ids.length }))
    } else {
      toast.error(t("messages.bulkDeleteFailed", { count: failed.length }))
    }

    clearSelection()
    setIsBulkDeleteDialogOpen(false)
  }

  const renderCell = (category: Category, col: CategoryColumnKey) => {
    switch (col) {
      case "name":
        return (
          <DraggableTableCell key={col} columnKey={col} className="font-medium">
            {category.name}
          </DraggableTableCell>
        )
      case "description":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <span className="line-clamp-2 text-sm text-muted-foreground">
              {category.description || "—"}
            </span>
          </DraggableTableCell>
        )
      case "rooms":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <div className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
              <span>
                {t("table.roomsCount", {
                  count: category.roomCount ?? 0,
                })}
              </span>
            </div>
          </DraggableTableCell>
        )
      case "status":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <Badge variant={getStatusVariant(category.status ?? "active")}>
              {category.status === "active"
                ? tCommon("active")
                : tCommon("inactive")}
            </Badge>
          </DraggableTableCell>
        )
      case "actions":
        return (
          <DraggableTableCell key={col} columnKey={col} className="text-end">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                {tCommon("edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(category)}
              >
                {tCommon("view")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedCategory(category)
                  setIsDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {tCommon("delete")}
              </Button>
            </div>
          </DraggableTableCell>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t("addCategory")}
        </Button>
      </div>

      <Card className="min-w-0">
        <CardContent className="overflow-x-hidden p-0">
          <div className="flex min-w-0 flex-col gap-4 border-b p-4">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("toolbar.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                      <span className="hidden lg:inline">{tCommon("filters")}</span>
                      {activeFilterCount > 0 && (
                        <Badge
                          variant="default"
                          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                        >
                          {activeFilterCount}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0">
                    <div
                      className="space-y-4 p-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{tCommon("filters")}</h3>
                        {activeFilterCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              clearFilters()
                            }}
                            className="h-7 text-xs"
                          >
                            <X className="mr-1 h-3 w-3" />
                            {tCommon("clearAll")}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {tCommon("status")}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {(["active", "inactive"] as const).map((status) => (
                            <Button
                              key={status}
                              variant={
                                statusFilter === status ? "default" : "outline"
                              }
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                setStatusFilter(
                                  statusFilter === status ? "all" : status
                                )
                              }
                            >
                              {status === "active"
                                ? tCommon("active")
                                : tCommon("inactive")}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns3Cog className="h-4 w-4" />
                        {tCommon("customizeColumns")}
                      <span className="lg:hidden">{tCommon("columns")}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {DEFAULT_COLUMN_ORDER.filter(
                      (key) => CATEGORY_COLUMNS[key].hideable !== false
                    ).map((key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={columnVisibility[key]}
                        onCheckedChange={() => toggleColumnVisibility(key)}
                      >
                        {CATEGORY_COLUMNS[key].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {tCommon("activeFilters")}
                </span>
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {tCommon("status")}:{" "}
                    {statusFilter === "active"
                      ? tCommon("active")
                      : tCommon("inactive")}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm font-medium">
                  {tCommon("selectedCount", { count: selectedIds.size })}
                </Badge>
                <button
                  onClick={clearSelection}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {tCommon("clear")}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {tCommon("actions")}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tCommon("delete")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="w-full max-w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <SortableContext
                    items={orderedVisibleColumns}
                    strategy={horizontalListSortingStrategy}
                  >
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
                          aria-label="Select all"
                        />
                      </TableHead>
                      {orderedVisibleColumns.map((col) => (
                        <DraggableColumnHeader
                          key={col}
                          columnKey={col}
                          label={CATEGORY_COLUMNS[col].label}
                          sortable={CATEGORY_COLUMNS[col].sortable}
                          align={col === "actions" ? "right" : "left"}
                          draggable={col !== "actions"}
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      ))}
                    </TableRow>
                  </SortableContext>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={orderedVisibleColumns.length + 1}
                        className="py-8 text-center"
                      >
                        <p className="text-muted-foreground">
                          {tCommon("noResults")}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCategories.map((category) => (
                      <SortableContext
                        key={category.id}
                        items={orderedVisibleColumns}
                        strategy={horizontalListSortingStrategy}
                      >
                        <TableRow
                          data-state={
                            selectedIds.has(category.id)
                              ? "selected"
                              : undefined
                          }
                        >
                          <TableCell className="w-10 px-4">
                            <Checkbox
                              checked={selectedIds.has(category.id)}
                              onCheckedChange={(value) =>
                                handleSelectRow(category.id, value === true)
                              }
                              aria-label="Select row"
                            />
                          </TableCell>
                          {orderedVisibleColumns.map((col) =>
                            renderCell(category, col)
                          )}
                        </TableRow>
                      </SortableContext>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DndContext>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            itemLabel="categories"
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dialogs.bulkDelete.title", { count: selectedIds.size })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.bulkDelete.description", { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>{t("dialogs.add.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.add.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="category-name">
                  {t("form.categoryName")}
                </FieldLabel>
                <Input
                  id="category-name"
                  placeholder={t("form.enterCategoryName")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="category-description">
                  {t("form.description")}
                </FieldLabel>
                <Textarea
                  id="category-description"
                  placeholder={t("form.enterCategoryDescription")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="category-status">
                    {tCommon("status")}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formData.status === "active"
                        ? tCommon("active")
                        : tCommon("inactive")}
                    </span>
                    <Switch
                      id="category-status"
                      checked={formData.status === "active"}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          status: checked ? "active" : "inactive",
                        })
                      }
                    />
                  </div>
                </div>
              </Field>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={createCategory.status === "pending"}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createCategory.status === "pending"}
                >
                  {createCategory.status === "pending" && (
                    <Spinner className="me-2" />
                  )}
                  {t("addCategory")}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>{t("dialogs.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.edit.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-category-name">
                  {t("form.categoryName")}
                </FieldLabel>
                <Input
                  id="edit-category-name"
                  placeholder={t("form.enterCategoryName")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-category-description">
                  {t("form.description")}
                </FieldLabel>
                <Textarea
                  id="edit-category-description"
                  placeholder={t("form.enterCategoryDescription")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="edit-category-status">
                    {tCommon("status")}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formData.status === "active"
                        ? tCommon("active")
                        : tCommon("inactive")}
                    </span>
                    <Switch
                      id="edit-category-status"
                      checked={formData.status === "active"}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          status: checked ? "active" : "inactive",
                        })
                      }
                    />
                  </div>
                </div>
              </Field>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedCategory(null)
                  }}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit">{t("buttons.update")}</Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Category Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>{t("dialogs.view.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.view.description")}
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t("table.name")}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-base font-semibold">
                    {selectedCategory.name}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t("table.description")}
                </div>
                <div className="text-base">{selectedCategory.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t("table.rooms")}
                  </div>
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    <div className="text-base">
                      {t("table.roomsCount", {
                        count: selectedCategory.roomCount ?? 0,
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {tCommon("status")}
                  </div>
                  <Badge
                    variant={getStatusVariant(
                      selectedCategory.status ?? "active"
                    )}
                  >
                    {selectedCategory.status === "active"
                      ? tCommon("active")
                      : tCommon("inactive")}
                  </Badge>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    setSelectedCategory(null)
                  }}
                >
                  {t("buttons.close")}
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    handleEdit(selectedCategory)
                  }}
                >
                  {t("buttons.edit")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>{t("dialogs.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.delete.description")}
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {t("dialogs.delete.aboutToDelete")}
              </p>
              <code className="mt-2 inline-block rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
                {selectedCategory.name}
              </code>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteCategory.status === "pending"}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCategory.status === "pending"}
            >
              {deleteCategory.status === "pending" && (
                <Spinner className="me-2" />
              )}
              <Trash2 className="me-2 h-4 w-4" />
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
