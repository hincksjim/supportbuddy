
"use client"

import { Landmark } from "lucide-react"

export default function FinancePage() {
  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Financials</h1>
          <p className="text-muted-foreground">
            Keep track of your finances.
          </p>
        </div>
      </div>
      
      <div className="text-center py-20 rounded-lg border-2 border-dashed">
            <Landmark className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Coming Soon</h2>
            <p className="text-muted-foreground mt-2">This section is under construction.</p>
        </div>
    </div>
  )
}
