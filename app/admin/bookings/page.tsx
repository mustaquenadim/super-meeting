"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
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
  Clock,
  MapPin,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  ChevronDown,
  Columns3Cog,
  X,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  CircleCheck,
  Calendar as CalendarIcon,
  Trash2,
  MoreHorizontal,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { DataTablePagination } from "@/components/ui/data-table/pagination"
import {
  DraggableColumnHeader,
  DraggableTableCell,
} from "@/components/ui/data-table/column-header"
import { useDataTable, type ColumnDefinition } from "@/lib/hooks/use-data-table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import FullPageSpinner from "@/components/ui/full-page-spinner"
import { Spinner } from "@/components/ui/spinner"
import {
  useBookings,
  useBranches,
  useRooms,
  useUpdateBooking,
  useDeleteBooking,
} from "@/lib/hooks"
import type {
  Booking as ApiBooking,
  BookingStatus,
  Branch,
  Room as ApiRoom,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type BookingRow = {
  id: string
  room: string
  roomName: string
  branch: string
  branchName: string
  date: Date
  startTime: string
  endTime: string
  organizer: string
  attendees: string[] | null
  purpose: string
  status: BookingStatus
  duration: string
  password: string
  pin: string
  phone: string
  email: string
  emailVerifiedAt: string
  photo: string
  coupon: string
  existingCustomer: boolean
  totalAmount: string
  discountAmount: string
  paymentMethod: string
  paymentStatus: string
  transactionId: string
  createdAt: string
  updatedAt: string
}

type RoomOption = {
  id: string
  name: string
  capacity: number
}

type BookingColumnKey =
  | "room"
  | "branch"
  | "dateTime"
  | "organizer"
  | "contact"
  | "payment"
  | "created"
  | "status"
  | "actions"

const DEFAULT_COLUMN_ORDER: BookingColumnKey[] = [
  "room",
  "branch",
  "dateTime",
  "organizer",
  "contact",
  "payment",
  "created",
  "status",
  "actions",
]

const STATUS_OPTIONS: BookingStatus[] = [
  "pending",
  "confirmed",
  "visiting",
  "completed",
  "cancelled",
]

function getBookingSortVal(booking: BookingRow, col: BookingColumnKey): string {
  switch (col) {
    case "room":
      return booking.roomName.toLowerCase()
    case "branch":
      return booking.branchName.toLowerCase()
    case "dateTime":
      return String(booking.date.getTime()).padStart(20, "0")
    case "organizer":
      return booking.organizer.toLowerCase()
    case "contact":
      return `${booking.email} ${booking.phone}`.toLowerCase()
    case "payment":
      return `${booking.paymentStatus} ${booking.totalAmount} ${booking.paymentMethod}`.toLowerCase()
    case "created":
      return booking.createdAt
    case "status":
      return booking.status.toLowerCase()
    default:
      return ""
  }
}

function formatDetailValue(value: unknown) {
  if (value === null || value === undefined) return "-"
  if (typeof value === "string") return value.trim() ? value : "-"
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function getStatusVariant(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return "default"
    case "pending":
      return "secondary"
    case "visiting":
      return "default"
    case "completed":
      return "outline"
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

function getStatusIcon(status: BookingStatus) {
  switch (status) {
    case "pending":
      return <AlertCircle className="h-4 w-4" />
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4" />
    case "visiting":
      return <CircleDot className="h-4 w-4" />
    case "completed":
      return <CircleCheck className="h-4 w-4" />
    case "cancelled":
      return <X className="h-4 w-4" />
    default:
      return null
  }
}

function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Pending"
    case "confirmed":
      return "Confirmed"
    case "visiting":
      return "Visiting"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
}

function formatTime(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":")
  const date = new Date()
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10))
  return format(date, "h:mm a")
}

