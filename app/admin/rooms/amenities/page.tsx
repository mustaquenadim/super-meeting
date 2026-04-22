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
  X,
  Columns3Cog,
  Trash2,
  CheckCircle2,
  XCircle,
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import FullPageSpinner from "@/components/ui/full-page-spinner"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  useAmenities,
  useCreateAmenity,
  useUpdateAmenity,
  useDeleteAmenity,
} from "@/lib/hooks"
import type { Amenity, PaginatedResponse, Status } from "@/lib/api/types"

type Equipment = {
  id: string
  name: string
  description: string
  type: string
  status: Status
  roomCount: number
}

type EquipmentFormData = {
  name: string
  description: string
  type: string
  status: Status
}

type EquipmentColumnKey =
  | "equipment"
  | "type"
  | "description"
  | "rooms"
  | "status"
  | "actions"

const DEFAULT_COLUMN_ORDER: EquipmentColumnKey[] = [
  "equipment",
  "type",
  "description",
  "rooms",
  "status",
  "actions",
]

function getEquipmentSortVal(
  equipment: Equipment,
  col: EquipmentColumnKey
): string {
  switch (col) {
    case "equipment":
      return equipment.name.toLowerCase()
    case "type":
      return String(equipment.type ?? "").toLowerCase()
    case "description":
      return String(equipment.description ?? "").toLowerCase()
    case "rooms":
      return String(equipment.roomCount ?? 0)
    case "status":
      return String(equipment.status ?? "").toLowerCase()
    default:
      return ""
  }
}

const equipmentTypes = [
  "av-equipment",
  "furniture",
  "communication",
  "network",
  "amenity",
  "other",
]



