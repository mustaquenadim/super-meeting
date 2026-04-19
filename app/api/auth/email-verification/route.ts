import { randomInt } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { sendEmailVerificationCodeEmail } from "@/lib/server/email-verification-email"
import { isEmailAlreadyVerified } from "@/lib/server/email-verification-store"

const requestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().optional(),
})

function generateOtpCode() {
  return String(randomInt(100000, 1000000))
}

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
        message: "This email is already verified.",
      })
    }
  } catch (error) {
    console.error("Failed to check verified email status", error)
    return NextResponse.json(
      { error: "Unable to check email verification status right now." },
      { status: 500 }
    )
  }

  const otpCode = generateOtpCode()

  try {
    await sendEmailVerificationCodeEmail({
      to: email,
      firstName,
      otpCode,
    })
  } catch (error) {
    console.error("Failed to send email verification code", error)
    return NextResponse.json(
      { error: "Unable to send verification code right now." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: "Verification code sent. Please check your email.",
  })
}
