import "server-only"

type MyFatoorahExecutePaymentInput = {
  invoiceValue: number
  paymentMethodId?: number
  customerName?: string
  customerMobile?: string
  customerEmail?: string
  customerReference?: string
  userDefinedField?: string
  displayCurrencyIso?: string
  language?: "EN" | "AR"
  callBackUrl?: string
  errorUrl?: string
  invoiceItems?: Array<{
    ItemName: string
    Quantity: number
    UnitPrice: number
  }>
}

type MyFatoorahResponse<T> = {
  IsSuccess?: boolean | string
  Message?: string
  ValidationErrors?: Array<{ Name: string; Error: string }>
  FieldsErrors?: Array<{ Name: string; Error: string }>
  Data?: T
}

type MyFatoorahExecutePaymentData = {
  InvoiceId?: number
  IsDirectPayment?: boolean
  PaymentURL?: string
  CustomerReference?: string
  UserDefinedField?: string
}

type MyFatoorahPaymentKeyType = "PaymentId" | "InvoiceId" | "CustomerReference"

type MyFatoorahInvoiceTransaction = {
  PaymentId?: string
  TransactionStatus?: string
  Error?: string
  ReferenceId?: string
}

type MyFatoorahGetPaymentStatusData = {
  InvoiceId?: number | string
  InvoiceStatus?: string
  CustomerReference?: string
  UserDefinedField?: string
  InvoiceTransactions?: MyFatoorahInvoiceTransaction[]
}

function getAppBaseUrl() {
  const appUrl =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL

  if (!appUrl?.trim()) return undefined
  return appUrl.trim().replace(/\/$/, "")
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getBaseUrl() {
  const baseUrl = process.env.MYFATOORAH_API_BASE?.trim()
  return baseUrl?.replace(/\/$/, "") || "https://apitest.myfatoorah.com"
}

function isLocalhostUrl(value?: string) {
  if (!value?.trim()) return false

  try {
    const url = new URL(value)
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
  } catch {
    return false
  }
}

function getOptionalCallbackUrl(value: string | undefined) {
  if (!value?.trim()) return undefined
  if (isLocalhostUrl(value)) return undefined
  return value.trim()
}

function getDefaultCallbackUrl(path: string) {
  const appBaseUrl = getAppBaseUrl()
  if (!appBaseUrl) return undefined
  return getOptionalCallbackUrl(`${appBaseUrl}${path}`)
}

export async function createMyFatoorahPayment(
  input: MyFatoorahExecutePaymentInput
) {
  const apiKey = process.env.MYFATOORAH_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("Missing MYFATOORAH_API_KEY.")
  }

  const paymentMethodId = parsePositiveNumber(
    process.env.MYFATOORAH_PAYMENT_METHOD_ID,
    2
  )
  const displayCurrencyIso = process.env.MYFATOORAH_CURRENCY?.trim() || "SAR"

  const callBackUrl =
    getOptionalCallbackUrl(input.callBackUrl) ??
    getOptionalCallbackUrl(process.env.MYFATOORAH_CALLBACK_URL) ??
    getDefaultCallbackUrl("/api/payments/myfatoorah/callback")

  const errorUrl =
    getOptionalCallbackUrl(input.errorUrl) ??
    getOptionalCallbackUrl(process.env.MYFATOORAH_ERROR_URL) ??
    getDefaultCallbackUrl("/api/payments/myfatoorah/callback")

  const response = await fetch(`${getBaseUrl()}/v2/ExecutePayment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      InvoiceValue: input.invoiceValue,
      PaymentMethodId: input.paymentMethodId ?? paymentMethodId,
      CustomerName: input.customerName,
      CustomerMobile: input.customerMobile,
      CustomerEmail: input.customerEmail,
      CustomerReference: input.customerReference,
      UserDefinedField: input.userDefinedField,
      DisplayCurrencyIso: input.displayCurrencyIso ?? displayCurrencyIso,
      Language: input.language ?? "EN",
      CallBackUrl: callBackUrl,
      ErrorUrl: errorUrl,
      InvoiceItems: input.invoiceItems,
    }),
  })

  const json = (await response
    .json()
    .catch(
      () => null
    )) as MyFatoorahResponse<MyFatoorahExecutePaymentData> | null

  const isSuccess =
    json?.IsSuccess === true ||
    json?.IsSuccess === "true" ||
    json?.IsSuccess === "True"

  if (!response.ok || !isSuccess || !json?.Data?.PaymentURL) {
    const details =
      json?.Message ?? (await response.text().catch(() => "Unknown error"))
    throw new Error(`Failed to create MyFatoorah payment session. ${details}`)
  }

  return {
    invoiceId: json.Data.InvoiceId,
    isDirectPayment: json.Data.IsDirectPayment ?? false,
    paymentUrl: json.Data.PaymentURL,
    customerReference: json.Data.CustomerReference,
    userDefinedField: json.Data.UserDefinedField,
  }
}

export async function getMyFatoorahPaymentStatus(input: {
  key: string
  keyType: MyFatoorahPaymentKeyType
}) {
  const apiKey = process.env.MYFATOORAH_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("Missing MYFATOORAH_API_KEY.")
  }

  const response = await fetch(`${getBaseUrl()}/v2/GetPaymentStatus`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Key: input.key,
      KeyType: input.keyType,
    }),
  })

  const json = (await response
    .json()
    .catch(
      () => null
    )) as MyFatoorahResponse<MyFatoorahGetPaymentStatusData> | null

  const isSuccess =
    json?.IsSuccess === true ||
    json?.IsSuccess === "true" ||
    json?.IsSuccess === "True"

  if (!response.ok || !isSuccess || !json?.Data) {
    const details =
      json?.Message ?? (await response.text().catch(() => "Unknown error"))
    throw new Error(`Failed to get MyFatoorah payment status. ${details}`)
  }

  return json.Data
}
