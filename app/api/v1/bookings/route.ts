import { randomInt } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase"
import { createMyFatoorahPayment } from "@/lib/server/myfatoorah"
import { sendPaymentReceiptEmail } from "@/lib/server/payment-receipt-email"
import { sendBookingConfirmationEmail } from "@/lib/server/booking-confirmation-email"
import { sendInvoiceEmail } from "@/lib/server/invoice-email"
import { verifyCvSecurityPersonPin } from "@/lib/cvsecurity/fetch-person"

const requestSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
  transactionId: z.string().trim().min(4).max(120).optional(),
  branchId: z.coerce.number().int().positive(),
  roomId: z.coerce.number().int().positive(),
  date: z.string().trim().min(1),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  name: z.string().trim().optional(),
  organizer: z.string().trim().optional(),
  purpose: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email(),
  existingCustomer: z.boolean().optional(),
  paymentMethod: z.string().trim().optional(),
  paymentStatus: z.string().trim().optional(),
  totalAmount: z.union([z.string(), z.number()]).optional(),
  discountAmount: z.union([z.string(), z.number()]).optional(),
  status: z
    .enum(["pending", "confirmed", "visiting", "completed", "cancelled"])
    .optional(),
  branchName: z.string().trim().optional(),
  roomName: z.string().trim().optional(),
  supportUrl: z.string().trim().url().optional(),
  pin: z.string().trim().min(1).optional(),
  password: z.string().trim().length(4).optional(),
})

function generateBookingPin() {
  return String(randomInt(100000, 1000000))
}

function generateBookingPassword() {
  return String(randomInt(1000, 10000))
}

function getAppBaseUrl() {
  const appUrl =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL

  if (!appUrl?.trim()) return "http://localhost:3000"
  return appUrl.trim().replace(/\/$/, "")
}

function isApiKeyAuthorized(request: Request) {
  const configuredKey = process.env.BOOKING_API_KEY?.trim()
  const requireKey = process.env.BOOKING_API_REQUIRE_KEY === "true"

  if (!configuredKey) return true

  const providedKey = request.headers.get("x-booking-api-key")?.trim()

  if (!providedKey && !requireKey) return true
  return providedKey === configuredKey
}

function isCreditCardPayment(paymentMethod?: string | null) {
  if (!paymentMethod) return false

  const normalized = paymentMethod
    .trim()
    .toLowerCase()
    .replaceAll("_", "")
    .replaceAll("-", "")
    .replaceAll(" ", "")

  return normalized === "creditcard"
}

