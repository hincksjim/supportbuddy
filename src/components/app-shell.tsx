"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BotMessageSquare, LayoutDashboard, FileQuestion, Milestone, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/support-chat", icon: BotMessageSquare, label: "Chat" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Activity" },
  { href: "/document-analysis", icon: FileQuestion, label: "Analysis" },
  { href: "/timeline", icon: Milestone, label: "Timeline" },
  { href: "/summary", icon: FileText, label: "Summary" },
]

export function AppShell() {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto grid h-16 max-w-md grid-cols-5 items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary",
              pathname.startsWith(item.href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
