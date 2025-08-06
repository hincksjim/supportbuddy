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
                        <Link href={item.href} legacyBehavior passHref>
                             <SidebarMenuButton
                                isActive={pathname.startsWith(item.href)}
                                tooltip={item.label}
                             >
                                <item.icon />
                                <span>{item.label}</span>
                             </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
             <SidebarMenu>
                 <SidebarMenuItem>
                     <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-2">
                        <LogOut />
                        <span>Logout</span>
                    </Button>
                 </SidebarMenuItem>
             </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  )
}
