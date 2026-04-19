"use client"

import { usePathname } from "next/navigation"

interface RouteConfig {
  title: string
  description: string
}

const routeConfigs: Record<string, RouteConfig> = {
  "/admin/dashboard": {
    title: "Dashboard",
    description: "Overview of your 3D model store performance",
  },
  "/admin/models": {
    title: "Models",
    description: "Manage all 3D models in your store",
  },
  "/admin/models/create": {
    title: "Create Model",
    description: "Add a new 3D model to the store",
  },
  "/admin/chats": {
    title: "Chats",
    description: "Manage user-to-user conversations",
  },
  "/admin/calendar": {
    title: "Calendar",
    description: "Manage events and schedule activities",
  },
  "/admin/tasks": {
    title: "Tasks",
    description: "Manage your tasks and to-do items",
  },
  "/admin/users": {
    title: "Users",
    description: "Manage user accounts and permissions",
  },
  "/admin/creators": {
    title: "Creators",
    description: "Manage content creators and their models",
  },
  "/admin/analytics": {
    title: "Analytics",
    description: "View detailed analytics and insights",
  },
  "/admin/settings": {
    title: "Settings",
    description: "Configure your store settings",
  },
  "/admin/profile": {
    title: "Profile",
    description: "Manage your personal account and contact details",
  },
  "/admin/settings/general": {
    title: "General Settings",
    description: "Configure platform-wide settings",
  },
  "/admin/legal/terms": {
    title: "Terms of Service",
    description: "Manage terms and conditions for using Store platform",
  },
  "/admin/legal/privacy": {
    title: "Privacy Policy",
    description: "Manage privacy policy and data protection information",
  },
  "/admin/legal/refund": {
    title: "Exchange and Refund Policy",
    description: "Manage exchange and refund policy for customer purchases",
  },
  "/admin/legal/cookie": {
    title: "Cookie Policy",
    description: "Manage cookie policy and tracking information",
  },
  "/admin/legal/commission": {
    title: "Commission Policy",
    description: "Manage commission rates and payment policies for creators",
  },
  "/admin/legal/copyright": {
    title: "Copyright Policy",
    description:
      "Manage copyright policy and intellectual property information",
  },
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatTitleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  return capitalizeFirst(lastSegment.replace(/[-_]/g, " "))
}

function getDefaultDescription(title: string): string {
  return `Manage ${title.toLowerCase()} for your 3D model store`
}

interface PageHeaderProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({
  title: titleProp,
  description: descriptionProp,
  action,
}: PageHeaderProps = {}) {
  const pathname = usePathname()

  // If props are provided, use them directly
  if (titleProp) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
            {titleProp}
          </h1>
          {descriptionProp && (
            <p className="mt-1 text-sm break-words text-muted-foreground sm:text-base">
              {descriptionProp}
            </p>
          )}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </div>
    )
  }

  // Check if we have a specific config for this route
  const config = routeConfigs[pathname]

  if (config) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
            {config.title}
          </h1>
          <p className="mt-1 text-sm break-words text-muted-foreground sm:text-base">
            {config.description}
          </p>
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </div>
    )
  }

  // Fallback: generate title from pathname
  const title = formatTitleFromPath(pathname)
  const description = getDefaultDescription(title)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm break-words text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  )
}
