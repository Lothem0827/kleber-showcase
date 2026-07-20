"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { buttonVariants } from "@/components/ui/button";
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
  queryTourTarget,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

const XL_QUERY = "(min-width: 80rem)";

type TourDef = {
  id: string;
  desktopOnly?: boolean;
  title: string;
  description: string;
  side: NonNullable<DriveStep["popover"]>["side"];
};

const TOUR_DEFS: TourDef[] = [
  {
    id: "nav-validations",
    title: "Validation pages",
    description:
      "Switch between the full Kleber Showcase and focused address, phone, or email demos.",
    side: "right",
  },
  {
    id: "form-details",
    title: "Enter customer details",
    description:
      "Add an email, phone number, and address — Kleber validates them automatically as you go.",
    side: "bottom",
  },
  {
    id: "api-methods",
    title: "API Methods",
    description:
      "Live Kleber responses appear here. Expand a method to inspect the table or JSON payload.",
    side: "left",
  },
  {
    id: "resize-handle",
    desktopOnly: true,
    title: "Resize the workspace",
    description:
      "Drag this handle to give more space to the form or the API results panel.",
    side: "left",
  },
  {
    id: "api-settings",
    title: "API Settings",
    description:
      "Add your Kleber API key and choose which methods appear in the showcase.",
    side: "right",
  },
];

function buildSteps(isDesktop: boolean): DriveStep[] {
  return TOUR_DEFS.filter((def) => !def.desktopOnly || isDesktop)
    .filter((def) => queryTourTarget(def.id) != null)
    .map((def) => ({
      element: () => queryTourTarget(def.id) as Element,
      popover: {
        title: def.title,
        description: def.description,
        side: def.side,
      },
    }));
}

function styleTourPopover(
  popover: {
    wrapper: HTMLElement;
    title: HTMLElement;
    description: HTMLElement;
    progress: HTMLElement;
    footer: HTMLElement;
    footerButtons: HTMLElement;
    nextButton: HTMLButtonElement;
    previousButton: HTMLButtonElement;
    closeButton: HTMLButtonElement;
  },
  destroy: () => void,
) {
  // Card shell — match RegisterForm / shadcn Card surfaces
  popover.wrapper.className = cn(
    "driver-popover kleber-tour-popover",
    "rounded-xl border border-border bg-card text-card-foreground shadow-none",
  );

  // Title / description — match Address Details CardTitle + CardDescription
  popover.title.className = cn(
    "driver-popover-title",
    "text-base font-semibold text-heading",
  );
  popover.description.className = cn(
    "driver-popover-description",
    "text-sm text-body",
  );
  popover.progress.className = cn(
    "driver-popover-progress-text",
    "text-xs font-medium uppercase tracking-[0.18em] text-body",
  );

  // Buttons — reuse shadcn buttonVariants (omit driver footer-btn classes so
  // their `all: unset` rules do not wipe utilities)
  popover.nextButton.className = cn(
    buttonVariants({ variant: "default", size: "default" }),
    "driver-popover-next-btn",
  );
  popover.previousButton.className = cn(
    buttonVariants({ variant: "outline", size: "default" }),
    "driver-popover-prev-btn",
  );
  popover.closeButton.classList.add("hidden");

  // Keep Skip after nav buttons in the DOM so step changes don't focus it
  // first; flex order still places it left of Back/Next.
  let skip = popover.footer.querySelector<HTMLButtonElement>(".kleber-tour-skip");
  if (!skip) {
    skip = document.createElement("button");
    skip.type = "button";
    skip.textContent = "Skip intro";
    skip.addEventListener("click", destroy);
    popover.footer.appendChild(skip);
  }
  skip.className = cn(
    buttonVariants({ variant: "link", size: "default" }),
    "kleber-tour-skip",
  );
  skip.tabIndex = -1;

  // Defer past driver.js's own focus handling so Next stays focused after step changes
  window.requestAnimationFrame(() => {
    popover.nextButton.focus({ preventScroll: true });
  });
}

export function ShowcaseTour() {
  useEffect(() => {
    if (hasCompletedOnboarding()) return;

    let cancelled = false;
    let activeDriver: ReturnType<typeof driver> | null = null;

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled || hasCompletedOnboarding()) return;

        const isDesktop = window.matchMedia(XL_QUERY).matches;
        const steps = buildSteps(isDesktop);
        if (steps.length === 0) return;

        activeDriver = driver({
          showProgress: true,
          animate: true,
          smoothScroll: true,
          allowClose: false,
          overlayOpacity: 0.45,
          stagePadding: 8,
          stageRadius: 12,
          disableActiveInteraction: true,
          skipMissingElement: true,
          popoverClass: "kleber-tour-popover",
          showButtons: ["next", "previous"],
          nextBtnText: "Next",
          doneBtnText: "Done",
          prevBtnText: "Back",
          progressText: "{{current}} / {{total}}",
          steps,
          onHighlighted: (element) => {
            if (!(element instanceof HTMLElement)) return;
            element.removeAttribute("aria-haspopup");
            element.removeAttribute("aria-expanded");
            element.removeAttribute("aria-controls");
          },
          onDestroyed: () => {
            if (!cancelled) markOnboardingComplete();
          },
          onPopoverRender: (popover, { driver: active }) => {
            styleTourPopover(popover, () => active.destroy());
          },
        });

        activeDriver.drive();
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      activeDriver?.destroy();
    };
  }, []);

  return null;
}
