"use client"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar"
import {
  BotMessageSquare,
  LayoutDashboard,
  LogOut,
  FileQuestion,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import React, { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarFemale, AvatarMale, Logo } from "./icons"
import { Button } from "./ui/button"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState("User")
  const [buddyAvatar, setBuddyAvatar] = useState("female")

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedAvatar = localStorage.getItem("buddyAvatar")
    if (storedName) {
      setUserName(storedName)
    }
    if (storedAvatar) {
      setBuddyAvatar(storedAvatar)
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userName")
      localStorage.removeItem("buddyAvatar")
    }
    router.push("/login")
  }

  const BuddyAvatar = buddyAvatar === "male" ? AvatarMale : AvatarFemale

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline">Support Buddy</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard"
                asChild
                isActive={pathname === "/dashboard"}
                tooltip="Dashboard"
              >
                <a href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/support-chat"
                asChild
                isActive={pathname === "/support-chat"}
                tooltip="Support Chat"
              >
                <a href="/support-chat">
                  <BotMessageSquare />
                  <span>Support Chat</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/document-analysis"
                asChild
                isActive={pathname === "/document-analysis"}
                tooltip="Document Analysis"
              >
                <a href="/document-analysis">
                  <FileQuestion />
                  <span>Document Analysis</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-accent">
                <div className="bg-accent/50 w-full h-full flex items-center justify-center">
                    <BuddyAvatar className="w-6 h-6" />
                </div>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{userName}</span>
                <span className="text-xs text-muted-foreground">Your Buddy</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2 font-semibold">
            <Logo className="w-6 h-6 text-primary" />
            <span className="font-headline">Support Buddy</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
