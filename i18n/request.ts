import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { cookies } from "next/headers"
import { routing } from "@/i18n/routing"
import { LOCALE_COOKIE } from "@/lib/auth/cookies"

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies()
  const localeFromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  const localeFromRequest = await requestLocale
  const localeCandidate = localeFromCookie ?? localeFromRequest
  const locale = hasLocale(routing.locales, localeCandidate)
    ? localeCandidate
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
