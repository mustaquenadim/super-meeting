"use client"

import * as React from "react"
import type {
  Location,
  Room,
  Door,
  RoomCategory,
  Amenity,
  Coupon,
  Booking,
} from "@/lib/api/types"
import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  cvSecurityMonitorEventKey,
  type CvSecurityMonitorEvent,
} from "@/lib/cvsecurity/fetch-transaction-monitor"

const REFETCH_EVENT = "locations-refetch"
function emitLocationsRefetch() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(REFETCH_EVENT))
}

export type LocationRow = Omit<Location, "roomsCount"> & {
  rooms_count?: number
}

const normalizeLocation = (row: LocationRow): Location => {
  return {
    ...row,
    roomsCount: row.rooms_count ?? 0,
  }
}

export function useLocations(page: number, limit: number) {
  return useQuery({
    queryKey: ["locations", page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit
      const to = page * limit - 1

      const {
        data: locations,
        count,
        error,
      } = await supabase
        .from("locations")
        .select(
          `id, name, address, phone, email, latitude, longitude, status, rooms_count, capacity`,
          { count: "exact" }
        )
        .order("name")
        .range(from, to)

      if (error) throw error

      const normalized = (locations ?? []).map(normalizeLocation)
      return { data: normalized, total: count ?? normalized.length }
    },
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Location>) => {
      const { roomsCount, ...rest } = payload
      const insertPayload: Partial<LocationRow> = {
        ...rest,
        status: payload.status ?? "active",
        rooms_count: roomsCount,
      }

      const { data, error } = await supabase
        .from("locations")
        .insert(insertPayload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
      emitLocationsRefetch() // Keep for legacy if needed
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: Partial<Location>
    }) => {
      const { roomsCount, status, ...rest } = payload
      const updatePayload: Partial<LocationRow> = {
        ...rest,
        ...(status !== undefined ? { status } : {}),
        rooms_count: roomsCount,
      }

      const { data, error } = await supabase
        .from("locations")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
      emitLocationsRefetch()
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("locations").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
      emitLocationsRefetch()
    },
  })
}

export * from "./use-users"

// ─── Rooms ───────────────────────────────────────────────────────────────────

const ROOMS_REFETCH_EVENT = "rooms-refetch"
function emitRoomsRefetch() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(ROOMS_REFETCH_EVENT))
}

const CATEGORIES_REFETCH_EVENT = "room-categories-refetch"
function emitCategoriesRefetch() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(CATEGORIES_REFETCH_EVENT))
}

const AMENITIES_REFETCH_EVENT = "amenities-refetch"
function emitAmenitiesRefetch() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(AMENITIES_REFETCH_EVENT))
}

export function useRooms(page: number, limit: number) {
  const [data, setData] = React.useState<{
    data: Room[]
    total: number
  }>({ data: [], total: 0 })
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchRooms = React.useCallback(async () => {
    setIsLoading(true)
    const from = (page - 1) * limit
    const to = page * limit - 1

    const {
      data: rooms,
      count,
      error,
    } = await supabase
      .from("rooms")
      .select(
        `
        id, name, location_id, capacity, status, description, price,
        location:locations(id, name),
        category:room_categories(id, name),
        room_amenities(amenity:amenities(id, name)),
        room_doors(door_id, door_name)
      `,
        { count: "exact" }
      )
      .order("name")
      .range(from, to)

    if (error) {
      console.error("Failed to fetch rooms:", error)
      setData({ data: [], total: 0 })
    } else {
      type RawRoom = {
        id: number
        name: string
        location_id: number
        capacity?: number
        status: Room["status"]
        description?: string
        price?: number
        location: { id: number; name: string } | null
        category: { id: number; name: string } | null
        room_amenities: { amenity: { id: number; name: string } }[]
        room_doors: { door_id: string; door_name: string }[]
      }
      const normalized: Room[] = ((rooms as unknown as RawRoom[]) ?? []).map(
        (r) => ({
          id: r.id,
          name: r.name,
          locationId: r.location_id,
          location: r.location ?? undefined,
          branch: r.location ?? undefined,
          capacity: r.capacity,
          category: r.category ?? undefined,
          status: r.status,
          description: r.description,
          price: r.price,
          amenities: (r.room_amenities ?? []).map((ra) => ra.amenity),
          doors: (r.room_doors ?? []).map((rd) => ({
            id: rd.door_id,
            name: rd.door_name,
          })),
        })
      )
      setData({ data: normalized, total: count ?? normalized.length })
    }
    setIsLoading(false)
  }, [page, limit])

  React.useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  React.useEffect(() => {
    const handler = () => fetchRooms()
    window.addEventListener(ROOMS_REFETCH_EVENT, handler)
    return () => window.removeEventListener(ROOMS_REFETCH_EVENT, handler)
  }, [fetchRooms])

  return { data, isLoading }
}

