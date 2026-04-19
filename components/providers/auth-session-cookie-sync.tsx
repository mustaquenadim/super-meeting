"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/cookies"

type CookieWriteOptions = {
  maxAgeSeconds?: number
}

function setCookie(
  name: string,
  value: string,
  options: CookieWriteOptions = {}
) {
  const maxAgeSeconds = options.maxAgeSeconds ?? SESSION_COOKIE_MAX_AGE_SECONDS
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

function syncSessionCookies(
  session: Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >["data"]["session"]
) {
  if (!session?.access_token || !session.refresh_token) {
    clearCookie(ACCESS_TOKEN_COOKIE)
    clearCookie(REFRESH_TOKEN_COOKIE)
    return
  }

  setCookie(ACCESS_TOKEN_COOKIE, session.access_token)
  setCookie(REFRESH_TOKEN_COOKIE, session.refresh_token)
}

export function AuthSessionCookieSync() {
  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        syncSessionCookies(data.session)
      })
      .catch(() => {
        if (!isMounted) return
        syncSessionCookies(null)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionCookies(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return null
}
