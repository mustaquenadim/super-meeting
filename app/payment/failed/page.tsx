"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CircleHelp, CreditCard, FileDigit } from "lucide-react"

function normalizeParam(value: string | null) {
  return value?.trim() || null
}

function PaymentFailedContent() {
  const params = useSearchParams()
  const paymentId = normalizeParam(
    params.get("paymentId") ?? params.get("PaymentId")
  )
  const invoiceId = normalizeParam(
    params.get("invoiceId") ?? params.get("InvoiceId")
  )
  const reason = normalizeParam(
    params.get("reason") ?? params.get("error") ?? params.get("message")
  )

  return (
    <main className="relative min-h-svh overflow-hidden bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-8 -left-20 h-72 w-72 rounded-full bg-destructive/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-chart-4/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-chart-5/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Badge className="w-fit gap-2 border-destructive/40 bg-destructive/10 px-3 py-1 text-destructive">
          <AlertCircle className="size-4" />
          Payment Failed
        </Badge>

        <Card className="border-destructive/25 shadow-xl shadow-destructive/10">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl leading-tight sm:text-4xl">
              We could not complete your payment.
            </CardTitle>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              No worries, your booking details can be submitted again. Please
              retry payment or use another payment method.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-3 rounded-xl border bg-muted/40 p-4 sm:grid-cols-2">
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
            </div>

            <div className="rounded-xl border border-dashed p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CircleHelp className="size-4 text-muted-foreground" />
                Failure reason
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {reason ??
                  "The payment gateway did not return a specific reason."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <Link href="/admin/bookings/new">Try Payment Again</Link>
              </Button>
              <Button asChild variant="outline" className="sm:flex-1">
                <Link href="/admin/bookings">Go to Bookings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={null}>
      <PaymentFailedContent />
    </Suspense>
  )
}
