"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Link, useRouter } from "@/i18n/navigation"
import { AppLocale } from "@/i18n/routing"
import { LOCALE_COOKIE } from "@/lib/auth/cookies"
import { supabase } from "@/lib/supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import {
  BadgeCheckIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  LanguagesIcon,
  LogOutIcon,
  UserIcon,
} from "lucide-react"

export function NavUser() {
  const t = useTranslations("sidebar.userMenu")
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const { isMobile } = useSidebar()
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] })
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const name =
        user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

      return {
        name,
        email: user.email || "",
        avatar: user.user_metadata?.avatar_url || "",
        initials,
      }
    },
  })

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" })

    if (error) {
      console.error("Logout failed:", error.message)
      return
    }

    queryClient.setQueryData(["auth-user"], null)
    router.replace("/auth/login")
  }

  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return

    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`
    router.refresh()
  }

  if (isLoading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <UserIcon className="size-4 animate-pulse text-muted-foreground" />
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted text-xs" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-muted">
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                  <BadgeCheckIcon />
                  {t("profile")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("language")}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  handleLocaleChange("en")
                }}
              >
                <LanguagesIcon />
                {t("languageEn")}
                {locale === "en" && <CheckIcon className="ms-auto size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  handleLocaleChange("ar")
                }}
              >
                <LanguagesIcon />
                {t("languageAr")}
                {locale === "ar" && <CheckIcon className="ms-auto size-4" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 text-start"
                onClick={handleLogout}
              >
                <LogOutIcon />
                {t("logout")}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
