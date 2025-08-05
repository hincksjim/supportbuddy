
"use client"

import { useState, useEffect } from "react"
import { Landmark, Briefcase, HandCoins } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function FinancePage() {
  const [employmentStatus, setEmploymentStatus] = useState<string>("")
  const [benefits, setBenefits] = useState<string[]>([])

  useEffect(() => {
    try {
      const storedStatus = localStorage.getItem("employmentStatus")
      if (storedStatus) {
        // Capitalize first letter for display
        setEmploymentStatus(storedStatus.charAt(0).toUpperCase() + storedStatus.slice(1).replace(/-/g, ' '))
      }

      const storedBenefits = localStorage.getItem("userBenefits")
      if (storedBenefits) {
        const parsedBenefits = JSON.parse(storedBenefits)
        if(Array.isArray(parsedBenefits)) {
          setBenefits(parsedBenefits)
        }
      }
    } catch (error) {
      console.error("Failed to load financial data from localStorage", error)
    }
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Financials</h1>
          <p className="text-muted-foreground">
            A summary of your current financial situation.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-primary" />
                    Employment
                </CardTitle>
                <CardDescription>Your current employment status.</CardDescription>
            </CardHeader>
            <CardContent>
                {employmentStatus ? (
                     <p className="text-2xl font-semibold">{employmentStatus}</p>
                ) : (
                    <p className="text-muted-foreground">No status provided.</p>
                )}
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HandCoins className="w-6 h-6 text-primary" />
                    Benefits
                </CardTitle>
                <CardDescription>Benefits you have indicated you receive.</CardDescription>
            </CardHeader>
            <CardContent>
                {benefits.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">No benefits selected.</p>
                )}
            </CardContent>
        </Card>
      </div>
      
      <div className="text-center py-20 rounded-lg border-2 border-dashed">
            <Landmark className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">More Financial Tools Coming Soon</h2>
            <p className="text-muted-foreground mt-2">This section is under construction.</p>
        </div>
    </div>
  )
}
