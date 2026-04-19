import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase"
import { sendPasswordResetEmail } from "@/lib/server/password-reset-email"

const requestSchema = z.object({
  email: z.string().email(),
})

function getAppBaseUrl() {
  const appUrl =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL

  if (!appUrl?.trim()) return "http://localhost:3000"
  return appUrl.trim().replace(/\/$/, "")
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

  try {
    const serviceClient = createServerSupabaseClient()
    const baseUrl = getAppBaseUrl()

    const { data: linkData, error: linkError } =
      await serviceClient.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo:
            process.env.PASSWORD_RESET_REDIRECT_TO?.trim() ??
            `${baseUrl}/auth/reset-password`,
        },
      })

    if (!linkError && linkData?.properties?.action_link) {
      const fullName =
        typeof linkData.user?.user_metadata?.full_name === "string"
          ? linkData.user.user_metadata.full_name
          : email.split("@")[0] || "there"

      await sendPasswordResetEmail({
        to: email,
        firstName: fullName,
        resetUrl: linkData.properties.action_link,
      })
    } else {
      console.warn("Password reset link generation failed", linkError)
    }
  } catch (error) {
    console.error("Failed to send password reset email", error)
  }

  return NextResponse.json({
    message:
      "If an account exists for that email, a password reset link has been sent.",
  })
}
