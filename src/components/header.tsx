
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Logo } from "@/components/icons"
import { Button } from "@/components/ui/button"

interface UserData {
  name?: string;
}

export function Header() {
  const [userData, setUserData] = useState<UserData>({})
  const router = useRouter()

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail")
    if (email) {
      const storedData = localStorage.getItem(`userData_${email}`)
      if (storedData) {
        setUserData(JSON.parse(storedData))
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUserEmail")
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 font-semibold">
        <Logo className="h-6 w-6 text-primary" />
        <span className="font-headline">Support Buddy</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <p className="text-sm text-muted-foreground hidden sm:block">
          Welcome, {userData.name || "User"}
        </p>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
