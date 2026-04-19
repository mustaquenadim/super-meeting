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
  MapPin,
  Phone,
  Mail,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  X,
  Columns3Cog,
  Plus,
  CheckCircle2,
  XCircle,
  DoorOpen,
  Users,
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
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import FullPageSpinner from "@/components/ui/full-page-spinner"
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from "@/lib/hooks"
import LocationForm from "@/components/forms/location-form"
import LocationViewDialog from "@/components/admin/location-view-dialog"
import LocationDeleteDialog from "@/components/admin/location-delete-dialog"
import type { Location } from "@/lib/api/types"
import { DraggableColumnHeader } from "@/components/ui/data-table/column-header"
import { DraggableTableCell } from "@/components/ui/data-table/column-header"
import { DataTablePagination } from "@/components/ui/data-table/pagination"
import { useDataTable, type ColumnDefinition } from "@/lib/hooks/use-data-table"

// ─── Column definitions ────────────────────────────────────────────────────────

type LocationColumnKey =
  | "name"
  | "address"
  | "contact"
  | "rooms"
  | "capacity"
  | "status"
  | "actions"

const LOCATION_COLUMNS: Record<LocationColumnKey, ColumnDefinition> = {
  name: { label: "Location Name", sortable: true, defaultVisible: true },
  address: { label: "Address", sortable: true, defaultVisible: true },
  contact: { label: "Contact", sortable: false, defaultVisible: true },
  rooms: { label: "Rooms", sortable: true, defaultVisible: true },
  capacity: { label: "Capacity", sortable: true, defaultVisible: true },
  status: { label: "Status", sortable: true, defaultVisible: true },
  actions: {
    label: "Actions",
    sortable: false,
    defaultVisible: true,
    hideable: false,
  },
}

const DEFAULT_COLUMN_ORDER: LocationColumnKey[] = [
  "name",
  "address",
  "contact",
  "rooms",
  "capacity",
  "status",
  "actions",
]

