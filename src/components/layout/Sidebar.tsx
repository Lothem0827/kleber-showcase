"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AddressIcon,
  ChevronIcon,
  EmailIcon,
  KleberIcon,
  PhoneIcon,
  SettingsIcon,
} from "@/components/icons/figma-icons";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarProps {
  settingsOpen: boolean;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}

const showcaseItems = [
  {
    id: "register" as const,
    href: "/showcase",
    label: "Kleber Showcase",
    icon: KleberIcon,
  },
  {
    id: "address" as const,
    href: "/address-validation",
    label: "Address Validation",
    icon: AddressIcon,
  },
  {
    id: "phone" as const,
    href: "/phone-validation",
    label: "Phone Validation",
    icon: PhoneIcon,
  },
  {
    id: "email" as const,
    href: "/email-validation",
    label: "Email Validation",
    icon: EmailIcon,
  },
];

export function Sidebar({
  settingsOpen,
  onOpenSettings,
  onCloseSettings,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <SidebarRoot collapsible="icon" className="border-r border-sidebar-border ">
      <SidebarContent>
        <SidebarGroup data-tour="nav-validations">
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-[0.18em] text-charcoal-300">
            Validations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {showcaseItems.map((item) => {
                const isActive = !settingsOpen && pathname === item.href;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive}
                      render={
                        <Link href={item.href} onClick={onCloseSettings} />
                      }
                      className={cn(
                        isActive
                          ? "bg-brand-subtle text-brand data-active:bg-brand-subtle data-active:text-brand"
                          : "text-body",
                      )}
                    >
                      <Icon className="size-4.5 text-current" />
                      <span>{item.label}</span>
                      {isActive ? (
                        <ChevronIcon className="ml-auto size-4 text-current group-data-[collapsible=icon]:hidden" />
                      ) : null}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-[0.18em] text-charcoal-300">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  data-tour="api-settings"
                  tooltip="API Settings"
                  isActive={settingsOpen}
                  onClick={onOpenSettings}
                  className={cn(
                    settingsOpen
                      ? "bg-brand-subtle text-brand data-active:bg-brand-subtle data-active:text-brand"
                      : "text-body",
                  )}
                >
                  <SettingsIcon className="size-4 text-current" />
                  <span>API Settings</span>
                  {settingsOpen ? (
                    <ChevronIcon className="ml-auto size-4 text-current group-data-[collapsible=icon]:hidden" />
                  ) : null}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  );
}
