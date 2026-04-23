"use client"

import * as React from "react"

import { NavMain } from "@/components/layouts/nav-main"
import { NavUser } from "@/components/layouts/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  MapPinIcon,
  DoorOpenIcon,
  CalendarDaysIcon,
  UserCogIcon,
  ClipboardListIcon,
  Settings2Icon,
  TagIcon,
  PlusCircleIcon,
} from "lucide-react"
import { NavQuickActions } from "@/components/layouts/nav-quick-actions"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("sidebar")
  const locale = useLocale()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const side = locale === "ar" ? "right" : "left"

  const navMain = React.useMemo(
    () => [
      {
        title: t("nav.dashboard"),
        url: "/admin/dashboard",
        icon: <LayoutDashboardIcon />,
        isActive: true,
      },
      {
        title: t("nav.locations"),
        url: "/admin/locations",
        icon: <MapPinIcon />,
      },
      {
        title: t("nav.rooms"),
        url: "/admin/rooms",
        icon: <DoorOpenIcon />,
        items: [
          { title: t("nav.roomsAll"), url: "/admin/rooms" },
          {
            title: t("nav.roomsCategories"),
            url: "/admin/rooms/categories",
          },
          {
            title: t("nav.roomsAmenities"),
            url: "/admin/rooms/amenities",
          },
        ],
      },
      {
        title: t("nav.bookings"),
        url: "/admin/bookings",
        icon: <CalendarDaysIcon />,
      },
      {
        title: t("nav.users"),
        url: "/admin/users",
        icon: <UserCogIcon />,
      },
      {
        title: t("nav.promoCodes"),
        url: "/admin/promo-codes",
        icon: <TagIcon />,
      },
      {
        title: t("nav.auditLogs"),
        url: "/admin/audit-logs",
        icon: <ClipboardListIcon />,
      },
      {
        title: t("nav.settings"),
        url: "/admin/settings",
        icon: <Settings2Icon />,
      },
    ],
    [t]
  )

  const quickActions = React.useMemo(
    () => [
      {
        name: t("quickActions.newBooking"),
        url: "/admin/bookings/new",
        icon: <PlusCircleIcon />,
      },
    ],
    [t]
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const expandedLogoSrc =
    mounted && resolvedTheme === "dark"
      ? "/brand/logo-dark.png"
      : "/brand/logo-light.png"

  return (
    <Sidebar side={side} collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="relative h-10 w-full">
            <div className="absolute inset-0 group-data-[collapsible=icon]:hidden">
              <Image
                src={expandedLogoSrc}
                alt={t("logoAlt")}
                fill
                className="rounded-md object-contain"
              />
            </div>
            <div className="absolute inset-0 hidden items-center justify-center group-data-[collapsible=icon]:flex">
              <Image
                src="/brand/logo-icon.png"
                alt={t("logoAlt")}
                width={24}
                height={24}
                className="rounded-md object-contain"
              />
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavQuickActions actions={quickActions} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
