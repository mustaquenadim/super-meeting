import { z } from "zod/v3"

export type AuthMode = "login" | "register"

export const getAuthSchema = (mode: AuthMode) =>
  z
    .object({
      name: z.string().trim().optional(),
      email: z.string().email("Please enter a valid email"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().trim().optional(),
    })
    .superRefine((values, ctx) => {
      if (mode === "register" && !values.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["name"],
          message: "Name is required",
        })
      }

      if (mode === "register" && !values.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Confirm your password",
        })
      }

      if (mode === "register" && values.confirmPassword !== values.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match",
        })
      }
    })

export type AuthFormValues = z.infer<ReturnType<typeof getAuthSchema>>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (!values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Confirm your password",
      })
    }

    if (values.confirmPassword && values.confirmPassword !== values.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      })
    }
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