export async function POST(request: Request) {
  if (!isApiKeyAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking payload." },
      { status: 400 }
    )
  }

  const body = parsed.data
  const client = createServerSupabaseClient()
  const requestedAmount = Number(
    typeof body.totalAmount === "number"
      ? body.totalAmount
      : String(body.totalAmount ?? "0").replace(/,/g, "")
  )
  const isCreditCard = isCreditCardPayment(body.paymentMethod ?? "credit_card")

  if (
    isCreditCard &&
    (!Number.isFinite(requestedAmount) || requestedAmount <= 0)
  ) {
    return NextResponse.json(
      {
        error:
          "Credit card bookings require a positive booking amount before payment can be created.",
      },
      { status: 400 }
    )
  }

  const idempotencyKey = body.idempotencyKey?.trim() || undefined
  const transactionId =
    body.transactionId?.trim() ||
    idempotencyKey ||
    `BKG-${Date.now().toString().slice(-8)}`

  if (idempotencyKey) {
    const { data: existingBooking, error: existingError } = await client
      .from("bookings")
      .select(
        `
        *,
        branch:locations(id, name),
        room:rooms(id, name)
      `
      )
      .eq("transaction_id", transactionId)
      .maybeSingle()

    if (existingError) {
      console.error("Failed to check idempotency", existingError)
      return NextResponse.json(
        { error: "Unable to process booking right now." },
        { status: 500 }
      )
    }

    if (existingBooking) {
      return NextResponse.json({
        idempotent: true,
        booking: existingBooking,
      })
    }
  }

  if (body.existingCustomer) {
    if (!body.pin?.trim()) {
      return NextResponse.json(
        { error: "Customer PIN is required for existing customers." },
        { status: 400 }
      )
    }

    try {
      const pinCheck = await verifyCvSecurityPersonPin(body.pin, {
        bookingDate: body.date,
        bookingEndTime: body.endTime,
      })
      if (pinCheck.error) {
        return NextResponse.json({ error: pinCheck.error }, { status: 500 })
      }

      if (!pinCheck.exists) {
        return NextResponse.json(
          { error: "Invalid customer PIN." },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unable to verify customer PIN right now.",
        },
        { status: 500 }
      )
    }
  }

  const pin = body.pin ?? generateBookingPin()
  const password = body.password ?? generateBookingPassword()

  const insertData = {
    branch_id: body.branchId,
    room_id: body.roomId,
    date: body.date,
    start_time: body.startTime,
    end_time: body.endTime,
    name: body.name,
    organizer: body.organizer,
    purpose: body.purpose,
    phone: body.phone,
    email: body.email.toLowerCase(),
    existing_customer: body.existingCustomer ?? false,
    payment_method: body.paymentMethod ?? "credit_card",
    payment_status: body.paymentStatus ?? "pending",
    total_amount: body.totalAmount ?? "0.00",
    discount_amount: body.discountAmount ?? "0.00",
    status: body.status ?? "pending",
    pin,
    password,
    transaction_id: transactionId,
  }

  const { data: booking, error: createError } = await client
    .from("bookings")
    .insert(insertData)
    .select(
      `
      *,
      branch:locations(id, name),
      room:rooms(id, name)
    `
    )
    .single()

  if (createError) {
    console.error("Failed to create booking", createError)
    return NextResponse.json(
      { error: "Unable to create booking right now." },
      { status: 500 }
    )
  }

  const baseUrl = getAppBaseUrl()
  const receiptUrl = `${baseUrl}/admin/bookings`
  const supportUrl = body.supportUrl?.trim() || `${baseUrl}/admin`
  const bookingAmount = requestedAmount || Number(booking.total_amount ?? 0)

  const emailResults = {
    invoiceEmailSent: false,
    receiptEmailSent: false,
    confirmationEmailSent: false,
  }
  let paymentUrl: string | undefined
  let invoiceId: number | undefined

  try {
    const amount =
      booking.total_amount === undefined || booking.total_amount === null
        ? "SAR 0.00"
        : String(booking.total_amount)

    if (isCreditCard) {
      const paymentSession = await createMyFatoorahPayment({
        invoiceValue: bookingAmount,
        customerName: booking.name ?? booking.organizer ?? booking.email,
        customerMobile: booking.phone ?? undefined,
        customerEmail: booking.email,
        customerReference: booking.transaction_id ?? transactionId,
        userDefinedField: JSON.stringify({
          bookingId: booking.id,
          bookingTitle: booking.name ?? booking.organizer ?? undefined,
          roomId: booking.room_id ?? undefined,
          branchId: booking.branch_id ?? undefined,
        }),
        invoiceItems: [
          {
            ItemName:
              booking.name ?? booking.organizer ?? "Conference room booking",
            Quantity: 1,
            UnitPrice: bookingAmount,
          },
        ],
      })

      paymentUrl = paymentSession.paymentUrl
      invoiceId = paymentSession.invoiceId

      await sendInvoiceEmail({
        to: booking.email,
        firstName: booking.name ?? booking.organizer ?? booking.email,
        billingPeriod:
          booking.date && booking.start_time && booking.end_time
            ? `${booking.date} ${booking.start_time}-${booking.end_time}`
            : (booking.date ?? "Current booking period"),
        invoiceNumber: booking.transaction_id ?? transactionId,
        amount,
        dueDate: booking.created_at ?? new Date().toISOString(),
        status: booking.payment_status ?? "pending",
        invoiceUrl: paymentUrl,
      })
      emailResults.invoiceEmailSent = true
    } else {
      await sendPaymentReceiptEmail({
        to: booking.email,
        firstName: booking.name ?? booking.organizer ?? booking.email,
        amount,
        paymentDate: booking.created_at ?? new Date().toISOString(),
        paymentMethod: booking.payment_method ?? "Not specified",
        receiptNumber: booking.transaction_id ?? transactionId,
        receiptUrl,
        supportUrl,
      })
      emailResults.receiptEmailSent = true
    }
  } catch (error) {
    console.error("Failed to send invoice/receipt email", error)
  }

  try {
    await sendBookingConfirmationEmail({
      to: booking.email,
      firstName: booking.name ?? booking.organizer ?? booking.email,
      pin,
      password,
      bookingTitle: booking.name ?? booking.organizer ?? undefined,
      bookingDate: booking.date ?? undefined,
      startTime: booking.start_time ?? undefined,
      endTime: booking.end_time ?? undefined,
      roomName: body.roomName ?? booking.room?.name ?? undefined,
      branchName: body.branchName ?? booking.branch?.name ?? undefined,
      supportUrl,
    })
    emailResults.confirmationEmailSent = true
  } catch (error) {
    console.error("Failed to send booking confirmation", error)
  }

  return NextResponse.json({
    idempotent: false,
    booking,
    credentials: {
      pin,
      password,
    },
    transactionId,
    paymentUrl,
    invoiceId,
    emailResults,
  })
}