export function useCreateRoom() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (payload: Partial<Room>) => {
    setStatus("pending")

    // 1. Insert room
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        name: payload.name,
        location_id: payload.locationId,
        category_id: payload.category?.id,
        capacity: payload.capacity,
        status: payload.status ?? "available",
        description: payload.description,
        price: payload.price,
      })
      .select()
      .single()

    if (error) {
      setStatus("idle")
      throw error
    }

    // 2. Insert amenities
    if (payload.amenities && payload.amenities.length > 0) {
      const amenityLinks = payload.amenities.map((a) => ({
        room_id: room.id,
        amenity_id: a.id,
      }))
      await supabase.from("room_amenities").insert(amenityLinks)
    }

    // 3. Insert doors
    if (payload.doors && payload.doors.length > 0) {
      const doorLinks = payload.doors.map((d) => ({
        room_id: room.id,
        door_id: d.id,
        door_name: d.name,
      }))
      await supabase.from("room_doors").insert(doorLinks)
    }

    setStatus("success")
    emitRoomsRefetch()
    return room
  }, [])

  return { mutateAsync, status }
}

export function useUpdateRoom() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(
    async ({ id, payload }: { id: number; payload: Partial<Room> }) => {
      setStatus("pending")

      const { data: room, error } = await supabase
        .from("rooms")
        .update({
          name: payload.name,
          location_id: payload.locationId,
          category_id: payload.category?.id,
          capacity: payload.capacity,
          status: payload.status,
          description: payload.description,
          price: payload.price,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        setStatus("idle")
        throw error
      }

      // Update amenities (simple sync: delete then re-insert)
      if (payload.amenities !== undefined) {
        await supabase.from("room_amenities").delete().eq("room_id", id)
        if (payload.amenities.length > 0) {
          const amenityLinks = payload.amenities.map((a) => ({
            room_id: id,
            amenity_id: a.id,
          }))
          await supabase.from("room_amenities").insert(amenityLinks)
        }
      }

      // Update doors
      if (payload.doors !== undefined) {
        await supabase.from("room_doors").delete().eq("room_id", id)
        if (payload.doors.length > 0) {
          const doorLinks = payload.doors.map((d) => ({
            room_id: id,
            door_id: d.id,
            door_name: d.name,
          }))
          await supabase.from("room_doors").insert(doorLinks)
        }
      }

      setStatus("success")
      emitRoomsRefetch()
      return room
    },
    []
  )

  return { mutateAsync, status }
}

export function useDeleteRoom() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (id: number) => {
    setStatus("pending")
    const { error } = await supabase.from("rooms").delete().eq("id", id)

    if (error) {
      setStatus("idle")
      throw error
    }

    setStatus("success")
    emitRoomsRefetch()
  }, [])

  return { mutateAsync, status }
}

