"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AuthFormValues,
  ForgotPasswordFormValues,
  forgotPasswordSchema,
  getAuthSchema,
} from "@/lib/validations/auth"
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
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { supabase } from "@/lib/supabase"

type AuthMode = "login" | "forgot-password"

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const isForgotPassword = mode === "forgot-password"

  const loginForm = useForm<AuthFormValues>({
    resolver: zodResolver(getAuthSchema("login")),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  useEffect(() => {
    let mounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return

        if (data.session) {
          router.replace("/admin/dashboard")
        } else {
          setCheckingSession(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setCheckingSession(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [router])

  if (checkingSession) {
    return null
  }

  const onSubmit = async (
    values: AuthFormValues | ForgotPasswordFormValues
  ) => {
    setAuthError(null)
    setSuccessMessage(null)

    if (isForgotPassword) {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: (values as ForgotPasswordFormValues).email,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        setAuthError(
          typeof json?.error === "string"
            ? json.error
            : "Unable to send reset email right now."
        )
        return
      }

      setSuccessMessage(
        "If an account exists for that email, a password reset link has been sent."
      )
      return
    }

    const { email, password } = values as AuthFormValues

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      setAuthError(
        error?.message ?? "Unable to sign in. Please check your credentials."
      )
      return
    }

    router.push("/admin/dashboard")
  }

  if (isForgotPassword && forgotPasswordForm.formState.isSubmitSuccessful) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              If an account exists for that email, we&apos;ve sent password
              reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldDescription className="text-center">
              <Link href="/auth/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </FieldDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isForgotPassword) {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = forgotPasswordForm
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <FieldDescription className="text-destructive">
                      {errors.email.message}
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending…" : "Send reset link"}
                  </Button>
                  {authError ? (
                    <FieldDescription className="text-center text-destructive">
                      {authError}
                    </FieldDescription>
                  ) : null}
                  <FieldDescription className="text-center">
                    Remember your password?{" "}
                    <Link href="/auth/login" className="text-primary">
                      Login
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = loginForm
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              {successMessage}
            </div>
          ) : null}
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  {mode === "login" && (
                    <Link
                      href="/auth/forgot-password"
                      className="ms-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  )}
                </div>
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
                <Button type="submit" disabled={isSubmitting}>
                  Login
                </Button>
                {authError ? (
                  <FieldDescription className="text-center text-destructive">
                    {authError}
                  </FieldDescription>
                ) : null}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
