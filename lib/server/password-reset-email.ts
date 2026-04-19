import "server-only"

type PasswordResetEmailInput = {
  to: string
  firstName: string
  resetUrl: string
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

function buildPasswordResetHtml(
  input: PasswordResetEmailInput & { companyName: string }
) {
  const firstName = escapeHtml(input.firstName)
  const resetUrl = escapeHtml(input.resetUrl)

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
<tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#262626;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">Hi ${firstName},</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#262626;font-size:16px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">We received a request to reset your password for your ${escapeHtml(input.companyName)} account. Click the button below to choose a new one. This link will expire in <strong>1 hour</strong>.</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:center">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:42px;v-text-anchor:middle;width:auto" arcsize="14%" strokecolor="#000000" fillcolor="#000000"><w:anchorlock/><center style="color:#ffffff;font-size:14px;font-weight:600">Reset Password</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${resetUrl}" target="_blank" style="background-color:#000000;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;text-align:center;mso-padding-alt:0">Reset Password</a><!--<![endif]-->
</td></tr><tr><td style="padding:8px 24px 8px 24px">
<hr style="border:none;border-top:1px solid #eaeaea;margin:0"/>
</td></tr><tr><td style="padding:16px 24px 16px 24px;text-align:left;color:#666666;font-size:13px;font-weight:normal;line-height:1.5;font-family:Helvetica Neue, Arial Nova, Nimbus Sans, Arial, sans-serif;word-break:break-word;overflow-wrap:break-word">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</td></tr>
</tbody>
</table>
</div>
</body>
</html>`
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.PASSWORD_RESET_EMAIL_FROM?.trim() ??
    process.env.WELCOME_EMAIL_FROM?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim()

  if (!apiKey || !from) {
    throw new Error(
      "Missing RESEND_API_KEY or sender email (PASSWORD_RESET_EMAIL_FROM/WELCOME_EMAIL_FROM/RESEND_FROM_EMAIL)."
    )
  }

  const companyName =
    process.env.PASSWORD_RESET_COMPANY_NAME?.trim() ??
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
      subject: `Reset your ${companyName} password`,
      html: buildPasswordResetHtml({
        to: input.to,
        firstName: getFirstName(input.firstName),
        resetUrl: input.resetUrl,
        companyName,
      }),
    }),
  })

  if (response.ok) return

  const body = await response.text().catch(() => "")
  throw new Error(
    `Failed to send password reset email. ${response.status} ${body}`
  )
}