export function useDoors(_page: number, _limit: number) {
  const [data, setData] = React.useState<{
    data: Door[]
    total: number
  }>({ data: [], total: 0 })
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/cvsecurity/doors", { cache: "no-store" })
        const json = (await res.json()) as {
          data?: Door[]
          total?: number
          error?: string | null
        }
        if (!res.ok) {
          throw new Error(
            typeof json.error === "string" && json.error
              ? json.error
              : `HTTP ${res.status}`
          )
        }
        if (!cancelled) {
          setData({
            data: Array.isArray(json.data) ? json.data : [],
            total:
              typeof json.total === "number"
                ? json.total
                : (json.data?.length ?? 0),
          })
          if (json.error) setError(json.error)
        }
      } catch (e) {
        if (!cancelled) {
          setData({ data: [], total: 0 })
          setError(e instanceof Error ? e.message : "Failed to load doors")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [_page, _limit])

  return { data, isLoading, error }
}

export function useCvSecurityAuditMonitor(options?: {
  pollMs?: number
  maxRows?: number
}) {
  const pollMs = options?.pollMs ?? 10_000
  const maxRows = options?.maxRows ?? 500

  const sessionTimestampRef = React.useRef<number | null>(null)
  const seenKeysRef = React.useRef<Set<string>>(new Set())

  const [events, setEvents] = React.useState<CvSecurityMonitorEvent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isPaused, setPaused] = React.useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null)
  const [pollCount, setPollCount] = React.useState(0)

  const poll = React.useCallback(async () => {
    if (sessionTimestampRef.current === null) {
      sessionTimestampRef.current = Date.now()
    }
    const ts = sessionTimestampRef.current

    try {
      const res = await fetch(`/api/cvsecurity/audit-events?timestamp=${ts}`, {
        cache: "no-store",
      })
      const json = (await res.json()) as {
        data?: CvSecurityMonitorEvent[]
        error?: string | null
      }
      if (!res.ok) {
        throw new Error(
          typeof json.error === "string" && json.error
            ? json.error
            : `HTTP ${res.status}`
        )
      }
      if (json.error) {
        setError(json.error)
      } else {
        setError(null)
      }

      const batch = Array.isArray(json.data) ? json.data : []
      const newItems: CvSecurityMonitorEvent[] = []
      for (const e of batch) {
        const k = cvSecurityMonitorEventKey(e)
        if (seenKeysRef.current.has(k)) continue
        seenKeysRef.current.add(k)
        newItems.push(e)
      }

      if (newItems.length > 0) {
        setEvents((prev) => [...newItems, ...prev].slice(0, maxRows))
      }
      setLastUpdatedAt(new Date())
      setPollCount((c) => c + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit events")
    } finally {
      setIsLoading(false)
    }
  }, [maxRows])

  React.useEffect(() => {
    if (isPaused) return
    void poll()
    const id = window.setInterval(() => {
      void poll()
    }, pollMs)
    return () => window.clearInterval(id)
  }, [isPaused, poll, pollMs])

  return {
    events,
    isLoading,
    error,
    isPaused,
    setPaused,
    lastUpdatedAt,
    pollCount,
    refresh: poll,
  }
}

export function useRoomCategories(page: number, limit: number) {
  const [data, setData] = React.useState<{
    data: RoomCategory[]
    total: number
  }>({ data: [], total: 0 })
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchCategories = React.useCallback(async () => {
    setIsLoading(true)
    const from = (page - 1) * limit
    const to = page * limit - 1

    const {
      data: categories,
      count,
      error,
    } = await supabase
      .from("room_categories")
      .select(
        `
        id, name, description, status,
        rooms (id)
      `,
        { count: "exact" }
      )
      .order("name")
      .range(from, to)

    if (error) {
      console.error("Failed to fetch categories:", error)
      setData({ data: [], total: 0 })
    } else {
      type RawCategory = {
        id: number
        name: string
        description?: string
        status?: string
        rooms: { id: number }[]
      }
      const normalized: RoomCategory[] = (
        (categories as unknown as RawCategory[]) ?? []
      ).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        roomCount: c.rooms?.length ?? 0,
      }))
      setData({ data: normalized, total: count ?? normalized.length })
    }
    setIsLoading(false)
  }, [page, limit])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  React.useEffect(() => {
    const handler = () => fetchCategories()
    window.addEventListener(CATEGORIES_REFETCH_EVENT, handler)
    return () => window.removeEventListener(CATEGORIES_REFETCH_EVENT, handler)
  }, [fetchCategories])

  return { data, isLoading }
}

