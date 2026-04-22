"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { XIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import MultipleSelector, { type Option } from "@/components/ui/multiselect"
import type {
  Location,
  Door,
  RoomCategory,
  Amenity,
  RoomViewModel,
} from "@/lib/api/types"

export interface RoomFormPayload {
  name: string
  locationId?: number
  door_name?: string
  doors?: { id: string; name: string }[]
  capacity?: number
  room_category_id?: string
  category?: { id: number; name: string }
  status: string
  description?: string
  price?: number
  amenities?: { id: number; name: string }[]
}

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: RoomViewModel | null
  onSubmit: (payload: RoomFormPayload) => Promise<void>
  branches: Location[]
  doors: Door[]
  /** Shown when `/api/cvsecurity/doors` fails or env is not configured. */
  doorsError?: string | null
  amenities: Amenity[]
  categories: RoomCategory[]
  isSubmitting: boolean
}

function parsePriceInput(raw: string): number | undefined {
  const t = raw.trim()
  if (!t) return undefined
  const n = Number.parseFloat(t.replace(/,/g, ""))
  return Number.isFinite(n) ? n : undefined
}

export function RoomFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  branches,
  doors,
  doorsError,
  categories,
  amenities,
  isSubmitting,
}: RoomFormDialogProps) {
  const t = useTranslations("rooms")
  const [name, setName] = React.useState("")
  const [locationId, setLocationId] = React.useState<number | undefined>()
  const [selectedDoorIds, setSelectedDoorIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [selectedAmenityIds, setSelectedAmenityIds] = React.useState<
    Set<number>
  >(() => new Set())
  const [capacity, setCapacity] = React.useState<string>("")
  const [categoryId, setCategoryId] = React.useState<string>("")
  const [price, setPrice] = React.useState<string>("")
  const [description, setDescription] = React.useState<string>("")
  const [status, setStatus] = React.useState<"available" | "unavailable">(
    "available"
  )

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setLocationId(
        initialData.branch?.id ? Number(initialData.branch.id) : undefined
      )
      const doorList = initialData.doors?.length
        ? initialData.doors
        : initialData.door
          ? [initialData.door]
          : []
      setSelectedDoorIds(
        new Set(
          doorList
            .map((d) => String(d.id).trim())
            .filter((id) => id.length > 0)
        )
      )
      setSelectedAmenityIds(
        new Set(
          (initialData.equipment ?? []).map((a) => a.id).filter(Number.isFinite)
        )
      )
      setCapacity(initialData.capacity?.toString() ?? "")
      setCategoryId(initialData.room_category_id ?? "")
      setPrice(
        initialData.price != null && initialData.price > 0
          ? String(initialData.price)
          : ""
      )
      setDescription(initialData.description ?? "")
      setStatus(
        (initialData.status as "available" | "unavailable") ?? "available"
      )
    } else {
      setName("")
      setLocationId(undefined)
      setSelectedDoorIds(new Set())
      setSelectedAmenityIds(new Set())
      setCapacity("")
      setCategoryId("")
      setPrice("")
      setDescription("")
      setStatus("available")
    }
  }, [initialData, open])

  const doorOptions = React.useMemo<Option[]>(
    () => doors.map((d) => ({ value: String(d.id), label: d.name })),
    [doors]
  )

  const selectedDoorOptions = React.useMemo<Option[]>(
    () =>
      doors
        .filter((d) => selectedDoorIds.has(d.id))
        .map((d) => ({ value: String(d.id), label: d.name })),
    [doors, selectedDoorIds]
  )

  const handleDoorsChange = (opts: Option[]) => {
    setSelectedDoorIds(
      new Set(
        opts
          .map((o) => String(o.value).trim())
          .filter((id) => id.length > 0)
      )
    )
  }

  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const doorEntries = doors
      .filter((d) => selectedDoorIds.has(d.id))
      .map((d) => ({ id: d.id, name: d.name }))
    const amenityEntries = amenities
      .filter((a) => selectedAmenityIds.has(a.id))
      .map((a) => ({ id: a.id, name: a.name }))
    const primaryDoor = doorEntries[0]
    await onSubmit({
      name,
      locationId,
      door_name: primaryDoor?.name,
      doors: doorEntries.length ? doorEntries : undefined,
      capacity: capacity ? Number(capacity) : undefined,
      room_category_id: categoryId || undefined,
      category: categoryId
        ? categories.find((c) => String(c.id) === categoryId)
        : undefined,
      status,
      description: description.trim() || undefined,
      price: parsePriceInput(price),
      amenities: amenityEntries.length ? amenityEntries : undefined,
    })
  }

  const isEdit = Boolean(initialData)
  const scrollPickClass =
    "max-h-56 space-y-2 overflow-y-auto rounded-lg border border-input bg-muted/30 p-2 dark:bg-input/20"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(90vh,720px)] max-h-[90vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEdit ? t("editRoom") : t("addNewRoom")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("form.editDescription")
              : t("form.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="room-name" className="font-medium">
                {t("form.roomName")}
              </Label>
              <Input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("form.enterRoomName")}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="room-branch" className="font-medium">
                  {t("form.branch")}
                </Label>
                <Select
                  value={locationId?.toString() ?? ""}
                  onValueChange={(v) =>
                    setLocationId(v != null && v !== "" ? Number(v) : undefined)
                  }
                >
                  <SelectTrigger id="room-branch" className="w-full">
                    <SelectValue placeholder={t("form.selectBranch")} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-2">
                <Label className="font-medium">{t("form.doors")}</Label>
                {doorsError ? (
                  <p className="text-sm text-destructive">{doorsError}</p>
                ) : doors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("form.noDoorsAvailable")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <MultipleSelector
                      commandProps={{
                        label: t("form.selectDoors"),
                      }}
                      emptyIndicator={
                        <p className="text-center text-sm">{t("form.noDoorsMatch")}</p>
                      }
                      hideSelectedBadges
                      onChange={handleDoorsChange}
                      options={doorOptions}
                      placeholder={t("form.selectDoors")}
                      value={selectedDoorOptions}
                    />
                    {selectedDoorOptions.length > 0 ? (
                      <div
                        className="flex flex-wrap gap-1.5"
                        role="list"
                        aria-label="Selected doors"
                      >
                        {selectedDoorOptions.map((opt) => (
                          <div
                            key={opt.value}
                            className="animate-fadeIn relative inline-flex h-7 max-w-full items-center rounded-md border bg-background ps-2 pe-7 text-xs font-medium text-secondary-foreground"
                            role="listitem"
                          >
                            <span className="truncate pe-0.5">{opt.label}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${opt.label}`}
                              className="absolute -inset-y-px -end-px flex size-7 shrink-0 items-center justify-center rounded-e-md border border-transparent p-0 text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              onClick={() =>
                                handleDoorsChange(
                                  selectedDoorOptions.filter(
                                    (o) => o.value !== opt.value
                                  )
                                )
                              }
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <XIcon aria-hidden="true" className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="room-capacity" className="font-medium">
                  {t("form.capacity")}
                </Label>
                <Input
                  id="room-capacity"
                  type="number"
                  min={0}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder={t("form.enterCapacity")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-type" className="font-medium">
                  {t("form.roomType")}
                </Label>
                <Select
                  value={categoryId}
                  onValueChange={(v) => setCategoryId(v ?? "")}
                >
                  <SelectTrigger id="room-type" className="w-full">
                    <SelectValue placeholder={t("form.selectRoomType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 sm:max-w-[50%]">
              <Label htmlFor="room-price" className="font-medium">
                {t("form.price")}
              </Label>
              <Input
                id="room-price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-description" className="font-medium">
                {t("form.description")}
              </Label>
              <Textarea
                id="room-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("form.enterRoomDescription")}
                rows={4}
                className="min-h-20 resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium">{t("form.amenities")}</Label>
              <div
                className={scrollPickClass}
                role="group"
                aria-label="Equipment and amenities"
              >
                {amenities.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-muted-foreground">
                    {t("form.noAmenitiesConfigured")}
                  </p>
                ) : (
                  amenities.map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/80"
                    >
                      <Checkbox
                        checked={selectedAmenityIds.has(a.id)}
                        onCheckedChange={() => toggleAmenity(a.id)}
                      />
                      <span className="leading-snug">{a.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-4 rounded-lg border-input">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="room-status" className="font-medium">
                  {t("status")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {status === "available" ? t("available") : t("unavailable")}
                </p>
              </div>
              <Switch
                id="room-status"
                checked={status === "available"}
                onCheckedChange={(checked) =>
                  setStatus(checked ? "available" : "unavailable")
                }
              />
            </div>
          </div>

          <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border bg-muted/40 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("saving")
                : isEdit
                  ? t("saveChanges")
                  : t("addRoom")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
