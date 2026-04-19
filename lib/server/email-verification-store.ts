import "server-only"

import { createServerSupabaseClient } from "@/lib/supabase"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function isEmailAlreadyVerified(email: string) {
  const normalizedEmail = normalizeEmail(email)

  const { data, error } = await createServerSupabaseClient()
    .from("verified_emails")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to check verified email status. ${error.message}`)
  }

  return Boolean(data)
}

export async function markEmailAsVerified(email: string) {
  const normalizedEmail = normalizeEmail(email)

  const { error } = await createServerSupabaseClient()
    .from("verified_emails")
    .upsert(
      {
        email: normalizedEmail,
        verified_at: new Date().toISOString(),
      },
      {
        onConflict: "email",
      }
    )

  if (error) {
    throw new Error(`Failed to save verified email. ${error.message}`)
  }
}