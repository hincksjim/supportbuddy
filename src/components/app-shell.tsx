"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BotMessageSquare, LayoutDashboard, FileQuestion, Milestone, FileText, Landmark, Notebook, LogOut, ShieldCheck, Pill } from "lucide-react"

import { cn } from "@/lib/utils"

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
    // In a real app, you would also clear auth tokens.
    router.push("/login");
  };

  return (
    <nav className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-10 items-center justify-around">
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
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
         <button
            onClick={handleLogout}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary text-muted-foreground"
            )}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
      </div>
    </nav>
  )
}
