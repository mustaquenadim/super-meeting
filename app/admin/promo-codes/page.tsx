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
  Ticket,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Columns3Cog,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Percent,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import FullPageSpinner from "@/components/ui/full-page-spinner"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "@/lib/hooks"
import type {
  Coupon as ApiCoupon,
  CouponStatus,
  DiscountType,
} from "@/lib/api/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { DataTablePagination } from "@/components/ui/data-table/pagination"
import {
  DraggableColumnHeader,
  DraggableTableCell,
} from "@/components/ui/data-table/column-header"
import { useDataTable, type ColumnDefinition } from "@/lib/hooks/use-data-table"

type Coupon = {
  id: number
  code: string
  description: string
  discount_type: DiscountType
  discount_value: number
  min_booking_amount: number
  max_discount_amount: number | null
  usage_limit: number | null
  used_count: number
  valid_from: string
  valid_until: string
  status: CouponStatus
  applicable_rooms: string
}

type CouponColumnKey =
  | "code"
  | "discount"
  | "usage"
  | "validPeriod"
  | "status"
  | "actions"

const DEFAULT_COLUMN_ORDER: CouponColumnKey[] = [
  "code",
  "discount",
  "usage",
  "validPeriod",
  "status",
  "actions",
]

function getCouponSortVal(coupon: Coupon, col: CouponColumnKey): string {
  switch (col) {
    case "code":
      return coupon.code.toLowerCase()
    case "discount":
      return String(coupon.discount_value)
    case "usage":
      return String(coupon.used_count)
    case "validPeriod":
      return String(new Date(coupon.valid_until).getTime())
    case "status":
      return coupon.status.toLowerCase()
    default:
      return ""
  }
}


