import { AppHeader } from "@/app/ads/_components/app-header";
import { AppSidebar } from "@/app/ads/_components/app-sidebar";
import { ShellFooter } from "@/app/ads/_components/shell-footer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-y-auto bg-muted/30">
              {children}
            </main>
            <ShellFooter />
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
