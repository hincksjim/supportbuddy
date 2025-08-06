import { AppShell } from "@/components/app-shell";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AppShell />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    </SidebarProvider>
  )
}