export default function CouponsPage() {
  const t = useTranslations("promoCodes")
  const tCommon = useTranslations("rooms.common")

  const getApplicableRoomsLabel = (value: string) => {
    switch (value) {
      case "all":
        return t("allRooms")
      case "conference":
        return t("conferenceRooms")
      case "meeting":
        return t("meetingRooms")
      case "boardroom":
        return t("boardrooms")
      case "training":
        return t("trainingRooms")
      case "focus":
        return t("focusRooms")
      default:
        return value.charAt(0).toUpperCase() + value.slice(1)
    }
  }

  const { data: couponsData, isLoading: couponsLoading } = useCoupons(1, 200)
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const deleteCoupon = useDeleteCoupon()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] =
    React.useState(false)
  const [selectedCoupon, setSelectedCoupon] = React.useState<Coupon | null>(
    null
  )
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(
    () => new Set()
  )
  const [currentPage, setCurrentPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [formData, setFormData] = React.useState({
    code: "",
    description: "",
    discount_type: "percentage" as DiscountType,
    discount_value: "",
    min_booking_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    status: "active" as CouponStatus,
    applicable_rooms: "all",
  })

  const coupons: Coupon[] = (couponsData?.data ?? []).map((c: ApiCoupon) => ({
    id: c.id,
    code: c.code || "",
    description: c.description || "",
    discount_type: c.discount_type || "percentage",
    discount_value: c.discount_value || 0,
    min_booking_amount: c.min_booking_amount || 0,
    max_discount_amount: c.max_discount_amount ?? null,
    usage_limit: c.usage_limit ?? null,
    used_count: c.used_count || 0,
    valid_from: c.valid_from || new Date().toISOString(),
    valid_until: c.valid_until || new Date().toISOString(),
    status: c.status || "active",
    applicable_rooms: c.applicable_rooms || "all",
  }))

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_booking_amount: "",
      max_discount_amount: "",
      usage_limit: "",
      valid_from: "",
      valid_until: "",
      status: "active",
      applicable_rooms: "all",
    })
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCoupon.mutateAsync({
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_booking_amount: Number(formData.min_booking_amount) || 0,
        max_discount_amount: formData.max_discount_amount
          ? Number(formData.max_discount_amount)
          : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        valid_from: formData.valid_from + " 00:00:00",
        valid_until: formData.valid_until + " 23:59:59",
        applicable_rooms: formData.applicable_rooms,
        status: formData.status,
      })
      toast.success(t("couponCreated"))
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("failedCreate"))
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCoupon) return
    try {
      await updateCoupon.mutateAsync({
        id: selectedCoupon.id,
        payload: {
          code: formData.code.toUpperCase(),
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: Number(formData.discount_value),
          min_booking_amount: Number(formData.min_booking_amount) || 0,
          max_discount_amount: formData.max_discount_amount
            ? Number(formData.max_discount_amount)
            : null,
          usage_limit: formData.usage_limit
            ? Number(formData.usage_limit)
            : null,
          valid_from: formData.valid_from.includes(" ")
            ? formData.valid_from
            : formData.valid_from + " 00:00:00",
          valid_until: formData.valid_until.includes(" ")
            ? formData.valid_until
            : formData.valid_until + " 23:59:59",
          applicable_rooms: formData.applicable_rooms,
          status: formData.status,
        },
      })
      toast.success(t("couponUpdated"))
      setIsEditDialogOpen(false)
      setSelectedCoupon(null)
      resetForm()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("failedUpdate"))
    }
  }

  const handleDelete = async () => {
    if (!selectedCoupon) return
    try {
      await deleteCoupon.mutateAsync(selectedCoupon.id)
      toast.success(t("couponDeleted"))
      setIsDeleteDialogOpen(false)
      setSelectedCoupon(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("failedDelete"))
    }
  }

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_booking_amount: String(coupon.min_booking_amount),
      max_discount_amount: coupon.max_discount_amount
        ? String(coupon.max_discount_amount)
        : "",
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : "",
      valid_from: coupon.valid_from.split(" ")[0] || coupon.valid_from,
      valid_until: coupon.valid_until.split(" ")[0] || coupon.valid_until,
      status: coupon.status === "expired" ? "inactive" : coupon.status,
      applicable_rooms: coupon.applicable_rooms,
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setIsViewDialogOpen(true)
  }

  const openDeleteDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setIsDeleteDialogOpen(true)
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const newStatus = coupon.status === "active" ? "inactive" : "active"
      await updateCoupon.mutateAsync({
        id: coupon.id,
        payload: { status: newStatus },
      })
      toast.success(
        newStatus === "active" ? t("couponActivated") : t("couponDeactivated")
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("failedStatusUpdate"))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            {tCommon("active")}
          </Badge>
        )
      case "inactive":
        return <Badge variant="secondary">{tCommon("inactive")}</Badge>
      case "expired":
        return <Badge variant="destructive">{t("expired")}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const couponColumns = React.useMemo<
    Record<CouponColumnKey, ColumnDefinition>
  >(
    () => ({
      code: { label: t("code"), sortable: true, defaultVisible: true },
      discount: { label: t("discount"), sortable: true, defaultVisible: true },
      usage: { label: t("usage"), sortable: true, defaultVisible: true },
      validPeriod: {
        label: t("validPeriod"),
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

  const {
    columnVisibility,
    sortColumn,
    sortDirection,
    orderedVisibleColumns,
    handleSort,
    handleDragEnd,
    toggleColumnVisibility,
    sortRows,
  } = useDataTable<CouponColumnKey>({
    columns: couponColumns,
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
    setSelectedIds(new Set())
  }, [currentPage, searchQuery, statusFilter])

  const filteredCoupons = coupons.filter((coupon) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      coupon.code.toLowerCase().includes(q) ||
      coupon.description.toLowerCase().includes(q)
    const matchesStatus =
      statusFilter === "all" || coupon.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedCoupons = sortRows(filteredCoupons, getCouponSortVal)

  const activeFilterCount = statusFilter !== "all" ? 1 : 0

  const clearFilters = () => {
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const totalItems = sortedCoupons.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedCoupons = sortedCoupons.slice(startIndex, endIndex)

  const allPageSelected =
    paginatedCoupons.length > 0 &&
    paginatedCoupons.every((coupon) => selectedIds.has(coupon.id))
  const somePageSelected = paginatedCoupons.some((coupon) =>
    selectedIds.has(coupon.id)
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
      paginatedCoupons.forEach((coupon) => {
        if (checked) next.add(coupon.id)
        else next.delete(coupon.id)
      })
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkStatusChange = async (status: "active" | "inactive") => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) =>
        updateCoupon.mutateAsync({
          id,
          payload: { status },
        })
      )
    )

    const failed = results.filter((r) => r.status === "rejected").length
    if (failed === 0) {
      toast.success(t("couponUpdated"))
    } else {
      toast.error(t("failedStatusUpdate"))
    }
    clearSelection()
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) => deleteCoupon.mutateAsync(id))
    )
    const failed = results.filter((r) => r.status === "rejected").length
    if (failed === 0) {
      toast.success(t("couponDeleted"))
    } else {
      toast.error(t("failedDelete"))
    }
    setIsBulkDeleteDialogOpen(false)
    clearSelection()
  }

  const renderCell = (coupon: Coupon, col: CouponColumnKey) => {
    switch (col) {
      case "code":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
                {coupon.code}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(coupon.code)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {coupon.description}
            </p>
          </DraggableTableCell>
        )
      case "discount":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <div className="flex items-center gap-1">
              {coupon.discount_type === "percentage" ? (
                <>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{coupon.discount_value}%</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">${coupon.discount_value}</span>
                </>
              )}
            </div>
            {coupon.min_booking_amount > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("minimumAmount", {
                  amount: coupon.min_booking_amount,
                })}
              </p>
            )}
          </DraggableTableCell>
        )
      case "usage":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <div className="flex items-center gap-1">
              <span className="font-medium">{coupon.used_count}</span>
              <span className="text-muted-foreground">
                / {coupon.usage_limit ?? "∞"}
              </span>
            </div>
            {coupon.usage_limit && (
              <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      (coupon.used_count / coupon.usage_limit) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            )}
          </DraggableTableCell>
        )
      case "validPeriod":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>
                {new Date(coupon.valid_from).toLocaleDateString()} -{" "}
                {new Date(coupon.valid_until).toLocaleDateString()}
              </span>
            </div>
          </DraggableTableCell>
        )
      case "status":
        return (
          <DraggableTableCell key={col} columnKey={col}>
            {getStatusBadge(coupon.status)}
          </DraggableTableCell>
        )
      case "actions":
        return (
          <DraggableTableCell key={col} columnKey={col} className="text-end">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openViewDialog(coupon)}>
                  <Eye className="me-2 h-4 w-4" />
                  {t("viewDetails")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                  <Pencil className="me-2 h-4 w-4" />
                  {tCommon("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(coupon.code)}>
                  <Copy className="me-2 h-4 w-4" />
                  {t("copyCode")}
                </DropdownMenuItem>
                {coupon.status !== "expired" && (
                  <DropdownMenuItem onClick={() => toggleCouponStatus(coupon)}>
                    {coupon.status === "active" ? (
                      <>
                        <XCircle className="me-2 h-4 w-4" />
                        {t("deactivate")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="me-2 h-4 w-4" />
                        {t("activate")}
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => openDeleteDialog(coupon)}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {tCommon("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DraggableTableCell>
        )
      default:
        return null
    }
  }

  const activeCoupons = coupons.filter((c) => c.status === "active").length
  const totalUsage = coupons.reduce((acc, c) => acc + c.used_count, 0)
  const expiredCoupons = coupons.filter((c) => c.status === "expired").length

  if (couponsLoading) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t("createCoupon")}
        </Button>
      </div>

      <Card className="min-w-0">
        <CardContent className="overflow-x-hidden p-0">
          <div className="space-y-3 border-b p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute inset-s-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchCoupons")}
                  className="ps-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      {t("filterByStatus")}
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5">
                          {activeFilterCount}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="space-y-2 p-2">
                      <Label className="text-xs text-muted-foreground">
                        {tCommon("status")}
                      </Label>
                      <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v ?? "all")}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder={t("allStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("allStatus")}</SelectItem>
                          <SelectItem value="active">
                            {tCommon("active")}
                          </SelectItem>
                          <SelectItem value="inactive">
                            {tCommon("inactive")}
                          </SelectItem>
                          <SelectItem value="expired">
                            {t("expired")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={activeFilterCount === 0}
                      onClick={clearFilters}
                    >
                      {tCommon("cancel")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="outline" className="gap-2">
                      <Columns3Cog className="h-4 w-4" />
                      {tCommon("actions")}
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
                        {couponColumns[col].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {t("filterByStatus")}
                </span>
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {tCommon("status")}:{" "}
                    {statusFilter === "active"
                      ? tCommon("active")
                      : statusFilter === "inactive"
                        ? tCommon("inactive")
                        : t("expired")}
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
                <span className="text-sm font-medium">
                  {t("toolbar.selectedCount", { count: selectedIds.size })}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusChange("active")}
                >
                  {t("activate")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusChange("inactive")}
                >
                  {t("deactivate")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {tCommon("delete")}
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  {tCommon("cancel")}
                </Button>
              </div>
            )}
          </div>

          <div className="w-full max-w-full min-w-0">
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
                        onCheckedChange={(v) => handleSelectAll(v === true)}
                        aria-label={t("table.aria.selectAllRows")}
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
                          label={couponColumns[col].label}
                          sortable={couponColumns[col].sortable}
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
                  {paginatedCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={orderedVisibleColumns.length + 1}
                        className="py-8 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Ticket className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {t("noCouponsFound")}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCoupons.map((coupon) => (
                      <SortableContext
                        key={coupon.id}
                        items={orderedVisibleColumns}
                        strategy={horizontalListSortingStrategy}
                      >
                        <TableRow
                          data-state={
                            selectedIds.has(coupon.id) ? "selected" : undefined
                          }
                        >
                          <TableCell className="w-10 px-4">
                            <Checkbox
                              checked={selectedIds.has(coupon.id)}
                              onCheckedChange={(v) =>
                                handleSelectRow(coupon.id, v === true)
                              }
                              aria-label={t("table.aria.selectRow")}
                            />
                          </TableCell>
                          {orderedVisibleColumns.map((col) =>
                            renderCell(coupon, col)
                          )}
                        </TableRow>
                      </SortableContext>
                    ))
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            itemLabel={t("table.itemLabel")}
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
            <AlertDialogTitle>{t("deleteCoupon")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteCouponDescription")}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("createNewCoupon")}</DialogTitle>
            <DialogDescription>
              {t("createNewCouponDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("couponCode")}</FieldLabel>
                    <Input
                      placeholder={t("couponCodePlaceholder")}
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{tCommon("status")}</FieldLabel>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status: (value ?? "active") as "active" | "inactive",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          {tCommon("active")}
                        </SelectItem>
                        <SelectItem value="inactive">
                          {tCommon("inactive")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>

              <Field>
                <FieldLabel>{t("discountDescription")}</FieldLabel>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Field>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("discountType")}</FieldLabel>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          discount_type: (value ?? "percentage") as
                            | "percentage"
                            | "fixed",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          {t("percentageLabel")}
                        </SelectItem>
                        <SelectItem value="fixed">
                          {t("fixedAmountLabel")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>
                      {t("discountValue")}{" "}
                      {formData.discount_type === "percentage" ? "(%)" : "($)"}
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder={
                        formData.discount_type === "percentage" ? "25" : "50"
                      }
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_value: e.target.value,
                        })
                      }
                      required
                      min="0"
                      max={
                        formData.discount_type === "percentage"
                          ? "100"
                          : undefined
                      }
                    />
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("minimumBookingAmount")}</FieldLabel>
                    <Input
                      type="number"
                      placeholder={t("zero")}
                      value={formData.min_booking_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_booking_amount: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("maximumDiscount")}</FieldLabel>
                    <Input
                      type="number"
                      placeholder={t("noLimitPlaceholder")}
                      value={formData.max_discount_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount_amount: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("validFrom")}</FieldLabel>
                    <Input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) =>
                        setFormData({ ...formData, valid_from: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("validUntil")}</FieldLabel>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valid_until: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("usageLimit")}</FieldLabel>
                    <Input
                      type="number"
                      placeholder={t("unlimitedPlaceholder")}
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usage_limit: e.target.value,
                        })
                      }
                      min="1"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("applicableRooms")}</FieldLabel>
                    <Select
                      value={formData.applicable_rooms}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          applicable_rooms: value ?? "all",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allRooms")}</SelectItem>
                        <SelectItem value="conference">
                          {t("conferenceRooms")}
                        </SelectItem>
                        <SelectItem value="meeting">
                          {t("meetingRooms")}
                        </SelectItem>
                        <SelectItem value="boardroom">
                          {t("boardrooms")}
                        </SelectItem>
                        <SelectItem value="training">
                          {t("trainingRooms")}
                        </SelectItem>
                        <SelectItem value="focus">{t("focusRooms")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetForm()
                }}
                disabled={createCoupon.status === "pending"}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createCoupon.status === "pending"}
              >
                {createCoupon.status === "pending" && (
                  <Spinner className="me-2" />
                )}
                {t("createCoupon")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("editCoupon")}</DialogTitle>
            <DialogDescription>{t("editCouponDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("couponCode")}</FieldLabel>
                    <Input
                      placeholder={t("couponCodePlaceholder")}
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{tCommon("status")}</FieldLabel>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status: (value ?? "active") as "active" | "inactive",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          {tCommon("active")}
                        </SelectItem>
                        <SelectItem value="inactive">
                          {tCommon("inactive")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>

              <Field>
                <FieldLabel>{t("discountDescription")}</FieldLabel>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Field>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("discountType")}</FieldLabel>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          discount_type: (value ?? "percentage") as
                            | "percentage"
                            | "fixed",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          {t("percentageLabel")}
                        </SelectItem>
                        <SelectItem value="fixed">
                          {t("fixedAmountLabel")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>
                      {t("discountValue")}{" "}
                      {formData.discount_type === "percentage" ? "(%)" : "($)"}
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder={
                        formData.discount_type === "percentage" ? "25" : "50"
                      }
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_value: e.target.value,
                        })
                      }
                      required
                      min="0"
                      max={
                        formData.discount_type === "percentage"
                          ? "100"
                          : undefined
                      }
                    />
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("minimumBookingAmount")}</FieldLabel>
                    <Input
                      type="number"
                      placeholder={t("zero")}
                      value={formData.min_booking_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_booking_amount: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("maximumDiscount")}</FieldLabel>
                    <Input
                      type="number"
                      placeholder={t("noLimitPlaceholder")}
                      value={formData.max_discount_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount_amount: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("validFrom")}</FieldLabel>
                    <Input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) =>
                        setFormData({ ...formData, valid_from: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("validUntil")}</FieldLabel>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valid_until: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{t("usageLimit")}</FieldLabel>
                    <Input
                      type="number"
                      placeholder={t("unlimitedPlaceholder")}
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usage_limit: e.target.value,
                        })
                      }
                      min="1"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("applicableRooms")}</FieldLabel>
                    <Select
                      value={formData.applicable_rooms}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          applicable_rooms: value ?? "all",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allRooms")}</SelectItem>
                        <SelectItem value="conference">
                          {t("conferenceRooms")}
                        </SelectItem>
                        <SelectItem value="meeting">
                          {t("meetingRooms")}
                        </SelectItem>
                        <SelectItem value="boardroom">
                          {t("boardrooms")}
                        </SelectItem>
                        <SelectItem value="training">
                          {t("trainingRooms")}
                        </SelectItem>
                        <SelectItem value="focus">{t("focusRooms")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedCoupon(null)
                  resetForm()
                }}
                disabled={updateCoupon.status === "pending"}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={updateCoupon.status === "pending"}
              >
                {updateCoupon.status === "pending" && (
                  <Spinner className="me-2" />
                )}
                {t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("couponDetails")}</DialogTitle>
            <DialogDescription>
              {t("couponDetailsDescription")}
            </DialogDescription>
          </DialogHeader>
          {selectedCoupon && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <code className="rounded bg-muted px-3 py-2 font-mono text-lg font-bold">
                  {selectedCoupon.code}
                </code>
                {getStatusBadge(selectedCoupon.status)}
              </div>

              <p className="text-muted-foreground">
                {selectedCoupon.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("discount")}
                  </p>
                  <p className="font-medium">
                    {selectedCoupon.discount_type === "percentage"
                      ? `${selectedCoupon.discount_value}%`
                      : `$${selectedCoupon.discount_value}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("minimumBooking")}
                  </p>
                  <p className="font-medium">
                    ${selectedCoupon.min_booking_amount}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("maximumDiscountShort")}
                  </p>
                  <p className="font-medium">
                    {selectedCoupon.max_discount_amount
                      ? `$${selectedCoupon.max_discount_amount}`
                      : t("noLimit")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("usage")}</p>
                  <p className="font-medium">
                    {selectedCoupon.used_count} /{" "}
                    {selectedCoupon.usage_limit ?? "∞"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("validFrom")}
                  </p>
                  <p className="font-medium">
                    {new Date(selectedCoupon.valid_from).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("validUntil")}
                  </p>
                  <p className="font-medium">
                    {new Date(selectedCoupon.valid_until).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("applicableRooms")}
                  </p>
                  <p className="font-medium">
                    {getApplicableRoomsLabel(selectedCoupon.applicable_rooms)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              {t("close")}
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false)
                if (selectedCoupon) openEditDialog(selectedCoupon)
              }}
            >
              <Pencil className="me-2 h-4 w-4" />
              {tCommon("edit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteCoupon")}</DialogTitle>
            <DialogDescription>
              {t("deleteCouponDescription")}
            </DialogDescription>
          </DialogHeader>
          {selectedCoupon && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {t("aboutToDeleteCoupon")}
              </p>
              <code className="mt-2 inline-block rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
                {selectedCoupon.code}
              </code>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteCoupon.status === "pending"}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCoupon.status === "pending"}
            >
              {deleteCoupon.status === "pending" && (
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
