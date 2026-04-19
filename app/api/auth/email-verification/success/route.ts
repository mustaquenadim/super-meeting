import { NextResponse } from "next/server"
import { z } from "zod"
import { sendEmailVerificationSuccessEmail } from "@/lib/server/email-verification-email"
import {
  isEmailAlreadyVerified,
  markEmailAsVerified,
} from "@/lib/server/email-verification-store"

const requestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().optional(),
})

export async function POST(request: Request) {
  const parsedBody = requestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 }
    )
  }

  const email = parsedBody.data.email.trim().toLowerCase()
  const firstName =
    parsedBody.data.firstName?.trim() || email.split("@")[0] || "there"

  try {
    const alreadyVerified = await isEmailAlreadyVerified(email)

    if (alreadyVerified) {
      return NextResponse.json({
        alreadyVerified: true,
        message: "Email already verified.",
      })
    }

    await markEmailAsVerified(email)
  } catch (error) {
    console.error("Failed to persist email verification", error)
    return NextResponse.json(
      { error: "Unable to complete verification right now." },
      { status: 500 }
    )
  }

  try {
    await sendEmailVerificationSuccessEmail({
      to: email,
      firstName,
    })
  } catch (error) {
    console.error("Failed to send email verification success email", error)
    return NextResponse.json(
      { error: "Unable to send verification confirmation email right now." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    alreadyVerified: false,
    message: "Verification confirmation email sent.",
  })
}
