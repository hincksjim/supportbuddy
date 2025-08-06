import { AppShell } from "@/components/app-shell";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
   <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
            <AppShell />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </SidebarProvider>
      </div>
    </div>
  )
}
