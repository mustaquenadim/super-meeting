"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, CreditCard, FileDigit, ReceiptText } from "lucide-react"

function normalizeParam(value: string | null) {
  return value?.trim() || null
}

export default function PaymentSuccessPage() {
  const params = useSearchParams()
  const paymentId = normalizeParam(
    params.get("paymentId") ?? params.get("PaymentId")
  )
  const invoiceId = normalizeParam(
    params.get("invoiceId") ?? params.get("InvoiceId")
  )
  const transactionId = normalizeParam(
    params.get("transactionId") ?? params.get("CustomerReference")
  )

  return (
    <main className="relative min-h-svh overflow-hidden bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 -left-24 h-72 w-72 rounded-full bg-chart-1/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-80 w-80 rounded-full bg-chart-2/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Badge className="w-fit gap-2 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4" />
          Payment Received
        </Badge>

        <Card className="border-emerald-500/20 shadow-xl shadow-emerald-500/10">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl leading-tight sm:text-4xl">
              Your payment was successful.
            </CardTitle>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              We are processing your booking confirmation. If payment
              verification is still in progress, your booking may briefly appear
              as pending before it is finalized.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-3 rounded-xl border bg-muted/40 p-4 sm:grid-cols-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
                  <CreditCard className="size-3.5" />
                  Payment ID
                </div>
                <p className="truncate font-medium">
                  {paymentId ?? "Not provided"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
                  <FileDigit className="size-3.5" />
                  Invoice ID
                </div>
                <p className="truncate font-medium">
                  {invoiceId ?? "Not provided"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
                  <ReceiptText className="size-3.5" />
                  Transaction
                </div>
                <p className="truncate font-medium">
                  {transactionId ?? "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <Link href="/admin/bookings">View Bookings</Link>
              </Button>
              <Button asChild variant="outline" className="sm:flex-1">
                <Link href="/admin/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
