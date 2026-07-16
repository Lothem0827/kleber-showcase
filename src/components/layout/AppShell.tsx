"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

interface AppShellProps {
  settingsOpen: boolean;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  children: React.ReactNode;
}

export function AppShell({
  settingsOpen,
  onOpenSettings,
  onCloseSettings,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <TopHeader />
      <div className="relative flex min-h-0 w-full flex-1">
        <Sidebar
          settingsOpen={settingsOpen}
          onOpenSettings={onOpenSettings}
          onCloseSettings={onCloseSettings}
        />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
