"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BotMessageSquare, LayoutDashboard, FileQuestion, Milestone, FileText, Landmark, Notebook, LogOut, ShieldCheck, Pill } from "lucide-react"

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
  { href: "/finance", icon: Landmark, label: "Finance" },
  { href: "/medication", icon: Pill, label: "Meds" },
  { href: "/just-in-case", icon: ShieldCheck, label: "Goodbye"},
]

export function AppShell() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push("/login");
  };

  return (
    <Sidebar>
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
             <div className="flex items-center justify-center p-2 group-data-[collapsible=icon]:hidden">
                <SidebarTrigger />
             </div>
             <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href="/login" passHref legacyBehavior>
                         <SidebarMenuButton
                            onClick={() => localStorage.removeItem("currentUserEmail")}
                            tooltip="Logout"
                         >
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
             </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  )
}
