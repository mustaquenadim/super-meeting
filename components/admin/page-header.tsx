"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AdminPageHeaderAction = {
  label: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  disabled?: boolean
}

export interface AdminPageHeaderProps {
  title: string
  description?: string
  action?: AdminPageHeaderAction
  secondaryAction?: AdminPageHeaderAction
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight wrap-break-word sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm wrap-break-word text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
        {secondaryAction ? (
          secondaryAction.href ? (
            <Button variant="outline" asChild disabled={secondaryAction.disabled}>
              <Link href={secondaryAction.href} className="gap-2">
                {secondaryAction.icon}
                {secondaryAction.label}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={secondaryAction.disabled}
              onClick={secondaryAction.onClick}
              className="gap-2"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )
        ) : null}
        {action ? (
          action.href ? (
            <Button asChild disabled={action.disabled}>
              <Link href={action.href} className="gap-2">
                {action.icon}
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              className="gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          )
        ) : null}
      </div>
    </div>
  )
}
