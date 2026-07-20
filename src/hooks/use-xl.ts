import { useSyncExternalStore } from "react";

const XL_BREAKPOINT = 1280;
const XL_QUERY = `(min-width: ${XL_BREAKPOINT}px)`;

export function useIsXl() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(XL_QUERY);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(XL_QUERY).matches,
    () => false,
  );
}
