"use client"

import * as React from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { PageHeader } from "@/components/layouts/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "@/i18n/navigation"
import { AppLocale } from "@/i18n/routing"
import { LOCALE_COOKIE } from "@/lib/auth/cookies"
import { cn } from "@/lib/utils"

export default function GeneralSettingsPage() {
  const t = useTranslations("settings")
  const { theme, setTheme } = useTheme()
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return

    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`
    router.refresh()
    toast.success(t("saved"))
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("appearance")}</CardTitle>
            <CardDescription>{t("appearanceDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>{t("theme")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("themeDescription")}
              </p>
              <RadioGroup
                value={theme}
                onValueChange={(value) => {
                  setTheme(value)
                  toast.success(t("saved"))
                }}
                className="grid max-w-md grid-cols-3 gap-4"
              >
                <div>
                  <Label
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary",
                      theme === "light" && "border-primary"
                    )}
                  >
                    <RadioGroupItem value="light" className="sr-only" />
                    <SunIcon className="mb-3 size-6" />
                    <span className="text-sm font-medium">{t("light")}</span>
                  </Label>
                </div>
                <div>
                  <Label
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary",
                      theme === "dark" && "border-primary"
                    )}
                  >
                    <RadioGroupItem value="dark" className="sr-only" />
                    <MoonIcon className="mb-3 size-6" />
                    <span className="text-sm font-medium">{t("dark")}</span>
                  </Label>
                </div>
                <div>
                  <Label
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary",
                      theme === "system" && "border-primary"
                    )}
                  >
                    <RadioGroupItem value="system" className="sr-only" />
                    <MonitorIcon className="mb-3 size-6" />
                    <span className="text-sm font-medium">{t("system")}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>{t("language")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("languageDescription")}
              </p>
              <RadioGroup
                value={locale}
                onValueChange={(value) => handleLocaleChange(value as AppLocale)}
                className="grid max-w-md grid-cols-2 gap-4"
              >
                <div>
                  <Label
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary",
                      locale === "en" && "border-primary"
                    )}
                  >
                    <RadioGroupItem value="en" className="sr-only" />
                    <span className="mb-3 text-2xl">🇺🇸</span>
                    <span className="text-sm font-medium">{t("en")}</span>
                  </Label>
                </div>
                <div>
                  <Label
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary",
                      locale === "ar" && "border-primary"
                    )}
                  >
                    <RadioGroupItem value="ar" className="sr-only" />
                    <span className="mb-3 text-2xl">🇸🇦</span>
                    <span className="text-sm font-medium">{t("ar")}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
