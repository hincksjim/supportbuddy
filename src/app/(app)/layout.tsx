import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <AppShell />
    </div>
  )
}
