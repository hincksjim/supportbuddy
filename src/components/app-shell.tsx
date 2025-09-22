
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BotMessageSquare, LayoutDashboard, FileQuestion, Milestone, FileText, Landmark, Notebook, LogOut, ShieldCheck, Pill, Gavel, User, Settings, CalendarDays, Salad } from "lucide-react"

import { cn } from "@/lib/utils"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar"
import { Logo } from "@/components/icons"
import { Button } from "@/components/ui/button"


const navItems = [
  { href: "/support-chat", icon: BotMessageSquare, label: "Chat" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Activity" },
  { href: "/document-analysis", icon: FileQuestion, label: "Analysis" },
  { href: "/timeline", icon: Milestone, label: "Timeline" },
  { href: "/summary", icon: FileText, label: "Summary" },
  { href: "/diary", icon: Notebook, label: "Diary" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/medication", icon: Pill, label: "Meds" },
  { href: "/dietary-menu", icon: Salad, label: "Dietary" },
  { href: "/finance", icon: Landmark, label: "Finance" },
  { href: "/benefits-checker", icon: Gavel, label: "Benefits" },
  { href: "/just-in-case", icon: ShieldCheck, label: "Just In Case"},
  { href: "/profile", icon: User, label: "Profile"},
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function AppShell() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon">
        <SidebarHeader className="border-b">
           <div className="flex items-center gap-2">
            <Logo className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold">Support Buddy</span>
            <SidebarTrigger className="ml-auto" />
           </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                         <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(item.href)}
                            tooltip={item.label}
                         >
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                         </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
             <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={() => {
                            localStorage.removeItem("currentUserEmail");
                            router.push("/login");
                        }}
                        tooltip="Logout"
                        >
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
             </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  )
}