export default function BookingsPage() {
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings(1, 100)
  const { data: branchesData } = useBranches(1, 200)
  const { data: roomsData } = useRooms(1, 200)

  const updateBooking = useUpdateBooking()
  const deleteBooking = useDeleteBooking()

  const bookingColumns = React.useMemo<
    Record<BookingColumnKey, ColumnDefinition>
  >(
    () => ({
      room: { label: "Room", sortable: true, defaultVisible: true },
      branch: { label: "Branch", sortable: true, defaultVisible: true },
      dateTime: { label: "Date & Time", sortable: true, defaultVisible: true },
      organizer: { label: "Organizer", sortable: true, defaultVisible: true },
      contact: { label: "Contact", sortable: true, defaultVisible: true },
      payment: { label: "Payment", sortable: true, defaultVisible: true },
      created: { label: "Created", sortable: true, defaultVisible: false },
      status: { label: "Status", sortable: true, defaultVisible: true },
      actions: {
        label: "Actions",
        sortable: false,
        defaultVisible: true,
        hideable: false,
      },
    }),
    []
  )

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | BookingStatus>(
    "all"
  )
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [currentPage, setCurrentPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false)

  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [selectedBooking, setSelectedBooking] =
    React.useState<BookingRow | null>(null)
  const [editFormData, setEditFormData] = React.useState({
    date: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    room: "",
  })

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const {
    columnVisibility,
    sortColumn,
    sortDirection,
    orderedVisibleColumns,
    handleSort,
    handleDragEnd,
    toggleColumnVisibility,
    sortRows,
  } = useDataTable<BookingColumnKey>({
    columns: bookingColumns,
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
  }, [currentPage, searchQuery, statusFilter, clearSelection])

  const branchNameById = React.useMemo(() => {
    return new Map(
      ((branchesData?.data ?? []) as Branch[]).map((branch) => [
        String(branch.id),
        branch.name,
      ])
    )
  }, [branchesData])

  const roomNameById = React.useMemo(() => {
    return new Map(
      ((roomsData?.data ?? []) as ApiRoom[]).map((room) => [
        String(room.id),
        room.name,
      ])
    )
  }, [roomsData])

  const rooms = React.useMemo<RoomOption[]>(() => {
    return ((roomsData?.data ?? []) as ApiRoom[]).map((room) => ({
      id: String(room.id),
      name: room.name,
      capacity: Number(room.capacity ?? 0),
    }))
  }, [roomsData])

  const bookings = React.useMemo<BookingRow[]>(() => {
    return ((bookingsData?.data ?? []) as ApiBooking[]).map((apiBooking) => {
      const branchObject =
        apiBooking.branch && typeof apiBooking.branch === "object"
          ? apiBooking.branch
          : undefined
      const roomObject =
        apiBooking.room && typeof apiBooking.room === "object"
          ? apiBooking.room
          : undefined

      const roomId = String(roomObject?.id ?? apiBooking.room_id ?? "")
      const branchId = String(branchObject?.id ?? apiBooking.branch_id ?? "")

      return {
        id: String(apiBooking.id),
        room: roomId,
        roomName: roomObject?.name ?? roomNameById.get(roomId) ?? "",
        branch: branchId,
        branchName: branchObject?.name ?? branchNameById.get(branchId) ?? "",
        date: new Date(apiBooking.date),
        startTime: apiBooking.start_time,
        endTime: apiBooking.end_time,
        organizer: apiBooking.name ?? apiBooking.organizer ?? "",
        attendees: apiBooking.attendees ?? null,
        purpose: apiBooking.purpose ?? "",
        status: apiBooking.status ?? "pending",
        duration:
          apiBooking.duration === undefined || apiBooking.duration === null
            ? ""
            : String(apiBooking.duration),
        password: apiBooking.password ?? "",
        pin:
          apiBooking.pin === undefined || apiBooking.pin === null
            ? ""
            : String(apiBooking.pin),
        phone: apiBooking.phone ?? "",
        email: apiBooking.email ?? "",
        emailVerifiedAt: apiBooking.email_verified_at ?? "",
        photo: apiBooking.photo ?? "",
        coupon: apiBooking.coupon ?? "",
        existingCustomer: apiBooking.existing_customer ?? false,
        totalAmount:
          apiBooking.total_amount === undefined ||
          apiBooking.total_amount === null
            ? ""
            : String(apiBooking.total_amount),
        discountAmount:
          apiBooking.discount_amount === undefined ||
          apiBooking.discount_amount === null
            ? ""
            : String(apiBooking.discount_amount),
        paymentMethod: apiBooking.payment_method ?? "",
        paymentStatus: apiBooking.payment_status ?? "",
        transactionId: apiBooking.transaction_id ?? "",
        createdAt: apiBooking.created_at ?? "",
        updatedAt: apiBooking.updated_at ?? "",
      }
    })
  }, [bookingsData, branchNameById, roomNameById])

  const getBranchName = React.useCallback(
    (id: string) => branchNameById.get(String(id)) ?? id,
    [branchNameById]
  )

  const getRoomName = React.useCallback(
    (id: string) => roomNameById.get(String(id)) ?? id,
    [roomNameById]
  )

  const filteredBookings = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return bookings.filter((booking) => {
      const matchesSearch =
        query.length === 0 ||
        booking.roomName.toLowerCase().includes(query) ||
        booking.branchName.toLowerCase().includes(query) ||
        booking.organizer.toLowerCase().includes(query) ||
        booking.email.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [bookings, searchQuery, statusFilter])

  const sortedBookings = React.useMemo(
    () => sortRows(filteredBookings, getBookingSortVal),
    [filteredBookings, sortRows]
  )

  const nowMs = Date.now()
  const now = new Date(nowMs)
  const todayKey = format(now, "yyyy-MM-dd")
  const currentTimeKey = format(now, "HH:mm")

  const upcomingBookings = React.useMemo(
    () =>
      filteredBookings.filter(
        (booking) =>
          booking.status !== "cancelled" &&
          (booking.date.getTime() > nowMs ||
            (format(booking.date, "yyyy-MM-dd") === todayKey &&
              booking.startTime >= currentTimeKey))
      ),
    [currentTimeKey, filteredBookings, nowMs, todayKey]
  )

  const pastBookings = React.useMemo(
    () =>
      filteredBookings.filter(
        (booking) =>
          booking.date.getTime() < nowMs ||
          (format(booking.date, "yyyy-MM-dd") === todayKey &&
            booking.endTime < currentTimeKey)
      ),
    [currentTimeKey, filteredBookings, nowMs, todayKey]
  )

  const pendingBookings = React.useMemo(
    () => filteredBookings.filter((booking) => booking.status === "pending"),
    [filteredBookings]
  )

  const activeFilterCount = statusFilter !== "all" ? 1 : 0

  const clearFilters = React.useCallback(() => {
    setStatusFilter("all")
    setCurrentPage(1)
  }, [])

  const totalItems = sortedBookings.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedBookings = sortedBookings.slice(startIndex, endIndex)

  const allPageSelected =
    paginatedBookings.length > 0 &&
    paginatedBookings.every((booking) => selectedIds.has(booking.id))
  const somePageSelected = paginatedBookings.some((booking) =>
    selectedIds.has(booking.id)
  )

  const handleView = React.useCallback((booking: BookingRow) => {
    setSelectedBooking(booking)
    setIsViewDialogOpen(true)
  }, [])

  const handleEdit = React.useCallback((booking: BookingRow) => {
    setSelectedBooking(booking)
    setEditFormData({
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      room: booking.room,
    })
    setIsEditDialogOpen(true)
  }, [])

  const handleDelete = React.useCallback((booking: BookingRow) => {
    setSelectedBooking(booking)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleSelectRow = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const handleSelectAll = React.useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedBookings.forEach((booking) => {
          if (checked) next.add(booking.id)
          else next.delete(booking.id)
        })
        return next
      })
    },
    [paginatedBookings]
  )

  const handleBulkStatusChange = React.useCallback(
    async (status: BookingStatus) => {
      const ids = Array.from(selectedIds)
      const results = await Promise.allSettled(
        ids.map((id) =>
          updateBooking.mutateAsync({
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
          `Updated ${ids.length} booking${ids.length === 1 ? "" : "s"} to ${getStatusLabel(status)}.`
        )
      } else {
        toast.error(
          `Failed to update ${failed} booking${failed === 1 ? "" : "s"}.`
        )
      }

      clearSelection()
    },
    [clearSelection, selectedIds, updateBooking]
  )

  const handleBulkDelete = React.useCallback(async () => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) => deleteBooking.mutateAsync(Number(id)))
    )
    const failed = results.filter(
      (result) => result.status === "rejected"
    ).length

    if (failed === 0) {
      toast.success(
        `Deleted ${ids.length} booking${ids.length === 1 ? "" : "s"}.`
      )
    } else {
      toast.error(
        `Failed to delete ${failed} booking${failed === 1 ? "" : "s"}.`
      )
    }

    clearSelection()
    setIsBulkDeleteDialogOpen(false)
  }, [clearSelection, deleteBooking, selectedIds])

  const handleEditSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!selectedBooking) return

      try {
        await updateBooking.mutateAsync({
          id: Number(selectedBooking.id),
          payload: {
            date: editFormData.date?.toISOString().slice(0, 10),
            start_time: editFormData.startTime,
            end_time: editFormData.endTime,
            room_id: editFormData.room ? Number(editFormData.room) : undefined,
          },
        })
        toast.success("Booking updated.")
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update booking."
        toast.error(message)
      } finally {
        setIsEditDialogOpen(false)
        setSelectedBooking(null)
      }
    },
    [editFormData, selectedBooking, updateBooking]
  )

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!selectedBooking) return

    try {
      await deleteBooking.mutateAsync(Number(selectedBooking.id))
      toast.success("Booking deleted.")
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete booking."
      toast.error(message)
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedBooking(null)
    }
  }, [deleteBooking, selectedBooking])

  const renderCell = React.useCallback(
    (booking: BookingRow, col: BookingColumnKey) => {
      switch (col) {
        case "room":
          return (
            <DraggableTableCell key={col} columnKey={col}>
              <div className="font-medium">
                {booking.roomName || getRoomName(booking.room)}
              </div>
            </DraggableTableCell>
          )
        case "branch":
          return (
            <DraggableTableCell key={col} columnKey={col}>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {booking.branchName || getBranchName(booking.branch)}
              </div>
            </DraggableTableCell>
          )
        case "dateTime":
          return (
            <DraggableTableCell key={col} columnKey={col}>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  {format(booking.date, "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTime(booking.startTime)} -{" "}
                  {formatTime(booking.endTime)}
                </div>
              </div>
            </DraggableTableCell>
          )
        case "organizer":
          return (
            <DraggableTableCell key={col} columnKey={col}>
              <div className="space-y-1">
                <div className="font-medium">{booking.organizer}</div>
                <div className="text-sm text-muted-foreground">
                  {booking.attendees?.length ?? 0} attendee
                  {(booking.attendees?.length ?? 0) === 1 ? "" : "s"}
                </div>
              </div>
            </DraggableTableCell>
          )
        case "contact":
          return (
            <DraggableTableCell key={col} columnKey={col}>
              <div className="space-y-1">
                <div className="text-sm">{booking.email || "-"}</div>
                <div className="text-sm text-muted-foreground">
                  {booking.phone || "-"}
                </div>
              </div>
            </DraggableTableCell>
          )
        case "payment":
          return (
            <DraggableTableCell key={col} columnKey={col}>
              <div className="space-y-1">
                <div className="font-medium">{booking.totalAmount || "-"}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {booking.paymentStatus || "-"}
                  {booking.paymentMethod ? ` · ${booking.paymentMethod}` : ""}
                </div>
              </div>
            </DraggableTableCell>
          )
        case "created":
          return (
            <DraggableTableCell key={col} columnKey={col}>
              <div className="space-y-1">
                <div className="text-sm">
                  {booking.createdAt
                    ? format(new Date(booking.createdAt), "MMM d, yyyy")
                    : "-"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.createdAt
                    ? format(new Date(booking.createdAt), "h:mm a")
                    : "-"}
                </div>
              </div>
            </DraggableTableCell>
          )
        case "status":
          return (
            <DraggableTableCell key={col} columnKey={col}>
              <span className="text-sm font-medium">
                {getStatusLabel(booking.status)}
              </span>
            </DraggableTableCell>
          )
        case "actions":
          return (
            <DraggableTableCell
              key={col}
              columnKey={col}
              className="text-right"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open booking actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleView(booking)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                  {booking.status !== "cancelled" && (
                    <>
                      <DropdownMenuItem onClick={() => handleEdit(booking)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(booking)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </DraggableTableCell>
          )
      }
    },
    [getBranchName, getRoomName, handleDelete, handleEdit, handleView]
  )

  if (bookingsLoading) return <FullPageSpinner />

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage room reservations, check status, and update booking details.
          </p>
        </div>
        <Link href="/admin/bookings/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Link>
      </div>

      <Card className="min-w-0">
        <CardContent className="p-0">
          <div className="flex min-w-0 flex-col gap-4 border-b p-4">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by room, branch, organizer, or email..."
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
                            Clear all
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map((status) => (
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
                              {getStatusLabel(status)}
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
                        Customize Columns
                      </span>
                      <span className="lg:hidden">Columns</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {DEFAULT_COLUMN_ORDER.filter(
                      (key) => bookingColumns[key].hideable !== false
                    ).map((key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={columnVisibility[key]}
                        onCheckedChange={() => toggleColumnVisibility(key)}
                      >
                        {bookingColumns[key].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Active filters
                </span>
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {getStatusLabel(statusFilter)}
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
                  {selectedIds.size} selected
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
                    {STATUS_OPTIONS.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleBulkStatusChange(status)}
                      >
                        <span className="mr-2">{getStatusIcon(status)}</span>
                        {getStatusLabel(status)}
                      </DropdownMenuItem>
                    ))}
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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="w-full overflow-x-auto">
              <Table className="min-w-max">
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
                          aria-label="Select all bookings on page"
                        />
                      </TableHead>
                      {orderedVisibleColumns.map((col) => (
                        <DraggableColumnHeader
                          key={col}
                          columnKey={col}
                          label={bookingColumns[col].label}
                          sortable={bookingColumns[col].sortable}
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
                  {paginatedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={orderedVisibleColumns.length + 1}
                        className="py-8 text-center"
                      >
                        <p className="text-muted-foreground">
                          No bookings found.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBookings.map((booking) => (
                      <SortableContext
                        key={booking.id}
                        items={orderedVisibleColumns}
                        strategy={horizontalListSortingStrategy}
                      >
                        <TableRow
                          data-state={
                            selectedIds.has(booking.id) ? "selected" : undefined
                          }
                        >
                          <TableCell className="w-10 px-4">
                            <Checkbox
                              checked={selectedIds.has(booking.id)}
                              onCheckedChange={(value) =>
                                handleSelectRow(booking.id, value === true)
                              }
                              aria-label={`Select booking ${booking.id}`}
                            />
                          </TableCell>
                          {orderedVisibleColumns.map((col) =>
                            renderCell(booking, col)
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
            itemLabel="bookings"
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
              Delete {selectedIds.size} selected booking
              {selectedIds.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete bookings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Review booking schedule, guest, and payment information.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Overview
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Booking ID</p>
                    <p className="text-sm font-semibold">
                      {selectedBooking.id}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant={getStatusVariant(selectedBooking.status)}
                      className="mt-0.5 flex w-fit items-center gap-1 text-xs"
                    >
                      {getStatusIcon(selectedBooking.status)}
                      {getStatusLabel(selectedBooking.status)}
                    </Badge>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(
                        selectedBooking.branchName ||
                          getBranchName(selectedBooking.branch)
                      )}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(
                        selectedBooking.roomName ||
                          getRoomName(selectedBooking.room)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Schedule
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">
                      {format(selectedBooking.date, "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.duration)}
                      {selectedBooking.duration ? " hr" : ""}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Start Time</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.startTime)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">End Time</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Access
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">PIN</p>
                    <p className="font-mono text-sm font-medium">
                      {formatDetailValue(selectedBooking.pin)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Password</p>
                    <p className="font-mono text-sm font-medium">
                      {formatDetailValue(selectedBooking.password)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Guest Details
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.organizer)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.phone)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium break-all">
                      {formatDetailValue(selectedBooking.email)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Verified</p>
                    <p className="text-sm font-medium">
                      {selectedBooking.emailVerifiedAt ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Photo</p>
                    <p className="text-sm font-medium break-all">
                      {formatDetailValue(selectedBooking.photo)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Existing Customer
                    </p>
                    <p className="text-sm font-medium">
                      {selectedBooking.existingCustomer ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Attendees</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.attendees)}
                    </p>
                  </div>
                  {selectedBooking.purpose.trim() && (
                    <div className="col-span-2 rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Purpose</p>
                      <p className="text-sm font-medium">
                        {formatDetailValue(selectedBooking.purpose)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Payment
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Total Amount
                    </p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.discountAmount)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Coupon</p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.coupon)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Payment Method
                    </p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.paymentMethod)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Payment Status
                    </p>
                    <p className="text-sm font-medium capitalize">
                      {formatDetailValue(selectedBooking.paymentStatus)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Transaction ID
                    </p>
                    <p className="text-sm font-medium">
                      {formatDetailValue(selectedBooking.transactionId)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-xs font-medium text-foreground/80">
                    {formatDetailValue(selectedBooking.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated At</p>
                  <p className="text-xs font-medium text-foreground/80">
                    {formatDetailValue(selectedBooking.updatedAt)}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    setSelectedBooking(null)
                  }}
                >
                  Close
                </Button>
                {selectedBooking.status !== "cancelled" && (
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      handleEdit(selectedBooking)
                    }}
                  >
                    Edit Booking
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>
              Update room, date, and reservation time for this booking.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-room">Room</FieldLabel>
                <Select
                  value={editFormData.room}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({ ...prev, room: value ?? "" }))
                  }
                  required
                >
                  <SelectTrigger id="edit-room">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} ({room.capacity} capacity)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-date">Date</FieldLabel>
                <Popover>
                  <PopoverTrigger>
                    <Button
                      id="edit-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editFormData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editFormData.date
                        ? format(editFormData.date, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editFormData.date}
                      onSelect={(date) =>
                        setEditFormData((prev) => ({ ...prev, date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="edit-start-time">Start Time</FieldLabel>
                  <Input
                    type="time"
                    id="edit-start-time"
                    step="1"
                    value={editFormData.startTime}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-end-time">End Time</FieldLabel>
                  <Input
                    type="time"
                    id="edit-end-time"
                    step="1"
                    value={editFormData.endTime}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    required
                  />
                </Field>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedBooking(null)
                  }}
                  disabled={updateBooking.status === "pending"}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateBooking.status === "pending"}
                >
                  {updateBooking.status === "pending" && (
                    <Spinner className="mr-2" />
                  )}
                  Update Booking
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              This booking will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="font-semibold">
                  {getRoomName(selectedBooking.room)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(selectedBooking.date, "MMM d, yyyy")} at{" "}
                  {formatTime(selectedBooking.startTime)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Organized by {selectedBooking.organizer}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setSelectedBooking(null)
                  }}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
