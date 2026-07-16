"use client";

import Image from "next/image";
import { LogoMark, LogoWordmark } from "@/components/icons/figma-icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopHeader() {
  return (
    <header className="shrink-0 border-b border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between px-2 py-4 sm:px-4">
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-between gap-5 rounded-lg">
            <div className="flex items-center gap-2">
              <LogoMark />
              <LogoWordmark />
            </div>
            <SidebarTrigger className="text-icon hover:bg-brand-subtle" />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl pr-3">
          <ThemeToggle />
          <div className="relative size-8 overflow-hidden rounded-full border border-border bg-muted">
            <Image
              src="/icons/support-avatar.png"
              alt="Support Specialist"
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-heading">
              Need GBG support?
            </p>
            <p className="text-xs font-medium text-body">
              Ask a Support Specialist
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
