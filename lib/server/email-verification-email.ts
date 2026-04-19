import "server-only"

type EmailVerificationInput = {
  to: string
  firstName: string
  otpCode: string
}

type EmailVerificationSuccessInput = {
  to: string
  firstName: string
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

function buildEmailVerificationHtml(
  input: EmailVerificationInput & { companyName: string }
) {
  const firstName = escapeHtml(getFirstName(input.firstName))
  const otpCode = escapeHtml(input.otpCode)

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
<tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#262626;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Hi ${firstName},</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#262626;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Use the following code to verify your email address for your ${escapeHtml(input.companyName)} booking:</td></tr><tr><td style="padding:16px 24px 16px 24px">
<pre style="background-color:#F4F4F5;border-radius:6px;padding:16px;font-family:monospace;font-size:13px;line-height:1.5;overflow-x:auto;margin:0;color:#1F2937;white-space:pre-wrap;word-break:break-all">${otpCode}</pre>
</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#666666;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">This code expires in <strong>10 minutes</strong>. If you didn't request this code, you can safely ignore this email.</td></tr>
</tbody>
</table>
</div>
</body>
</html>`
}

function buildEmailVerificationSuccessHtml(
  input: EmailVerificationSuccessInput & { companyName: string }
) {
  const firstName = escapeHtml(getFirstName(input.firstName))

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
<tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#262626;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Hi ${firstName},</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#262626;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Your email has been verified successfully for ${escapeHtml(input.companyName)}.</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#666666;font-size:13px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Thanks for being part of the ${escapeHtml(input.companyName)} community.</td></tr>
</tbody>
</table>
</div>
</body>
</html>`
}

export async function sendEmailVerificationCodeEmail(
  input: EmailVerificationInput
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.EMAIL_VERIFICATION_EMAIL_FROM?.trim() ??
    process.env.WELCOME_EMAIL_FROM?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim()

  if (!apiKey || !from) {
    throw new Error(
      "Missing RESEND_API_KEY or sender email (EMAIL_VERIFICATION_EMAIL_FROM/WELCOME_EMAIL_FROM/RESEND_FROM_EMAIL)."
    )
  }

  const companyName =
    process.env.EMAIL_VERIFICATION_COMPANY_NAME?.trim() ??
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
      subject: `Your ${companyName} email verification code`,
      html: buildEmailVerificationHtml({
        to: input.to,
        firstName: input.firstName,
        otpCode: input.otpCode,
        companyName,
      }),
    }),
  })

  if (response.ok) return

  const body = await response.text().catch(() => "")
  throw new Error(
    `Failed to send email verification code. ${response.status} ${body}`
  )
}

export async function sendEmailVerificationSuccessEmail(
  input: EmailVerificationSuccessInput
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.EMAIL_VERIFICATION_EMAIL_FROM?.trim() ??
    process.env.WELCOME_EMAIL_FROM?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim()

  if (!apiKey || !from) {
    throw new Error(
      "Missing RESEND_API_KEY or sender email (EMAIL_VERIFICATION_EMAIL_FROM/WELCOME_EMAIL_FROM/RESEND_FROM_EMAIL)."
    )
  }

  const companyName =
    process.env.EMAIL_VERIFICATION_COMPANY_NAME?.trim() ??
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
      subject: `${companyName} email verified successfully`,
      html: buildEmailVerificationSuccessHtml({
        to: input.to,
        firstName: input.firstName,
        companyName,
      }),
    }),
  })

  if (response.ok) return

  const body = await response.text().catch(() => "")
  throw new Error(
    `Failed to send email verification success email. ${response.status} ${body}`
  )
}
