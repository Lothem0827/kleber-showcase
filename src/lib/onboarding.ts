const STORAGE_KEY = "kleber-onboarding-v1";

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  if (navigator.webdriver) return true;
  if (window.location.search.includes("audit=1")) return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "1");
}

/** Prefer a visible tour target when the same anchor is rendered twice (xl + mobile). */
export function queryTourTarget(id: string): Element | undefined {
  const nodes = document.querySelectorAll(`[data-tour="${id}"]`);
  for (const node of nodes) {
    if (node instanceof HTMLElement && node.getClientRects().length > 0) {
      return node;
    }
  }
  return undefined;
}
