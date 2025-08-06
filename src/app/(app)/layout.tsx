import { AppShell } from "@/components/app-shell";
import { Header } from "@/components/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <AppShell />
    </div>
  )
}
