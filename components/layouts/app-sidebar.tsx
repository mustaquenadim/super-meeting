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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: true,
    },
    {
      title: "Locations",
      url: "/admin/locations",
      icon: <MapPinIcon />,
    },
    {
      title: "Rooms",
      url: "/admin/rooms",
      icon: <DoorOpenIcon />,
      items: [
        { title: "All Rooms", url: "/admin/rooms" },
        { title: "Room Categories", url: "/admin/rooms/categories" },
        { title: "Room Amenities", url: "/admin/rooms/amenities" },
      ],
    },
    {
      title: "Bookings",
      url: "/admin/bookings",
      icon: <CalendarDaysIcon />,
    },
    // {
    //   title: "Bookings",
    //   url: "/admin/bookings",
    //   icon: <CalendarDaysIcon />,
    //   items: [
    //     { title: "All Bookings", url: "/admin/bookings" },
    //     { title: "Calendar View", url: "/admin/bookings/calendar" },
    //     { title: "New Booking", url: "/admin/bookings/new" },
    //   ],
    // },
    {
      title: "Users",
      url: "/admin/users",
      icon: <UserCogIcon />,
    },
    {
      title: "Promo Codes",
      url: "/admin/promo-codes",
      icon: <TagIcon />,
    },
    {
      title: "Audit Logs",
      url: "/admin/audit-logs",
      icon: <ClipboardListIcon />,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: <Settings2Icon />,
      items: [{ title: "General", url: "/admin/settings/general" }],
    },
  ],
  quickActions: [
    {
      name: "New Booking",
      url: "/admin/bookings/new",
      icon: <PlusCircleIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const expandedLogoSrc =
    mounted && resolvedTheme === "dark"
      ? "/brand/logo-dark.png"
      : "/brand/logo-light.png"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="relative h-10 w-full">
            <div className="absolute inset-0 group-data-[collapsible=icon]:hidden">
              <Image
                src={expandedLogoSrc}
                alt="Super Office Logo"
                fill
                className="rounded-md object-contain"
              />
            </div>
            <div className="absolute inset-0 hidden items-center justify-center group-data-[collapsible=icon]:flex">
              <Image
                src="/brand/logo-icon.png"
                alt="Super Office Logo"
                width={24}
                height={24}
                className="rounded-md object-contain"
              />
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavQuickActions actions={data.quickActions} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
