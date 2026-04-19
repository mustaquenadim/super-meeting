export enum PermissionAction {
  VIEW = "view",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  APPLY = "apply",
  EXECUTE = "execute",
  VERIFY = "verify",
  SEND_CODE = "send-code",
  VERIFY_CODE = "verify-code",
  ASSIGN_ROLE = "assign-role",
}

export enum PermissionModule {
  BRANCH = "branch",
  COUPON = "coupon",
  ROOM_CATEGORY = "room-category",
  AMENITY = "amenity",
  ROOM = "room",
  BOOKING = "booking",
  DEVICE = "device",
  DOOR = "door",
  CUSTOMER = "customer",
  PAYMENT = "payment",
  EMAIL = "email",
  USER = "user",
  ROLE = "role",
}

export type PermissionName =
  | "branch.view"
  | "branch.create"
  | "branch.update"
  | "branch.delete"
  | "coupon.view"
  | "coupon.create"
  | "coupon.update"
  | "coupon.delete"
  | "coupon.apply"
  | "room-category.view"
  | "room-category.create"
  | "room-category.update"
  | "room-category.delete"
  | "amenity.view"
  | "amenity.create"
  | "amenity.update"
  | "amenity.delete"
  | "room.view"
  | "room.create"
  | "room.update"
  | "room.delete"
  | "booking.view"
  | "booking.create"
  | "booking.update"
  | "booking.delete"
  | "device.view"
  | "door.view"
  | "customer.verify"
  | "payment.execute"
  | "email.send-code"
  | "email.verify-code"
  | "user.view"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "user.assign-role"
  | "role.view"
  | "role.create"
  | "role.update"
  | "role.delete"

export const MODULE_PERMISSIONS: Record<PermissionModule, PermissionName[]> = {
  [PermissionModule.BRANCH]: [
    "branch.view",
    "branch.create",
    "branch.update",
    "branch.delete",
  ],
  [PermissionModule.COUPON]: [
    "coupon.view",
    "coupon.create",
    "coupon.update",
    "coupon.delete",
    "coupon.apply",
  ],
  [PermissionModule.ROOM_CATEGORY]: [
    "room-category.view",
    "room-category.create",
    "room-category.update",
    "room-category.delete",
  ],
  [PermissionModule.AMENITY]: [
    "amenity.view",
    "amenity.create",
    "amenity.update",
    "amenity.delete",
  ],
  [PermissionModule.ROOM]: [
    "room.view",
    "room.create",
    "room.update",
    "room.delete",
  ],
  [PermissionModule.BOOKING]: [
    "booking.view",
    "booking.create",
    "booking.update",
    "booking.delete",
  ],
  [PermissionModule.DEVICE]: ["device.view"],
  [PermissionModule.DOOR]: ["door.view"],
  [PermissionModule.CUSTOMER]: ["customer.verify"],
  [PermissionModule.PAYMENT]: ["payment.execute"],
  [PermissionModule.EMAIL]: ["email.send-code", "email.verify-code"],
  [PermissionModule.USER]: [
    "user.view",
    "user.create",
    "user.update",
    "user.delete",
    "user.assign-role",
  ],
  [PermissionModule.ROLE]: [
    "role.view",
    "role.create",
    "role.update",
    "role.delete",
  ],
}

export const MODULE_LABELS: Record<PermissionModule, string> = {
  [PermissionModule.BRANCH]: "Branches",
  [PermissionModule.COUPON]: "Coupons",
  [PermissionModule.ROOM_CATEGORY]: "Room Categories",
  [PermissionModule.AMENITY]: "Amenities",
  [PermissionModule.ROOM]: "Rooms",
  [PermissionModule.BOOKING]: "Bookings",
  [PermissionModule.DEVICE]: "Devices",
  [PermissionModule.DOOR]: "Doors",
  [PermissionModule.CUSTOMER]: "Customers",
  [PermissionModule.PAYMENT]: "Payments",
  [PermissionModule.EMAIL]: "Email Verification",
  [PermissionModule.USER]: "Users",
  [PermissionModule.ROLE]: "Roles & Permissions",
}

export const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  apply: "Apply",
  execute: "Execute",
  verify: "Verify",
  "send-code": "Send Code",
  "verify-code": "Verify Code",
  "assign-role": "Assign Role",
}
