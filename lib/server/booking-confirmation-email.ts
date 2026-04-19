import "server-only"

type BookingConfirmationInput = {
  to: string
  firstName: string
  pin: string
  password: string
  bookingTitle?: string
  bookingDate?: string
  startTime?: string
  endTime?: string
  roomName?: string
  branchName?: string
  supportUrl?: string
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

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function buildBookingConfirmationHtml(
  input: BookingConfirmationInput & { companyName: string }
) {
  const firstName = escapeHtml(getFirstName(input.firstName))
  const bookingTitle = escapeHtml(input.bookingTitle?.trim() || "your booking")
  const bookingDate = escapeHtml(formatDate(input.bookingDate))
  const timeRange = escapeHtml(
    [input.startTime, input.endTime].filter(Boolean).join(" - ") || "-"
  )
  const roomName = escapeHtml(input.roomName?.trim() || "-")
  const branchName = escapeHtml(input.branchName?.trim() || "-")
  const pin = escapeHtml(input.pin.trim())
  const password = escapeHtml(input.password.trim())
  const supportUrl = escapeHtml(input.supportUrl ?? "https://example.com")
  const companyName = escapeHtml(input.companyName)

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
<title></title>
<style>
*{box-sizing:border-box}
body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
a{text-decoration:none}
@media only screen and (max-width:620px){.email-container{width:100%!important;max-width:100%!important}.mobile-padding{padding-left:16px!important;padding-right:16px!important}.column-stack{display:block!important;max-width:100%!important;width:100%!important;padding-left:0!important;padding-right:0!important}}
@media (prefers-color-scheme:dark){.email-bg{background-color:#1a1a1a!important}}
</style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F5F5F5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif">
<div role="article" aria-roledescription="email" lang="en" style="font-size:16px;font-weight:400;line-height:1.5;letter-spacing:0.15px;color:#262626;background-color:#F5F5F5;padding:32px 0px" class="email-bg">
<table align="center" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" class="email-container" style="margin:0 auto;max-width:600px;background-color:#FFFFFF">
<tbody>
<tr><td style="padding:16px 24px;color:#262626;font-size:16px;line-height:1.5">Hi ${firstName},</td></tr>
<tr><td style="padding:0 24px 16px;color:#262626;font-size:16px;line-height:1.5">Your booking has been created successfully for ${companyName}. Please keep these ZKTeco credentials safe. The PIN is 6 digits and the password is 4 digits.</td></tr>
<tr><td style="padding:0 24px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:8px 0;font-size:14px;color:#666;width:140px"><strong>PIN (6 digits)</strong></td><td style="padding:8px 0;font-size:14px;color:#000"><code style="font-family:monospace">${pin}</code></td></tr><tr><td style="padding:8px 0;font-size:14px;color:#666;width:140px"><strong>Password (4 digits)</strong></td><td style="padding:8px 0;font-size:14px;color:#000"><code style="font-family:monospace">${password}</code></td></tr><tr><td style="padding:8px 0;font-size:14px;color:#666;width:140px"><strong>Booking</strong></td><td style="padding:8px 0;font-size:14px;color:#000">${bookingTitle}</td></tr><tr><td style="padding:8px 0;font-size:14px;color:#666;width:140px"><strong>Date</strong></td><td style="padding:8px 0;font-size:14px;color:#000">${bookingDate}</td></tr><tr><td style="padding:8px 0;font-size:14px;color:#666;width:140px"><strong>Time</strong></td><td style="padding:8px 0;font-size:14px;color:#000">${timeRange}</td></tr><tr><td style="padding:8px 0;font-size:14px;color:#666;width:140px"><strong>Room</strong></td><td style="padding:8px 0;font-size:14px;color:#000">${roomName}</td></tr><tr><td style="padding:8px 0;font-size:14px;color:#666;width:140px"><strong>Branch</strong></td><td style="padding:8px 0;font-size:14px;color:#000">${branchName}</td></tr></table></td></tr>
<tr><td style="padding:16px 24px 24px;text-align:center"><a href="${escapeHtml(
    process.env.APP_BASE_URL?.trim() ??
      process.env.NEXT_PUBLIC_APP_URL?.trim() ??
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
      "http://localhost:3000"
  )}/admin/bookings" target="_blank" style="background-color:#000;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block">View Booking</a></td></tr>
<tr><td style="padding:0 24px 24px;color:#666666;font-size:13px;line-height:1.5">Questions about this booking? <a href="${supportUrl}">Contact support</a>.</td></tr>
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

function getSupportUrl() {
  return (
    process.env.BOOKING_CONFIRMATION_SUPPORT_URL?.trim() ??
    process.env.WELCOME_EMAIL_HELP_URL?.trim() ??
    `${getAppBaseUrl()}/admin`
  )
}

export async function sendBookingConfirmationEmail(
  input: BookingConfirmationInput
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.BOOKING_CONFIRMATION_EMAIL_FROM?.trim() ??
    process.env.WELCOME_EMAIL_FROM?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim()

  if (!apiKey || !from) {
    throw new Error(
      "Missing RESEND_API_KEY or sender email (BOOKING_CONFIRMATION_EMAIL_FROM/WELCOME_EMAIL_FROM/RESEND_FROM_EMAIL)."
    )
  }

  const companyName =
    process.env.BOOKING_CONFIRMATION_COMPANY_NAME?.trim() ??
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
      subject: `Your ${companyName} booking credentials`,
      html: buildBookingConfirmationHtml({
        ...input,
        companyName,
        supportUrl: input.supportUrl ?? getSupportUrl(),
      }),
    }),
  })

  if (response.ok) return

  const body = await response.text().catch(() => "")
  throw new Error(
    `Failed to send booking confirmation email. ${response.status} ${body}`
  )
}
