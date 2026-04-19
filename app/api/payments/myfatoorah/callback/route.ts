import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getMyFatoorahPaymentStatus } from "@/lib/server/myfatoorah"

type MyFatoorahKeyType = "PaymentId" | "InvoiceId"

function firstNonEmpty(...values: Array<string | null>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function toLower(value: string | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function isPaidInvoiceStatus(value: string | undefined) {
  return toLower(value) === "paid"
}

function isSuccessTransactionStatus(value: string | undefined) {
  const normalized = toLower(value)
  return normalized === "succss" || normalized === "success"
}

function inferFailureReason(input: {
  fallback?: string | null
  transactions?: Array<{ Error?: string; TransactionStatus?: string }>
}) {
  const fromTxn = input.transactions
    ?.map((txn) => txn.Error?.trim())
    .find((err) => Boolean(err))

  if (fromTxn) return fromTxn
  if (input.fallback?.trim()) return input.fallback.trim()
  return "Payment was not completed."
}

function buildRedirectUrl(
  request: NextRequest,
  pathname: "/payment/success" | "/payment/failed",
  params: Record<string, string | undefined>
) {
  const url = new URL(pathname, request.url)
  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) {
      url.searchParams.set(key, value)
    }
  })
  return url
}

async function updateBookingPaymentStatus(input: {
  bookingId?: number
  transactionId?: string
  paymentStatus: "paid" | "failed" | "pending"
}) {
  if (!input.bookingId && !input.transactionId) return

  const serviceClient = createServerSupabaseClient()
  const updates = {
    payment_status: input.paymentStatus,
    updated_at: new Date().toISOString(),
  }

  let query = serviceClient.from("bookings").update(updates)

  if (input.bookingId) {
    query = query.eq("id", input.bookingId)
  } else if (input.transactionId) {
    query = query.eq("transaction_id", input.transactionId)
  }

  const { error } = await query

  if (error) {
    console.error("Failed to update booking payment status", error)
  }
}

function parseBookingIdFromUserDefinedField(raw: string | undefined) {
  if (!raw?.trim()) return undefined

  try {
    const parsed = JSON.parse(raw) as { bookingId?: unknown }
    const bookingId = Number(parsed.bookingId)
    return Number.isFinite(bookingId) && bookingId > 0 ? bookingId : undefined
  } catch {
    return undefined
  }
}

export async function GET(request: NextRequest) {
  const paymentId = firstNonEmpty(
    request.nextUrl.searchParams.get("paymentId"),
    request.nextUrl.searchParams.get("PaymentId")
  )

  const invoiceId = firstNonEmpty(
    request.nextUrl.searchParams.get("invoiceId"),
    request.nextUrl.searchParams.get("InvoiceId")
  )

  const key = paymentId ?? invoiceId
  const keyType: MyFatoorahKeyType = paymentId ? "PaymentId" : "InvoiceId"

  if (!key) {
    const failedUrl = buildRedirectUrl(request, "/payment/failed", {
      reason: "Missing payment reference in callback.",
    })
    return NextResponse.redirect(failedUrl)
  }

  try {
    const paymentData = await getMyFatoorahPaymentStatus({ key, keyType })
    const transactionId = paymentData.CustomerReference?.trim() || undefined
    const bookingId = parseBookingIdFromUserDefinedField(
      paymentData.UserDefinedField
    )

    const paid =
      isPaidInvoiceStatus(paymentData.InvoiceStatus) ||
      (paymentData.InvoiceTransactions ?? []).some((txn) =>
        isSuccessTransactionStatus(txn.TransactionStatus)
      )

    if (paid) {
      await updateBookingPaymentStatus({
        bookingId,
        transactionId,
        paymentStatus: "paid",
      })

      const successUrl = buildRedirectUrl(request, "/payment/success", {
        paymentId: paymentId ?? key,
        invoiceId: String(paymentData.InvoiceId ?? invoiceId ?? ""),
        transactionId,
      })
      return NextResponse.redirect(successUrl)
    }

    const failedReason = inferFailureReason({
      fallback: request.nextUrl.searchParams.get("error"),
      transactions: paymentData.InvoiceTransactions,
    })

    await updateBookingPaymentStatus({
      bookingId,
      transactionId,
      paymentStatus: "failed",
    })

    const failedUrl = buildRedirectUrl(request, "/payment/failed", {
      paymentId: paymentId ?? key,
      invoiceId: String(paymentData.InvoiceId ?? invoiceId ?? ""),
      reason: failedReason,
    })
    return NextResponse.redirect(failedUrl)
  } catch (error) {
    console.error("MyFatoorah callback verification failed", error)

    const failedUrl = buildRedirectUrl(request, "/payment/failed", {
      paymentId: paymentId ?? undefined,
      invoiceId: invoiceId ?? undefined,
      reason: "Unable to verify payment status right now.",
    })
    return NextResponse.redirect(failedUrl)
  }
}
