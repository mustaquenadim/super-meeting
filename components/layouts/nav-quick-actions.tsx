"use client"

import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

export function NavQuickActions({
  actions,
}: {
  actions: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const t = useTranslations("sidebar.group")

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("quickActions")}</SidebarGroupLabel>
      <SidebarMenu>
        {actions.map((action) => (
          <SidebarMenuItem key={action.url}>
            <SidebarMenuButton asChild tooltip={action.name}>
              <Link href={action.url}>
                {action.icon}
                <span>{action.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
