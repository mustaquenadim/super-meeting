import "server-only"

type InvoiceEmailInput = {
  to: string
  firstName: string
  billingPeriod: string
  invoiceNumber: string
  amount: string
  dueDate: string
  status: string
  invoiceUrl?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function getFirstName(nameOrEmailPrefix: string) {
  const trimmed = nameOrEmailPrefix.trim()
  if (!trimmed) return "there"
  return trimmed.split(/\s+/)[0] ?? "there"
}

function formatAmount(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return "SAR 0.00"

  if (/^[\d.,]+$/.test(trimmed)) {
    const numericValue = Number(trimmed.replace(/,/g, ""))
    if (!Number.isNaN(numericValue)) {
      return `SAR ${numericValue.toFixed(2)}`
    }
  }

  return trimmed
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.trim() || "-"

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatStatus(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return "Pending"

  return trimmed
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function buildInvoiceHtml(input: InvoiceEmailInput) {
  const firstName = escapeHtml(getFirstName(input.firstName))
  const billingPeriod = escapeHtml(input.billingPeriod)
  const invoiceNumber = escapeHtml(input.invoiceNumber)
  const amount = escapeHtml(formatAmount(input.amount))
  const dueDate = escapeHtml(formatDate(input.dueDate))
  const status = escapeHtml(formatStatus(input.status))
  const invoiceUrl = escapeHtml(input.invoiceUrl ?? "https://example.com")

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
<title></title>

<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
*{box-sizing:border-box}
body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
a{text-decoration:none}
@media only screen and (max-width:620px){
.email-container{width:100%!important;max-width:100%!important}
.mobile-padding{padding-left:16px!important;padding-right:16px!important}
.column-stack{display:block!important;max-width:100%!important;width:100%!important;padding-left:0!important;padding-right:0!important}
}
@media (prefers-color-scheme:dark){
.email-bg{background-color:#1a1a1a!important}
}
</style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F5F5F5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif">

<div role="article" aria-roledescription="email" lang="en" style="font-size:16px;font-weight:400;line-height:1.5;letter-spacing:0.15px;color:#262626;background-color:#F5F5F5;padding:32px 0px 32px 0px" class="email-bg">
<table align="center" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" class="email-container" style="margin:0 auto;max-width:600px;background-color:#FFFFFF;padding:0px 0px 0px 0px">
<tbody>
<tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#262626;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Hi ${firstName},</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#262626;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Here is your invoice for <strong>${billingPeriod}</strong>.</td></tr><tr><td style="padding:16px 24px 16px 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border:1px solid #eaeaea;border-radius:8px"><tr><td style="padding:8px 12px;font-size:13px;color:#666666;border-bottom:1px solid #eaeaea">Invoice</td><td style="padding:8px 12px;font-size:13px;color:#000000;border-bottom:1px solid #eaeaea">#${invoiceNumber}</td></tr><tr><td style="padding:8px 12px;font-size:13px;color:#666666;border-bottom:1px solid #eaeaea">Amount Due</td><td style="padding:8px 12px;font-size:13px;color:#000000;border-bottom:1px solid #eaeaea">${amount}</td></tr><tr><td style="padding:8px 12px;font-size:13px;color:#666666;border-bottom:1px solid #eaeaea">Due Date</td><td style="padding:8px 12px;font-size:13px;color:#000000;border-bottom:1px solid #eaeaea">${dueDate}</td></tr><tr><td style="padding:8px 12px;font-size:13px;color:#666666">Status</td><td style="padding:8px 12px;font-size:13px;color:#000000">${status}</td></tr></table></td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:center">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${invoiceUrl}" style="height:42px;v-text-anchor:middle;width:auto" arcsize="14%" strokecolor="#000000" fillcolor="#000000"><w:anchorlock/><center style="color:#ffffff;font-size:14px;font-weight:600">View Invoice</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${invoiceUrl}" target="_blank" style="background-color:#000000;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;text-align:center;mso-padding-alt:0">View Invoice</a><!--<![endif]-->
</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#666666;font-size:13px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Thank you for choosing Super Office CVSecurity conference room booking.</td></tr>
</tbody>
</table>
</div>
</body>
</html>`
}

function getAppBaseUrl() {
  const appUrl =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL

  if (!appUrl?.trim()) return "http://localhost:3000"
  return appUrl.trim().replace(/\/$/, "")
}

function getInvoiceUrl() {
  return `${getAppBaseUrl()}/admin/bookings`
}

export async function sendInvoiceEmail(input: InvoiceEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.INVOICE_EMAIL_FROM?.trim() ??
    process.env.PAYMENT_RECEIPT_EMAIL_FROM?.trim() ??
    process.env.WELCOME_EMAIL_FROM?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim()

  if (!apiKey || !from) {
    throw new Error(
      "Missing RESEND_API_KEY or sender email (INVOICE_EMAIL_FROM/PAYMENT_RECEIPT_EMAIL_FROM/WELCOME_EMAIL_FROM/RESEND_FROM_EMAIL)."
    )
  }

  const companyName =
    process.env.INVOICE_COMPANY_NAME?.trim() ??
    process.env.PAYMENT_RECEIPT_COMPANY_NAME?.trim() ??
    process.env.WELCOME_EMAIL_COMPANY_NAME?.trim() ??
    "Super Office CVSecurity"

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Invoice from ${companyName}`,
      html: buildInvoiceHtml({
        ...input,
        invoiceUrl: input.invoiceUrl ?? getInvoiceUrl(),
      }),
    }),
  })

  if (response.ok) return

  const body = await response.text().catch(() => "")
  throw new Error(`Failed to send invoice email. ${response.status} ${body}`)
}