export function useCreateRoomCategory() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(
    async (payload: Partial<RoomCategory>) => {
      setStatus("pending")
      const { data, error } = await supabase
        .from("room_categories")
        .insert({
          name: payload.name,
          description: payload.description,
          status: payload.status ?? "active",
        })
        .select()
        .single()

      if (error) {
        setStatus("idle")
        throw error
      }

      setStatus("success")
      emitCategoriesRefetch()
      return data
    },
    []
  )

  return { mutateAsync, status }
}

export function useDeleteRoomCategory() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (id: string | number) => {
    setStatus("pending")
    const { error } = await supabase
      .from("room_categories")
      .delete()
      .eq("id", id)

    if (error) {
      setStatus("idle")
      throw error
    }

    setStatus("success")
    emitCategoriesRefetch()
  }, [])

  return { mutateAsync, status }
}

export function useAmenities(page: number, limit: number) {
  const [data, setData] = React.useState<{
    data: Amenity[]
    total: number
  }>({ data: [], total: 0 })
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchAmenities = React.useCallback(async () => {
    setIsLoading(true)
    const from = (page - 1) * limit
    const to = page * limit - 1

    const {
      data: amenities,
      count,
      error,
    } = await supabase
      .from("amenities")
      .select(`id, name, description, type, status`, { count: "exact" })
      .order("name")
      .range(from, to)

    if (error) {
      console.error("Failed to fetch amenities:", error)
      setData({ data: [], total: 0 })
    } else {
      setData({ data: amenities ?? [], total: count ?? amenities?.length ?? 0 })
    }
    setIsLoading(false)
  }, [page, limit])

  React.useEffect(() => {
    fetchAmenities()
  }, [fetchAmenities])

  React.useEffect(() => {
    const handler = () => fetchAmenities()
    window.addEventListener(AMENITIES_REFETCH_EVENT, handler)
    return () => window.removeEventListener(AMENITIES_REFETCH_EVENT, handler)
  }, [fetchAmenities])

  return { data, isLoading }
}

export function useCreateAmenity() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (payload: Partial<Amenity>) => {
    setStatus("pending")
    const { data, error } = await supabase
      .from("amenities")
      .insert({
        name: payload.name,
        description: payload.description,
        type: payload.type ?? "other",
        status: payload.status ?? "active",
      })
      .select()
      .single()

    if (error) {
      setStatus("idle")
      throw error
    }

    setStatus("success")
    emitAmenitiesRefetch()
    return data
  }, [])

  return { mutateAsync, status }
}

export function useUpdateAmenity() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(
    async ({ id, payload }: { id: number; payload: Partial<Amenity> }) => {
      setStatus("pending")
      const { data, error } = await supabase
        .from("amenities")
        .update({
          name: payload.name,
          description: payload.description,
          type: payload.type,
          status: payload.status,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        setStatus("idle")
        throw error
      }

      setStatus("success")
      emitAmenitiesRefetch()
      return data
    },
    []
  )

  return { mutateAsync, status }
}

export function useDeleteAmenity() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (id: number) => {
    setStatus("pending")
    const { error } = await supabase.from("amenities").delete().eq("id", id)

    if (error) {
      setStatus("idle")
      throw error
    }

    setStatus("success")
    emitAmenitiesRefetch()
  }, [])

  return { mutateAsync, status }
}

const COUPONS_REFETCH_EVENT = "coupons-refetch"
function emitCouponsRefetch() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(COUPONS_REFETCH_EVENT))
}

