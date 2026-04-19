"use client"

import * as React from "react"
import { SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layouts/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type GeneralSettingsForm = {
  companyName: string
  companyWebsite: string
  supportEmail: string
  supportPhone: string
  defaultTimezone: string
  currency: string
  dateFormat: string
  timeFormat: string
  autoConfirmBookings: boolean
  sendEmailConfirmations: boolean
  enableWaitlist: boolean
  enableRecurringBookings: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
}

const INITIAL_SETTINGS: GeneralSettingsForm = {
  companyName: "Super Office",
  companyWebsite: "https://superoffice.com",
  supportEmail: "support@superoffice.com",
  supportPhone: "+1 (555) 000-0000",
  defaultTimezone: "America/New_York",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  autoConfirmBookings: false,
  sendEmailConfirmations: true,
  enableWaitlist: true,
  enableRecurringBookings: true,
  maintenanceMode: false,
  maintenanceMessage: "Platform is undergoing scheduled maintenance...",
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = React.useState(INITIAL_SETTINGS)
  const [isSaving, setIsSaving] = React.useState(false)

  const updateField = React.useCallback(
    <K extends keyof GeneralSettingsForm>(
      key: K,
      value: GeneralSettingsForm[K]
    ) => {
      setSettings((current) => ({ ...current, [key]: value }))
    },
    []
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    // Keep this UI interactive until a persisted settings endpoint is wired in.
    await new Promise((resolve) => window.setTimeout(resolve, 400))

    toast.success("General settings saved locally.")
    setIsSaving(false)
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <PageHeader
        title="General Settings"
        description="Configure platform-wide settings"
        action={
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            Save Changes
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsCard
          title="Company Information"
          description="Basic company and platform details"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="company-name">Company Name</FieldLabel>
              <Input
                id="company-name"
                value={settings.companyName}
                onChange={(event) =>
                  updateField("companyName", event.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="company-website">Company Website</FieldLabel>
              <Input
                id="company-website"
                type="url"
                value={settings.companyWebsite}
                onChange={(event) =>
                  updateField("companyWebsite", event.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="support-email">Support Email</FieldLabel>
              <Input
                id="support-email"
                type="email"
                value={settings.supportEmail}
                onChange={(event) =>
                  updateField("supportEmail", event.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="support-phone">Support Phone</FieldLabel>
              <Input
                id="support-phone"
                type="tel"
                value={settings.supportPhone}
                onChange={(event) =>
                  updateField("supportPhone", event.target.value)
                }
              />
            </Field>
          </FieldGroup>
        </SettingsCard>
      </div>
    </form>
  )
}