function getSortVal(location: Location, col: LocationColumnKey): string {
  switch (col) {
    case "name":
      return location.name.toLowerCase()
    case "address":
      return String(location.address ?? "").toLowerCase()
    case "rooms":
      return String(location.roomsCount ?? 0).padStart(5, "0")
    case "capacity":
      return String(location.capacity ?? 0).padStart(5, "0")
    case "status":
      return String(location.status ?? "").toLowerCase()
    default:
      return ""
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocationManagementPage() {
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false)
  const [selectedLocation, setSelectedLocation] =
    React.useState<Location | null>(null)
  const [formData, setFormData] = React.useState<{
    name: string
    address: string
    phone: string
    email: string
    latitude: string
    longitude: string
    status: "active" | "inactive"
  }>({
    name: "",
    address: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    status: "active",
  })

  // API
  const { data, isLoading } = useLocations(1, 20)
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const deleteLocation = useDeleteLocation()

  const locations: Location[] = data?.data ?? []

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all")

  // Bulk selection
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(
    () => new Set()
  )
  const clearSelection = () => setSelectedIds(new Set())

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  // Column management (draggable + visibility + sorting)
  const {
    columnVisibility,
    sortColumn,
    sortDirection,
    orderedVisibleColumns,
    handleSort,
    handleDragEnd,
    toggleColumnVisibility,
    sortRows,
  } = useDataTable<LocationColumnKey>({
    columns: LOCATION_COLUMNS,
    defaultOrder: DEFAULT_COLUMN_ORDER,
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // Reset to page 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  // Clear selection when page or filter changes
  React.useEffect(() => {
    clearSelection()
  }, [currentPage, searchQuery, statusFilter])

  if (isLoading) return <FullPageSpinner />

  // Filtering + sorting
  const filteredLocations = locations.filter((location) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      location.name.toLowerCase().includes(q) ||
      String(location.address ?? "")
        .toLowerCase()
        .includes(q) ||
      String(location.phone ?? "")
        .toLowerCase()
        .includes(q) ||
      String(location.email ?? "")
        .toLowerCase()
        .includes(q)
    const matchesStatus =
      statusFilter === "all" ? true : location.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedLocations = sortRows(filteredLocations, getSortVal)

  const activeFilterCount = statusFilter !== "all" ? 1 : 0
  const clearFilters = () => {
    setStatusFilter("all")
    setCurrentPage(1)
  }

  // Pagination computation
  const totalItems = sortedLocations.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedLocations = sortedLocations.slice(startIndex, endIndex)

  // Selection helpers
  const allPageSelected =
    paginatedLocations.length > 0 &&
    paginatedLocations.every((l) => selectedIds.has(Number(l.id)))
  const somePageSelected = paginatedLocations.some((l) =>
    selectedIds.has(Number(l.id))
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
      paginatedLocations.forEach((l) => {
        if (checked) next.add(Number(l.id))
        else next.delete(Number(l.id))
      })
      return next
    })
  }

  // Action handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createLocation.mutateAsync(formData as unknown as Partial<Location>)
      toast.success("Location created")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || "Failed to create"
      )
    } finally {
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        latitude: "",
        longitude: "",
        status: "active",
      })
      setIsDialogOpen(false)
    }
  }

  const handleEdit = (location: Location) => {
    setSelectedLocation(location)
    setFormData({
      name: location.name,
      address: location.address ?? "",
      phone: location.phone ?? "",
      email: location.email ?? "",
      latitude: location.latitude ?? "",
      longitude: location.longitude ?? "",
      status: location.status ?? "active",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocation) return
    try {
      await updateLocation.mutateAsync({
        id: Number(selectedLocation.id),
        payload: formData as unknown as Partial<Location>,
      })
      toast.success("Location updated")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || "Failed to update"
      )
    } finally {
      setIsEditDialogOpen(false)
      setSelectedLocation(null)
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        latitude: "",
        longitude: "",
        status: "active",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedLocation) return
    try {
      await deleteLocation.mutateAsync(Number(selectedLocation.id))
      toast.success("Location deleted")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || "Failed to delete"
      )
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedLocation(null)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) => deleteLocation.mutateAsync(id))
    )
    const failed = results.filter((r) => r.status === "rejected").length
    if (failed === 0) {
      toast.success(
        `${ids.length} location${ids.length > 1 ? "s" : ""} deleted.`
      )
    } else {
      toast.error(`${failed} deletion${failed > 1 ? "s" : ""} failed.`)
    }
    clearSelection()
    setIsBulkDeleteDialogOpen(false)
  }

  const handleBulkStatusChange = async (status: "active" | "inactive") => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) =>
        updateLocation.mutateAsync({
          id,
          payload: { status } as Partial<Location>,
        })
      )
    )
    const failed = results.filter((r) => r.status === "rejected").length
    if (failed === 0) {
      toast.success(
        `${ids.length} location${ids.length > 1 ? "s" : ""} marked as ${status}.`
      )
    } else {
      toast.error(`${failed} update${failed > 1 ? "s" : ""} failed.`)
    }
    clearSelection()
  }

  const handleView = (location: Location) => {
    setSelectedLocation(location)
    setIsViewDialogOpen(true)
  }

  // Cell renderer
  const renderCell = (location: Location, col: LocationColumnKey) => {
    switch (col) {
      case "name":
        return (
          <DraggableTableCell key={col} columnKey={col} className="font-medium">
            {location.name}
          </DraggableTableCell>
        )
      case "address":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            {location.address ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="max-w-48 truncate text-sm">
                  {location.address}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </DraggableTableCell>
        )
      case "contact":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {location.phone ? (
                  <span>{location.phone}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {location.email ? (
                  <span>{location.email}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </DraggableTableCell>
        )
      case "rooms":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <div className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">
                {location.roomsCount ?? 0} room
                {(location.roomsCount ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </DraggableTableCell>
        )
      case "capacity":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{location.capacity ?? 0} people</span>
            </div>
          </DraggableTableCell>
        )
      case "status":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <Badge
              variant={location.status === "active" ? "default" : "secondary"}
            >
              {location.status === "active" ? "Active" : "Inactive"}
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
                onClick={() => handleEdit(location)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(location)}
              >
                View
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedLocation(location)
                  setIsDeleteDialogOpen(true)
                }}
                disabled={deleteLocation.status === "pending"}
              >
                <Trash2 className="me-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </DraggableTableCell>
        )
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">
            Manage your locations and branches
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card className="min-w-0">
        <CardContent className="overflow-x-hidden p-0">
          {/* Filter / toolbar bar */}
          <div className="flex min-w-0 flex-col gap-4 border-b p-4">
            <div className="flex min-w-0 items-center justify-between gap-4">
              {/* Search */}
              <div className="relative max-w-sm flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Filters dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                      <span className="hidden lg:inline">Filters</span>
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
                        <h3 className="font-semibold">Filters</h3>
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
                            Clear All
                          </Button>
                        )}
                      </div>

                      {/* Status filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="flex flex-wrap gap-2">
                          {(["active", "inactive"] as const).map((s) => (
                            <Button
                              key={s}
                              variant={
                                statusFilter === s ? "default" : "outline"
                              }
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                setStatusFilter(statusFilter === s ? "all" : s)
                              }
                            >
                              {s === "active" ? "Active" : "Inactive"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Customize columns dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns3Cog className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        Customize Columns
                      </span>
                      <span className="lg:hidden">Columns</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {DEFAULT_COLUMN_ORDER.filter(
                      (key) => LOCATION_COLUMNS[key].hideable !== false
                    ).map((key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={columnVisibility[key]}
                        onCheckedChange={() => toggleColumnVisibility(key)}
                      >
                        {LOCATION_COLUMNS[key].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Active filters display */}
            {activeFilterCount > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Active filters:
                </span>
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {statusFilter === "active" ? "Active" : "Inactive"}
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

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm font-medium">
                  {selectedIds.size}{" "}
                  {selectedIds.size === 1 ? "location" : "locations"} selected
                </Badge>
                <button
                  onClick={clearSelection}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Change Status
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusChange("active")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      Activate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusChange("inactive")}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Draggable / sortable table */}
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
                          onCheckedChange={(v) => handleSelectAll(v === true)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      {orderedVisibleColumns.map((col) => (
                        <DraggableColumnHeader
                          key={col}
                          columnKey={col}
                          label={LOCATION_COLUMNS[col].label}
                          sortable={LOCATION_COLUMNS[col].sortable}
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
                  {paginatedLocations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={orderedVisibleColumns.length + 1}
                        className="py-8 text-center"
                      >
                        <p className="text-muted-foreground">
                          No results found
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLocations.map((location) => (
                      <SortableContext
                        key={location.id}
                        items={orderedVisibleColumns}
                        strategy={horizontalListSortingStrategy}
                      >
                        <TableRow
                          data-state={
                            selectedIds.has(Number(location.id))
                              ? "selected"
                              : undefined
                          }
                        >
                          <TableCell className="w-10 px-4">
                            <Checkbox
                              checked={selectedIds.has(Number(location.id))}
                              onCheckedChange={(v) =>
                                handleSelectRow(Number(location.id), v === true)
                              }
                              aria-label="Select row"
                            />
                          </TableCell>
                          {orderedVisibleColumns.map((col) =>
                            renderCell(location, col)
                          )}
                        </TableRow>
                      </SortableContext>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DndContext>

          {/* Pagination */}
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            itemLabel="locations"
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      {/* Bulk delete confirmation */}
      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} location
              {selectedIds.size > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected{" "}
              {selectedIds.size === 1
                ? "location"
                : `${selectedIds.size} locations`}
              . This action cannot be undone.
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

      {/* Dialogs */}
      <LocationForm
        mode="add"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={createLocation.status === "pending"}
      />
      <LocationForm
        mode="edit"
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleEditSubmit}
        isSubmitting={updateLocation.status === "pending"}
      />
      <LocationViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        location={selectedLocation}
        onEdit={handleEdit}
      />
      <LocationDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        location={selectedLocation}
        onDelete={handleDelete}
        isDeleting={deleteLocation.status === "pending"}
      />
    </div>
  )
}
