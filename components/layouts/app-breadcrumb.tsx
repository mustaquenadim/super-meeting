"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatBreadcrumbLabel(segment: string): string {
  // Replace hyphens and underscores with spaces and capitalize
  return capitalizeFirst(segment.replace(/[-_]/g, " "))
}

export function AppBreadcrumb() {
  const t = useTranslations("breadcrumbs")
  const pathname = usePathname()

  // Remove the leading slash and split into segments
  const segments = pathname.split("/").filter(Boolean)

  // If we're at the root admin path, show just "Admin"
  if (
    segments.length === 0 ||
    (segments.length === 1 && segments[0] === "admin")
  ) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{t("admin")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const isLast = index === segments.length - 1
    const href = "/" + segments.slice(0, index + 1).join("/")
    
    // Try to translate the segment, fallback to formatted label if not found
    // Note: next-intl t() returns the key itself if missing by default in most configs
    const label = t(segment) === `breadcrumbs.${segment}` || t(segment) === segment
      ? formatBreadcrumbLabel(segment)
      : t(segment)

    return {
      label,
      href,
      isLast,
    }
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
