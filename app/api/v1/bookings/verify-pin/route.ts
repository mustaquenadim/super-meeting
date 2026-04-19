import { NextResponse } from "next/server"
import { z } from "zod"
import { verifyCvSecurityPersonPin } from "@/lib/cvsecurity/fetch-person"

const requestSchema = z.object({
  pin: z.string().trim().min(1),
  bookingDate: z.string().trim().min(1).optional(),
  bookingEndTime: z.string().trim().min(1).optional(),
})

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Customer PIN is required." },
      { status: 400 }
    )
  }

  const result = await verifyCvSecurityPersonPin(parsed.data.pin, {
    bookingDate: parsed.data.bookingDate,
    bookingEndTime: parsed.data.bookingEndTime,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  if (!result.exists) {
    return NextResponse.json(
      { verified: false, error: "Invalid customer PIN." },
      { status: 400 }
    )
  }

  return NextResponse.json({
    verified: true,
    message: "Customer PIN verified.",
  })
}
