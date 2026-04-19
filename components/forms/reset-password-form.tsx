"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import {
  ResetPasswordFormValues,
  resetPasswordSchema,
} from "@/lib/validations/auth"

type RecoveryStatus = "checking" | "ready" | "invalid"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [recoveryStatus, setRecoveryStatus] =
    useState<RecoveryStatus>("checking")
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    let mounted = true

    const establishRecoverySession = async () => {
      setRecoveryStatus("checking")
      setRecoveryError(null)

      const tokenHash = searchParams.get("token_hash")
      const code = searchParams.get("code")
      const type = searchParams.get("type")

      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      )
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!mounted) return

        if (!error) {
          window.history.replaceState(null, "", window.location.pathname)
          setRecoveryStatus("ready")
          return
        }
      }

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        })

        if (!mounted) return

        if (!error) {
          setRecoveryStatus("ready")
          return
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!mounted) return

        if (!error) {
          setRecoveryStatus("ready")
          return
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (session) {
        setRecoveryStatus("ready")
        return
      }

      setRecoveryStatus("invalid")
      setRecoveryError("This password reset link is invalid or has expired.")
    }

    establishRecoverySession().catch(() => {
      if (!mounted) return
      setRecoveryStatus("invalid")
      setRecoveryError("This password reset link is invalid or has expired.")
    })

    return () => {
      mounted = false
    }
  }, [searchParams])

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setSubmitError(null)
    setSuccessMessage(null)

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      setSubmitError(error.message)
      return
    }

    setSuccessMessage("Password updated successfully. You can now sign in.")

    await supabase.auth.signOut({ scope: "local" })
    router.push("/auth/login")
  }

  if (recoveryStatus === "checking") {
    return null
  }

  if (recoveryStatus === "invalid") {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset link expired</CardTitle>
            <CardDescription>
              {recoveryError ?? "This password reset link is invalid."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldDescription className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-primary hover:underline"
              >
                Request a new reset link
              </Link>
            </FieldDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password you have not used before.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...register("password")}
                />
                {errors.password && (
                  <FieldError>{errors.password.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm new password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <FieldError>{errors.confirmPassword.message}</FieldError>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update password"}
                </Button>
                {submitError ? (
                  <FieldDescription className="text-center text-destructive">
                    {submitError}
                  </FieldDescription>
                ) : null}
                {successMessage ? (
                  <FieldDescription className="text-center text-primary">
                    {successMessage}
                  </FieldDescription>
                ) : null}
                <FieldDescription className="text-center">
                  <Link href="/auth/login" className="text-primary">
                    Back to login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
