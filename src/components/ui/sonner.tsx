"use client";

import type { CSSProperties } from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--body)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          /* Success — pale mint, green border/text (matches design) */
          "--success-bg": "hsl(143, 85%, 96%)",
          "--success-border": "hsl(145, 92%, 87%)",
          "--success-text": "hsl(140, 100%, 27%)",
          /* Error — pale red */
          "--error-bg": "hsl(359, 100%, 97%)",
          "--error-border": "hsl(359, 100%, 94%)",
          "--error-text": "hsl(360, 100%, 45%)",
          /* Info — neutral charcoal */
          "--info-bg": "var(--surface)",
          "--info-border": "var(--border)",
          "--info-text": "var(--body)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast !shadow-none font-sans text-sm font-medium [box-shadow:none!important]",
          title: "font-medium",
          description: "text-sm opacity-90",
          success: "border",
          error: "border",
          info: "border",
          warning: "border",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
