import type { PermissionName } from "@/lib/rbac/types"

export type LocationStatus = "active" | "inactive"

export interface Location {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  latitude?: string
  longitude?: string
  status: LocationStatus
  roomsCount?: number
  capacity?: number
}

export type Branch = Location

export type RoomStatus = "available" | "unavailable"

export interface Door {
  /** CVSecurity door id (opaque string from platform). */
  id: string
  name: string
  deviceId?: string
}

export interface Room {
  id: number
  name: string
  locationId?: number
  location?: { id: number; name: string }
  branch?: { id: number; name: string }
  capacity?: number
  category?: { id: number; name: string }
  status: RoomStatus
  doors?: Door[]
  door?: Door
  door_name?: string | string[]
  description?: string
  price?: number
  amenities?: { id: number; name: string }[]
}

export interface Role {
  id: number
  name: string
  permissions?: string[]
}

export interface RoleWithStats extends Role {
  users_count?: number
  permissions_count?: number
}

export interface Permission {
  id: number
  name: PermissionName
  label: string
}

export interface User {
  id: number
  name: string
  email: string
  role?: string
  roles?: Role[]
  created_at: string
}

export interface RoomCategory {
  id: number
  name: string
  description?: string
  status?: string
  roomCount?: number
}

export interface PaginatedResponse<T> {
  data: T
  total?: number
}

export type Status = "active" | "inactive"

export interface Amenity {
  id: number
  name: string
  description?: string
  type?: string
  status?: Status
}

export type CouponStatus = "active" | "inactive" | "expired"
export type DiscountType = "percentage" | "fixed"

export interface Coupon {
  id: number
  code: string
  description?: string
  discount_type: DiscountType
  discount_value: number
  min_booking_amount: number
  max_discount_amount?: number | null
  usage_limit?: number | null
  used_count: number
  valid_from: string
  valid_until: string
  status: CouponStatus
  applicable_rooms?: string
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "visiting"
  | "completed"
  | "cancelled"

export interface Booking {
  id: number
  branch_id?: number
  branch?: { id: number; name: string }
  room_id?: number
  room?: { id: number; name: string }
  date: string
  start_time: string
  end_time: string
  name?: string
  organizer?: string
  attendees?: string[] | null
  purpose?: string
  status?: BookingStatus
  duration?: string | number | null
  password?: string | null
  pin?: string | number | null
  phone?: string
  email?: string
  email_verified_at?: string | null
  photo?: string
  coupon?: string | null
  existing_customer?: boolean
  total_amount?: string | number | null
  discount_amount?: string | number | null
  payment_method?: string | null
  payment_status?: string | null
  transaction_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface RoomViewModel {
  id: string
  name: string
  branch?: { id: string; name: string }
  door?: { id: string; name: string }
  doors?: { id: string; name: string }[]
  capacity?: number
  type: string
  room_category_id?: string
  status: string
  equipment: { id: number; name: string }[]
  description: string
  price: number
}