export function useCoupons(page: number, limit: number) {
  const [data, setData] = React.useState<{
    data: Coupon[]
    total: number
  }>({ data: [], total: 0 })
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchCoupons = React.useCallback(async () => {
    setIsLoading(true)
    const from = (page - 1) * limit
    const to = page * limit - 1

    const {
      data: coupons,
      count,
      error,
    } = await supabase
      .from("coupons")
      .select(`*`, { count: "exact" })
      .order("code")
      .range(from, to)

    if (error) {
      console.error("Failed to fetch coupons:", error)
      setData({ data: [], total: 0 })
    } else {
      type RawCoupon = {
        id: number
        code: string
        description?: string
        discount_type: Coupon["discount_type"]
        discount_value: number
        min_booking_amount?: number
        max_discount_amount?: number
        usage_limit?: number
        used_count?: number
        valid_from?: string
        valid_until?: string
        status?: Coupon["status"]
        applicable_rooms?: string
      }
      const normalized: Coupon[] = (
        (coupons as unknown as RawCoupon[]) ?? []
      ).map((c) => ({
        ...c,
        discount_value: Number(c.discount_value),
        min_booking_amount: Number(c.min_booking_amount ?? 0),
        max_discount_amount: c.max_discount_amount
          ? Number(c.max_discount_amount)
          : null,
        used_count: c.used_count ?? 0,
        valid_from: c.valid_from ?? new Date().toISOString(),
        valid_until: c.valid_until ?? new Date().toISOString(),
        status: c.status ?? "active",
        applicable_rooms: c.applicable_rooms ?? "all",
      }))
      setData({ data: normalized, total: count ?? normalized.length })
    }
    setIsLoading(false)
  }, [page, limit])

  React.useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  React.useEffect(() => {
    const handler = () => fetchCoupons()
    window.addEventListener(COUPONS_REFETCH_EVENT, handler)
    return () => window.removeEventListener(COUPONS_REFETCH_EVENT, handler)
  }, [fetchCoupons])

  return { data, isLoading }
}

export function useCreateCoupon() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (payload: Partial<Coupon>) => {
    setStatus("pending")
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: payload.code,
        description: payload.description,
        discount_type: payload.discount_type ?? "percentage",
        discount_value: payload.discount_value,
        min_booking_amount: payload.min_booking_amount,
        max_discount_amount: payload.max_discount_amount,
        usage_limit: payload.usage_limit,
        used_count: payload.used_count ?? 0,
        valid_from: payload.valid_from,
        valid_until: payload.valid_until,
        status: payload.status ?? "active",
        applicable_rooms: payload.applicable_rooms ?? "all",
      })
      .select()
      .single()

    if (error) {
      setStatus("idle")
      throw error
    }

    setStatus("success")
    emitCouponsRefetch()
    return data
  }, [])

  return { mutateAsync, status }
}

export function useUpdateCoupon() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(
    async ({ id, payload }: { id: number; payload: Partial<Coupon> }) => {
      setStatus("pending")
      const { data, error } = await supabase
        .from("coupons")
        .update({
          code: payload.code,
          description: payload.description,
          discount_type: payload.discount_type,
          discount_value: payload.discount_value,
          min_booking_amount: payload.min_booking_amount,
          max_discount_amount: payload.max_discount_amount,
          usage_limit: payload.usage_limit,
          used_count: payload.used_count,
          valid_from: payload.valid_from,
          valid_until: payload.valid_until,
          status: payload.status,
          applicable_rooms: payload.applicable_rooms,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        setStatus("idle")
        throw error
      }

      setStatus("success")
      emitCouponsRefetch()
      return data
    },
    []
  )

  return { mutateAsync, status }
}

export function useDeleteCoupon() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (id: number) => {
    setStatus("pending")
    const { error } = await supabase.from("coupons").delete().eq("id", id)

    if (error) {
      setStatus("idle")
      throw error
    }

    setStatus("success")
    emitCouponsRefetch()
  }, [])

  return { mutateAsync, status }
}

const BOOKINGS_REFETCH_EVENT = "bookings-refetch"
function emitBookingsRefetch() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(BOOKINGS_REFETCH_EVENT))
}

