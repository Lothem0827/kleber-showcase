"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

function SvgIcon({
  src,
  alt,
  className,
  size = 16,
}: {
  src: string;
  alt: string;
  className?: string;
  size?: number;
}) {
  return (
    // Native img keeps SVGs crisp; next/image can blur vector assets
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("inline-block shrink-0 object-contain", className)}
      aria-hidden={alt.length === 0}
      draggable={false}
    />
  );
}

export function KleberIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/kleber.svg" alt="" className={className} />;
}

export function AddressIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/address.svg" alt="" className={className} />;
}

export function PhoneIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/phone.svg" alt="" className={className} />;
}

export function EmailIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/email.svg" alt="" className={className} />;
}

export function SettingsIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/settings.svg" alt="" className={className} />;
}

export function ChevronIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/chevron.svg" alt="" className={className} />;
}

export function ChevronUpDownIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/chevron-up-down.svg" alt="" className={className} />;
}

export function HamburgerIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/hamburger.svg" alt="" className={className} size={24} />;
}

export function SidebarCollapseIcon({ className }: { className?: string }) {
  return (
    <SvgIcon
      src="/icons/sidebar-collapse.svg"
      alt=""
      className={className}
      size={24}
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <SvgIcon
      src="/icons/logo-mark.svg"
      alt="Kleber"
      className={cn("dark:invert", className)}
      size={28}
    />
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-[14px] w-[141px] shrink-0", className)}>
      <Image
        src="/icons/logo-wordmark.svg"
        alt="Kleber Showcase"
        fill
        className="object-contain dark:invert"
      />
    </span>
  );
}

export function ProductIllustration({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-[138px] w-[201px] shrink-0", className)}>
      <Image
        src="/icons/product-illustration.svg"
        alt="Premium Gift Package illustration"
        fill
        className="object-contain"
      />
    </span>
  );
}

export function CardChip({ className }: { className?: string }) {
  return <SvgIcon src="/icons/card-chip.svg" alt="" className={className} size={22} />;
}
