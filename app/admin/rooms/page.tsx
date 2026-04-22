"use client"

import * as React from "react"
import {
  DoorOpen,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  X,
  Columns3Cog,
  CheckCircle2,
  EyeIcon,
  PencilIcon,
} from "lucide-react"
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

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTablePagination } from "@/components/ui/data-table/pagination"
import {
  DraggableColumnHeader,
  DraggableTableCell,
} from "@/components/ui/data-table/column-header"
import { useDataTable, type ColumnDefinition } from "@/lib/hooks/use-data-table"

import { toast } from "sonner"
import FullPageSpinner from "@/components/ui/full-page-spinner"
import { Spinner } from "@/components/ui/spinner"
import {
  useRooms,
  useBranches,
  useCreateRoom,
  useUpdateRoom,
  useAmenities,
  useRoomCategories,
  useDoors,
  useDeleteRoom,
} from "@/lib/hooks"
import type { Room as ApiRoom, RoomViewModel } from "@/lib/api/types"
import {
  RoomFormDialog,
  RoomFormPayload,
} from "@/components/forms/room-form-dialog"
import { ViewRoomDialog } from "./_components/view-room-dialog"

export default function RoomsPage() {
  const t = useTranslations("rooms")
  const tCommon = useTranslations("rooms.common")

  const ROOM_COLUMNS: Record<RoomColumnKey, ColumnDefinition> = React.useMemo(
    () => ({
      name: { label: t("table.name"), sortable: true, defaultVisible: true },
      branch: {
        label: t("table.location"),
        sortable: true,
        defaultVisible: true,
      },
      doors: { label: t("table.doors"), sortable: true, defaultVisible: true },
      type: { label: t("table.category"), sortable: true, defaultVisible: true },
      capacity: {
        label: t("table.capacity"),
        sortable: true,
        defaultVisible: true,
      },
      status: { label: t("table.status"), sortable: true, defaultVisible: true },
      actions: {
        label: t("table.actions"),
        sortable: false,
        defaultVisible: true,
        hideable: false,
      },
    }),
    [t]
  )
  const { data: roomsData, isLoading: roomsLoading } = useRooms(1, 200)
  const { data: branchesData } = useBranches(1, 200)
  const { data: amenitiesData } = useAmenities(1, 200)
  const { data: roomCategoriesData } = useRoomCategories(1, 200)
  const { data: doorsData, error: doorsError } = useDoors(1, 200)

  const doors = doorsData?.data ?? []
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const deleteRoom = useDeleteRoom()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false)
  const [selectedRoom, setSelectedRoom] = React.useState<RoomViewModel | null>(
    null
  )

  const handleCreateSubmit = async (payload: RoomFormPayload) => {
    try {
      await createRoom.mutateAsync({
        name: payload.name,
        locationId: payload.locationId,
        doors: payload.doors,
        capacity: payload.capacity,
        category: payload.category,
        status: payload.status as ApiRoom["status"],
        description: payload.description,
        price: payload.price,
        amenities: payload.amenities,
      })
      toast.success(t("messages.created"))
      setIsDialogOpen(false)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : t("messages.failedCreate")
      toast.error(errorMessage)
      throw err
    }
  }

  const rooms: RoomViewModel[] = (roomsData?.data ?? []).map((r: ApiRoom) => {
    const roomDoors = Array.isArray(r.doors)
      ? r.doors.map((door) => ({ id: String(door.id), name: door.name }))
      : r.door
        ? [{ id: String(r.door.id), name: r.door.name }]
        : []

    return {
      id: String(r.id),
      name: r.name,
      branch: r.branch
        ? { id: String(r.branch.id), name: r.branch.name }
        : r.location
          ? { id: String(r.location.id), name: r.location.name }
          : { id: "", name: "" },
      door: roomDoors[0],
      doors: roomDoors,
      capacity: r.capacity ? Number(r.capacity) : undefined,
      type: r.category?.name ?? "",
      room_category_id: r.category ? String(r.category.id) : undefined,
      status: r.status ?? "available",
      equipment: (r.amenities ?? []).map((a) => ({
        id: a.id,
        name: a.name,
      })),
      description: r.description ?? "",
      price: r.price ? Number(r.price) : 0,
    }
  })

  const branches = branchesData?.data ?? []
  const amenitiesList = amenitiesData?.data ?? []
  const roomCategories = roomCategoriesData?.data ?? []

  type RoomColumnKey =
    | "name"
    | "branch"
    | "doors"
    | "type"
    | "capacity"
    | "status"
    | "actions"

  const DEFAULT_COLUMN_ORDER: RoomColumnKey[] = [
    "name",
    "branch",
    "doors",
    "type",
    "capacity",
    "status",
    "actions",
  ]

  function getRoomSortVal(room: RoomViewModel, col: RoomColumnKey): string {
    switch (col) {
      case "name":
        return room.name.toLowerCase()
      case "branch":
        return String(room.branch?.name ?? "").toLowerCase()
      case "doors":
        return (room.doors ?? (room.door ? [room.door] : []))
          .map((door) => door.name.toLowerCase())
          .join(", ")
      case "type":
        return String(room.type ?? "").toLowerCase()
      case "capacity":
        return String(room.capacity ?? 0).padStart(5, "0")
      case "status":
        return String(room.status ?? "").toLowerCase()
      default:
        return ""
    }
  }

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | string>("all")

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
  } = useDataTable<RoomColumnKey>({
    columns: ROOM_COLUMNS,
    defaultOrder: DEFAULT_COLUMN_ORDER,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  React.useEffect(() => setCurrentPage(1), [searchQuery, statusFilter])
  React.useEffect(
    () => clearSelection(),
    [currentPage, searchQuery, statusFilter]
  )

  if (roomsLoading) return <FullPageSpinner />

  const filteredRooms = rooms.filter((r) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      String(r.branch?.name ?? "")
        .toLowerCase()
        .includes(q) ||
      (r.doors ?? (r.door ? [r.door] : []))
        .map((door) => door.name.toLowerCase())
        .join(" ")
        .includes(q) ||
      String(r.type ?? "")
        .toLowerCase()
        .includes(q) ||
      String(r.capacity ?? "")
        .toLowerCase()
        .includes(q)
    const matchesStatus =
      statusFilter === "all" ? true : r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedRooms = sortRows(filteredRooms, getRoomSortVal)

  const totalItems = sortedRooms.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedRooms = sortedRooms.slice(startIndex, endIndex)

  const allPageSelected =
    paginatedRooms.length > 0 &&
    paginatedRooms.every((r) => selectedIds.has(r.id))
  const somePageSelected = paginatedRooms.some((r) => selectedIds.has(r.id))

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
      paginatedRooms.forEach((r) => {
        if (checked) next.add(r.id)
        else next.delete(r.id)
      })
      return next
    })
  }

  const statusOptions = Array.from(new Set(rooms.map((r) => r.status))).filter(
    Boolean
  )

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) => deleteRoom.mutateAsync(Number(id)))
    )
    const failed = results.filter((r) => r.status === "rejected").length
    if (failed === 0)
      toast.success(t("messages.bulkDeleted", { count: ids.length }))
    else toast.error(t("messages.failedBulkDelete", { count: failed }))
    clearSelection()
    setIsBulkDeleteDialogOpen(false)
  }

  const handleBulkStatusChange = async (status: string) => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) =>
        updateRoom.mutateAsync({
          id: Number(id),
          payload: { status } as Partial<ApiRoom>,
        })
      )
    )
    const failed = results.filter((r) => r.status === "rejected").length
    if (failed === 0)
      toast.success(t("messages.bulkUpdated", { count: ids.length }))
    else toast.error(t("messages.failedBulkUpdate", { count: failed }))
    clearSelection()
  }

  const handleEdit = (room: RoomViewModel) => {
    setSelectedRoom(room)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (payload: RoomFormPayload) => {
    if (!selectedRoom) return
    try {
      const id = Number(selectedRoom.id)
      await updateRoom.mutateAsync({
        id,
        payload: {
          name: payload.name,
          locationId: payload.locationId,
          doors: payload.doors,
          capacity: payload.capacity,
          category: payload.category,
          status: payload.status as ApiRoom["status"],
          description: payload.description,
          price: payload.price,
          amenities: payload.amenities,
        },
      })
      toast.success(t("messages.updated"))
      setIsEditDialogOpen(false)
      setSelectedRoom(null)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : t("messages.failedUpdate")
      toast.error(errorMessage)
    }
  }

  const handleView = (room: RoomViewModel) => {
    setSelectedRoom(room)
    setIsViewDialogOpen(true)
  }

  const renderRoomCell = (room: RoomViewModel, col: RoomColumnKey) => {
    switch (col) {
      case "name":
        return (
          <DraggableTableCell key={col} columnKey={col} className="font-medium">
            {room.name}
          </DraggableTableCell>
        )
      case "branch":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            {room.branch?.name || (
              <span className="text-muted-foreground">—</span>
            )}
          </DraggableTableCell>
        )
      case "doors":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            {(room.doors ?? (room.door ? [room.door] : [])).length > 0 ? (
              (room.doors ?? (room.door ? [room.door] : []))
                .map((door) => door.name)
                .join(", ")
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DraggableTableCell>
        )
      case "type":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            {room.type || <span className="text-muted-foreground">—</span>}
          </DraggableTableCell>
        )
      case "capacity":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            {room.capacity ?? <span className="text-muted-foreground">—</span>}
          </DraggableTableCell>
        )
      case "status":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <Badge
              className="capitalize"
              variant={room.status === "available" ? "default" : "secondary"}
            >
              {room.status === "available" ? t("available") : t("unavailable")}
            </Badge>
          </DraggableTableCell>
        )
      case "actions":
        return (
          <DraggableTableCell key={col} columnKey={col} className="text-end">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(room)}
                aria-label={t("viewRoom")}
              >
                <EyeIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(room)}
                aria-label={t("editRoom")}
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteOpen(room)}
                aria-label={t("delete")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </DraggableTableCell>
        )
    }
  }

  const handleDeleteOpen = (room: RoomViewModel) => {
    setSelectedRoom(room)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedRoom) return
    try {
      await deleteRoom.mutateAsync(Number(selectedRoom.id))
      toast.success(t("messages.deleted"))
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : t("messages.failedDelete")
      toast.error(errorMessage)
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedRoom(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <DoorOpen className="me-2 h-4 w-4" />
          {t("addRoom")}
        </Button>
      </div>

      <Card className="min-w-0">
        <CardContent className="overflow-x-hidden p-0">
          <div className="w-full max-w-full min-w-0">
            <div className="flex min-w-0 flex-col gap-4 border-b p-4">
              <div className="flex min-w-0 items-center justify-between gap-4">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("searchPlaceholder")}
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
                        <span className="hidden lg:inline">{t("filters")}</span>
                        {statusFilter !== "all" && (
                          <Badge className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                            1
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
                          <h3 className="font-semibold">{t("filters")}</h3>
                          {statusFilter !== "all" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStatusFilter("all")}
                              className="h-7 text-xs"
                            >
                              <X className="mr-1 h-3 w-3" />
                              {t("clearAll")}
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{t("status")}</Label>
                          <div className="flex flex-wrap gap-2">
                            {statusOptions.map((s) => (
                              <Button
                                key={s}
                                variant={
                                  statusFilter === s ? "default" : "outline"
                                }
                                size="sm"
                                className="h-7 text-xs capitalize"
                                onClick={() =>
                                  setStatusFilter(
                                    statusFilter === s ? "all" : s
                                  )
                                }
                              >
                                {s === "available" ? t("available") : t("unavailable")}
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
                        <span className="hidden lg:inline">
                          {t("customizeColumns")}
                        </span>
                        <span className="lg:hidden">{t("columns")}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {DEFAULT_COLUMN_ORDER.filter(
                        (k) => ROOM_COLUMNS[k].hideable !== false
                      ).map((k) => (
                        <DropdownMenuCheckboxItem
                          key={k}
                          checked={columnVisibility[k]}
                          onCheckedChange={() => toggleColumnVisibility(k)}
                        >
                          {ROOM_COLUMNS[k].label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {statusFilter !== "all" && (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("activeFilters")}
                  </span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {t("status")}: {statusFilter === "available" ? t("available") : t("unavailable")}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {t("bulkSelected", { count: selectedIds.size })}
                  </Badge>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("clear")}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t("changeStatus")}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange("available")}
                      >
                        {t("activate")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange("unavailable")}
                      >
                        {t("deactivate")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("delete")}
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
                            onCheckedChange={(v) => handleSelectAll(v === true)}
                            aria-label="Select all"
                          />
                        </TableHead>
                        {orderedVisibleColumns.map((col) => (
                          <DraggableColumnHeader
                            key={col}
                            columnKey={col}
                            label={ROOM_COLUMNS[col].label}
                            sortable={ROOM_COLUMNS[col].sortable}
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
                    {paginatedRooms.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={orderedVisibleColumns.length + 1}
                          className="py-8 text-center"
                        >
                          <p className="text-muted-foreground">
                            {t("noRoomsFound")}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRooms.map((room) => (
                        <SortableContext
                          key={room.id}
                          items={orderedVisibleColumns}
                          strategy={horizontalListSortingStrategy}
                        >
                          <TableRow
                            data-state={
                              selectedIds.has(room.id) ? "selected" : undefined
                            }
                          >
                            <TableCell className="w-10 px-4">
                              <Checkbox
                                checked={selectedIds.has(room.id)}
                                onCheckedChange={(v) =>
                                  handleSelectRow(room.id, v === true)
                                }
                                aria-label="Select row"
                              />
                            </TableCell>
                            {orderedVisibleColumns.map((col) =>
                              renderRoomCell(room, col)
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
              itemLabel={t("roomsLabel", { count: totalItems })}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(r) => {
                setRowsPerPage(r)
                setCurrentPage(1)
              }}
            />
          </div>
        </CardContent>
      </Card>

      <RoomFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateSubmit}
        branches={branches}
        doors={doors}
        doorsError={doorsError}
        amenities={amenitiesList}
        categories={roomCategories}
        isSubmitting={createRoom.status === "pending"}
      />

      <RoomFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={selectedRoom}
        onSubmit={handleEditSubmit}
        branches={branches}
        doors={doors}
        doorsError={doorsError}
        amenities={amenitiesList}
        categories={roomCategories}
        isSubmitting={updateRoom.status === "pending"}
      />

      <ViewRoomDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        room={selectedRoom}
        onEdit={handleEdit}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDescription", { name: selectedRoom?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          {selectedRoom && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {t("delete.aboutToDelete")}
              </p>
              <code className="mt-2 inline-block rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
                {selectedRoom.name}
              </code>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteRoom.status === "pending"}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRoom.status === "pending"}
            >
              {deleteRoom.status === "pending" && <Spinner className="me-2" />}
              <Trash2 className="me-2 h-4 w-4" />
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete.bulkTitle", { count: selectedIds.size })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.bulkDescription", { count: selectedIds.size })}
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
    </div>
  )
}
