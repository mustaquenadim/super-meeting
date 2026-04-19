import { NextResponse } from "next/server"
import { z } from "zod"
import { sendPaymentReceiptEmail } from "@/lib/server/payment-receipt-email"

const requestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().optional(),
  amount: z.string().trim(),
  paymentDate: z.string().trim(),
  paymentMethod: z.string().trim(),
  receiptNumber: z.string().trim(),
  receiptUrl: z.string().trim().url().optional(),
  supportUrl: z.string().trim().url().optional(),
})

export async function POST(request: Request) {
  const parsedBody = requestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid receipt details." },
      { status: 400 }
    )
  }

  const email = parsedBody.data.email.trim().toLowerCase()
  const firstName =
    parsedBody.data.firstName?.trim() || email.split("@")[0] || "there"

  try {
    await sendPaymentReceiptEmail({
      to: email,
      firstName,
      amount: parsedBody.data.amount,
      paymentDate: parsedBody.data.paymentDate,
      paymentMethod: parsedBody.data.paymentMethod,
      receiptNumber: parsedBody.data.receiptNumber,
      receiptUrl: parsedBody.data.receiptUrl,
      supportUrl: parsedBody.data.supportUrl,
    })
  } catch (error) {
    console.error("Failed to send payment receipt email", error)
    return NextResponse.json(
      { error: "Unable to send payment receipt right now." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: "Payment receipt email sent.",
  })
}