export default function RoomAmenitiesPage() {
  const t = useTranslations("rooms.amenities")
  const tCommon = useTranslations("rooms.common")


  const EQUIPMENT_COLUMNS: Record<EquipmentColumnKey, ColumnDefinition> =
    React.useMemo(
      () => ({
        equipment: {
          label: t("table.equipment"),
          sortable: true,
          defaultVisible: true,
        },
        type: { label: t("table.type"), sortable: true, defaultVisible: true },
        description: {
          label: t("table.description"),
          sortable: true,
          defaultVisible: true,
        },
        rooms: { label: t("table.rooms"), sortable: true, defaultVisible: true },
        status: { label: tCommon("status"), sortable: true, defaultVisible: true },
        actions: {
          label: tCommon("actions"),
          sortable: false,
          defaultVisible: true,
          hideable: false,
        },
      }),
      [t, tCommon]
    )
  const { data: equipmentData, isLoading: equipmentLoading } = useAmenities(
    1,
    200
  )
  const createAmenity = useCreateAmenity()
  const updateAmenity = useUpdateAmenity()
  const deleteAmenity = useDeleteAmenity()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false)
  const [selectedEquipment, setSelectedEquipment] =
    React.useState<Equipment | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
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
  } = useDataTable<EquipmentColumnKey>({
    columns: EQUIPMENT_COLUMNS,
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
  const [formData, setFormData] = React.useState<EquipmentFormData>({
    name: "",
    description: "",
    type: "",
    status: "active",
  })

  if (equipmentLoading) return <FullPageSpinner />

  const amenities =
    (equipmentData as PaginatedResponse<Amenity[]> | undefined)?.data ?? []

  const equipment: Equipment[] = amenities.map((amenity) => ({
    id: String(amenity.id),
    name: amenity.name,
    description: amenity.description ?? "",
    type: amenity.type ?? "other",
    status: (amenity.status ?? "active") as Status,
    roomCount: 0,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAmenity.mutateAsync({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        status: formData.status,
      })
      toast.success(t("messages.created"))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : null
      toast.error(message ?? t("messages.failedCreate"))
    } finally {
      setFormData({
        name: "",
        description: "",
        type: "",
        status: "active",
      })
      setIsDialogOpen(false)
    }
  }

  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setFormData({
      name: equipment.name,
      description: equipment.description,
      type: equipment.type,
      status: equipment.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEquipment) return

    try {
      await updateAmenity.mutateAsync({
        id: Number(selectedEquipment.id),
        payload: {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          status: formData.status,
        },
      })
      toast.success(t("messages.updated"))
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("messages.failedUpdate")
      toast.error(message)
      return
    }

    setIsEditDialogOpen(false)
    setSelectedEquipment(null)
    setFormData({
      name: "",
      description: "",
      type: "",
      status: "active",
    })
  }

  const handleView = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setIsViewDialogOpen(true)
  }

  const getStatusVariant = (status: Status) => {
    return status === "active" ? "default" : "secondary"
  }

  const filteredEquipment = equipment.filter((item) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      String(item.description ?? "")
        .toLowerCase()
        .includes(q) ||
      String(item.type ?? "")
        .toLowerCase()
        .includes(q)
    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedEquipment = sortRows(filteredEquipment, getEquipmentSortVal)

  const activeFilterCount = statusFilter !== "all" ? 1 : 0
  const clearFilters = () => {
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const totalItems = sortedEquipment.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedEquipment = sortedEquipment.slice(startIndex, endIndex)

  const allPageSelected =
    paginatedEquipment.length > 0 &&
    paginatedEquipment.every((item) => selectedIds.has(item.id))
  const somePageSelected = paginatedEquipment.some((item) =>
    selectedIds.has(item.id)
  )

  const handleSelectRow = (id: string, checked: boolean) => {
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
      paginatedEquipment.forEach((item) => {
        if (checked) next.add(item.id)
        else next.delete(item.id)
      })
      return next
    })
  }

  const handleDelete = async () => {
    if (!selectedEquipment) return

    try {
      await deleteAmenity.mutateAsync(Number(selectedEquipment.id))
      toast.success(t("messages.deleted"))
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("messages.failedDelete")
      toast.error(message)
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedEquipment(null)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) => deleteAmenity.mutateAsync(Number(id)))
    )
    const failed = results.filter(
      (result) => result.status === "rejected"
    ).length

    if (failed === 0) {
      toast.success(t("messages.bulkDeleted", { count: ids.length }))
    } else {
      toast.error(t("messages.bulkDeleteFailed", { count: failed }))
    }

    clearSelection()
    setIsBulkDeleteDialogOpen(false)
  }

  const handleBulkStatusChange = async (status: "active" | "inactive") => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) =>
        updateAmenity.mutateAsync({
          id: Number(id),
          payload: { status },
        })
      )
    )
    const failed = results.filter(
      (result) => result.status === "rejected"
    ).length

    if (failed === 0) {
      toast.success(
        t("messages.bulkStatusUpdated", {
          count: ids.length,
          status: status === "active" ? tCommon("active") : tCommon("inactive"),
        })
      )
    } else {
      toast.error(t("messages.bulkStatusFailed", { count: failed }))
    }

    clearSelection()
  }

  const renderCell = (item: Equipment, col: EquipmentColumnKey) => {
    switch (col) {
      case "equipment":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <span className="font-medium">{item.name}</span>
          </DraggableTableCell>
        )
      case "type":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <Badge variant="outline">{t(`types.${item.type || "other"}`)}</Badge>
          </DraggableTableCell>
        )
      case "description":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <span className="line-clamp-2 text-sm text-muted-foreground">
              {item.description || "—"}
            </span>
          </DraggableTableCell>
        )
      case "rooms":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <span className="text-sm">
              {t("table.roomsCount", {
                count: item.roomCount ?? 0,
              })}
            </span>
          </DraggableTableCell>
        )
      case "status":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <Badge variant={getStatusVariant(item.status)}>
              {item.status === "active"
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
                onClick={() => handleEdit(item)}
              >
                {tCommon("edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(item)}
              >
                {tCommon("view")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedEquipment(item)
                  setIsDeleteDialogOpen(true)
                }}
                disabled={deleteAmenity.status === "pending"}
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
          {t("addAmenity")}
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
                  <DropdownMenuTrigger>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        {tCommon("filters")}
                      </span>
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
                          {tCommon("filters")}
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
                  <DropdownMenuTrigger>
                    <Button variant="outline" size="sm">
                      <Columns3Cog className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        {tCommon("customizeColumns")}
                      </span>
                      <span className="lg:hidden">{tCommon("columns")}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {DEFAULT_COLUMN_ORDER.filter(
                      (key) => EQUIPMENT_COLUMNS[key].hideable !== false
                    ).map((key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={columnVisibility[key]}
                        onCheckedChange={() => toggleColumnVisibility(key)}
                      >
                        {EQUIPMENT_COLUMNS[key].label}
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
                  <DropdownMenuTrigger>
                    <Button variant="outline" size="sm">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {tCommon("changeStatus")}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusChange("active")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      {tCommon("activate")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusChange("inactive")}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                      {tCommon("deactivate")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tCommon("delete")}
                </Button>
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
                          label={EQUIPMENT_COLUMNS[col].label}
                          sortable={EQUIPMENT_COLUMNS[col].sortable}
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
                  {paginatedEquipment.length === 0 ? (
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
                    paginatedEquipment.map((item) => (
                      <SortableContext
                        key={item.id}
                        items={orderedVisibleColumns}
                        strategy={horizontalListSortingStrategy}
                      >
                        <TableRow
                          data-state={
                            selectedIds.has(item.id) ? "selected" : undefined
                          }
                        >
                          <TableCell className="w-10 px-4">
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={(value) =>
                                handleSelectRow(item.id, value === true)
                              }
                              aria-label="Select row"
                            />
                          </TableCell>
                          {orderedVisibleColumns.map((col) =>
                            renderCell(item, col)
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
            itemLabel={t("equipmentLabel", { count: totalItems })}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.delete.description")}{" "}
              <span className="font-semibold">
                {selectedEquipment?.name ?? t("dialogs.delete.fallbackName")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Equipment Dialog */}
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
                <FieldLabel htmlFor="equipment-name">
                  {t("form.equipmentName")}
                </FieldLabel>
                <Input
                  id="equipment-name"
                  placeholder={t("form.enterEquipmentName")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="equipment-description">
                  {t("form.description")}
                </FieldLabel>
                <Textarea
                  id="equipment-description"
                  placeholder={t("form.enterEquipmentDescription")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="equipment-type">
                  {t("table.type")}
                </FieldLabel>
                <Select
                  value={formData.type || "other"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value ?? "other" })
                  }
                >
                  <SelectTrigger id="equipment-type">
                    <SelectValue placeholder={t("form.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="equipment-status">
                    {tCommon("status")}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formData.status === "active"
                        ? tCommon("active")
                        : tCommon("inactive")}
                    </span>
                    <Switch
                      id="equipment-status"
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
                  disabled={createAmenity.status === "pending"}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createAmenity.status === "pending"}
                >
                  {createAmenity.status === "pending" && (
                    <Spinner className="me-2" />
                  )}
                  {t("addAmenity")}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
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
                <FieldLabel htmlFor="edit-equipment-name">
                  {t("form.equipmentName")}
                </FieldLabel>
                <Input
                  id="edit-equipment-name"
                  placeholder={t("form.enterEquipmentName")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-equipment-description">
                  {t("form.description")}
                </FieldLabel>
                <Textarea
                  id="edit-equipment-description"
                  placeholder={t("form.enterEquipmentDescription")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-equipment-type">
                  {t("table.type")}
                </FieldLabel>
                <Select
                  value={formData.type || "other"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value ?? "other" })
                  }
                >
                  <SelectTrigger id="edit-equipment-type">
                    <SelectValue placeholder={t("form.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="edit-equipment-status">
                    {tCommon("status")}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formData.status === "active"
                        ? tCommon("active")
                        : tCommon("inactive")}
                    </span>
                    <Switch
                      id="edit-equipment-status"
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
                    setSelectedEquipment(null)
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

      {/* View Equipment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>{t("dialogs.view.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.view.description")}
            </DialogDescription>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t("form.equipmentName")}
                </div>
                <div className="text-base font-semibold">
                  {selectedEquipment.name}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t("form.description")}
                </div>
                <div className="text-base">{selectedEquipment.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t("table.type")}
                  </div>
                  <Badge variant="outline">
                    {t(`types.${selectedEquipment.type || "other"}`)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t("table.rooms")}
                  </div>
                  <div className="text-base">
                    {t("table.roomsCount", {
                      count: selectedEquipment.roomCount ?? 0,
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {tCommon("status")}
                </div>
                <Badge variant={getStatusVariant(selectedEquipment.status)}>
                  {selectedEquipment.status === "active"
                    ? tCommon("active")
                    : tCommon("inactive")}
                </Badge>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    setSelectedEquipment(null)
                  }}
                >
                  {t("buttons.close")}
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    handleEdit(selectedEquipment)
                  }}
                >
                  {t("buttons.edit")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
