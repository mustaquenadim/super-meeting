/** Static mock data for booking UI prototypes (replace with API-backed hooks later). */

export interface BookingMockLocation {
  id: string
  name: string
  isActive: boolean
}

export interface BookingMockRoom {
  id: string
  name: string
  status: "available" | "unavailable"
  capacity: number
}

export interface BookingMockResource {
  id: string
  name: string
  hourlyRate: number
  availableQuantity: number
  isBookable: boolean
  status: "available" | "unavailable"
}

export const mockLocations: BookingMockLocation[] = [
  { id: "1", name: "Main Office", isActive: true },
  { id: "2", name: "Warehouse North", isActive: true },
  { id: "3", name: "Retail Store East", isActive: false },
]

export const mockRooms: BookingMockRoom[] = [
  { id: "1", name: "Room A", status: "available", capacity: 10 },
  { id: "2", name: "Room B", status: "available", capacity: 20 },
  { id: "3", name: "Storage 1", status: "unavailable", capacity: 5 },
]

export const mockResources: BookingMockResource[] = [
  {
    id: "r1",
    name: "HD Projector",
    hourlyRate: 15,
    availableQuantity: 3,
    isBookable: true,
    status: "available",
  },
  {
    id: "r2",
    name: "Catering (coffee)",
    hourlyRate: 45,
    availableQuantity: 1,
    isBookable: true,
    status: "available",
  },
  {
    id: "r3",
    name: "Flip chart",
    hourlyRate: 5,
    availableQuantity: 0,
    isBookable: true,
    status: "unavailable",
  },
]