export function useBookings(page: number, limit: number) {
  const [data, setData] = React.useState<{
    data: Booking[]
    total: number
  }>({ data: [], total: 0 })
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true)
    const from = (page - 1) * limit
    const to = page * limit - 1

    const {
      data: bookings,
      count,
      error,
    } = await supabase
      .from("bookings")
      .select(
        `
        *,
        branch:locations(id, name),
        room:rooms(id, name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Failed to fetch bookings:", error)
      setData({ data: [], total: 0 })
    } else {
      type RawBooking = Booking & {
        branch: { id: number; name: string } | null
        room: { id: number; name: string } | null
      }
      const normalized: Booking[] = (
        (bookings as unknown as RawBooking[]) ?? []
      ).map((b) => ({
        ...b,
        total_amount: b.total_amount?.toString(),
        discount_amount: b.discount_amount?.toString(),
        branch: b.branch ?? undefined,
        room: b.room ?? undefined,
      }))
      setData({ data: normalized, total: count ?? normalized.length })
    }
    setIsLoading(false)
  }, [page, limit])

  React.useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  React.useEffect(() => {
    const handler = () => fetchBookings()
    window.addEventListener(BOOKINGS_REFETCH_EVENT, handler)
    return () => window.removeEventListener(BOOKINGS_REFETCH_EVENT, handler)
  }, [fetchBookings])

  return { data, isLoading }
}

export function useCreateBooking() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (payload: Partial<Booking>) => {
    setStatus("pending")

    try {
      const response = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey:
            payload.transaction_id === undefined ||
            payload.transaction_id === null ||
            String(payload.transaction_id).trim() === ""
              ? undefined
              : String(payload.transaction_id).trim(),
          transactionId:
            payload.transaction_id === undefined ||
            payload.transaction_id === null ||
            String(payload.transaction_id).trim() === ""
              ? undefined
              : String(payload.transaction_id).trim(),
          branchId: payload.branch_id,
          roomId: payload.room_id,
          date: payload.date,
          startTime: payload.start_time,
          endTime: payload.end_time,
          name: payload.name,
          organizer: payload.organizer,
          purpose: payload.purpose,
          phone: payload.phone,
          email: payload.email,
          existingCustomer: payload.existing_customer,
          paymentMethod: payload.payment_method,
          paymentStatus: payload.payment_status,
          totalAmount: payload.total_amount,
          discountAmount: payload.discount_amount,
          status: payload.status,
          branchName:
            payload.branch && typeof payload.branch === "object"
              ? payload.branch.name
              : undefined,
          roomName:
            payload.room && typeof payload.room === "object"
              ? payload.room.name
              : undefined,
          pin:
            payload.pin === undefined || payload.pin === null
              ? undefined
              : String(payload.pin),
          password: payload.password,
        }),
      })

      const json = (await response.json().catch(() => null)) as {
        error?: string
        booking?: Booking
        paymentUrl?: string
        invoiceId?: number
      } | null

      if (!response.ok) {
        throw new Error(
          typeof json?.error === "string"
            ? json.error
            : "Unable to create booking right now."
        )
      }

      if (!json?.booking) {
        throw new Error("Booking created but response payload was invalid.")
      }

      setStatus("success")
      emitBookingsRefetch()
      return json
    } catch (error) {
      setStatus("idle")
      throw error
    }
  }, [])

  return { mutateAsync, status }
}

export function useUpdateBooking() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(
    async ({ id, payload }: { id: number; payload: Partial<Booking> }) => {
      setStatus("pending")

      const { branch: _b, room: _r, ...rest } = payload
      void _b
      void _r
      const updateData = {
        ...rest,
        branch_id: payload.branch_id,
        room_id: payload.room_id,
      }

      const { data, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        setStatus("idle")
        throw error
      }

      setStatus("success")
      emitBookingsRefetch()
      return data
    },
    []
  )

  return { mutateAsync, status }
}

export function useDeleteBooking() {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success">(
    "idle"
  )

  const mutateAsync = React.useCallback(async (id: number) => {
    setStatus("pending")
    const { error } = await supabase.from("bookings").delete().eq("id", id)

    if (error) {
      setStatus("idle")
      throw error
    }

    setStatus("success")
    emitBookingsRefetch()
  }, [])

  return { mutateAsync, status }
}

export const useBranches = useLocations
export * from "./use-roles"
