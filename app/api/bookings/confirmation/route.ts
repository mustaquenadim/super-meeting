import { NextResponse } from "next/server"
import { z } from "zod"
import { sendBookingConfirmationEmail } from "@/lib/server/booking-confirmation-email"

const requestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().optional(),
  pin: z.string().trim().length(6),
  password: z.string().trim().length(4),
  bookingTitle: z.string().trim().optional(),
  bookingDate: z.string().trim().optional(),
  startTime: z.string().trim().optional(),
  endTime: z.string().trim().optional(),
  roomName: z.string().trim().optional(),
  branchName: z.string().trim().optional(),
  supportUrl: z.string().trim().url().optional(),
})

export async function POST(request: Request) {
  const parsedBody = requestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid booking credentials." },
      { status: 400 }
    )
  }

  const email = parsedBody.data.email.trim().toLowerCase()
  const firstName =
    parsedBody.data.firstName?.trim() || email.split("@")[0] || "there"

  try {
    await sendBookingConfirmationEmail({
      to: email,
      firstName,
      pin: parsedBody.data.pin,
      password: parsedBody.data.password,
      bookingTitle: parsedBody.data.bookingTitle,
      bookingDate: parsedBody.data.bookingDate,
      startTime: parsedBody.data.startTime,
      endTime: parsedBody.data.endTime,
      roomName: parsedBody.data.roomName,
      branchName: parsedBody.data.branchName,
      supportUrl: parsedBody.data.supportUrl,
    })
  } catch (error) {
    console.error("Failed to send booking confirmation email", error)
    return NextResponse.json(
      { error: "Unable to send booking credentials right now." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: "Booking confirmation email sent.",
  })
}