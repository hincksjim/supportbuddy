
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
    <header className="sticky top-0 z-10 grid h-14 grid-cols-3 items-center gap-4 border-b border-primary/20 bg-primary px-4 text-primary-foreground backdrop-blur-sm">
      <div className="flex items-center gap-2 font-semibold">
        <Logo className="h-6 w-6" />
        <span className="font-headline hidden sm:inline-block">Support Buddy</span>
      </div>
      <div className="text-center">
        <p className="text-sm hidden sm:block">
          Welcome, {userData.name || "User"}
        </p>
      </div>
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="hover:bg-primary/80 hover:text-primary-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
