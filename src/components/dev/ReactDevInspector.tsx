"use client";

import { Inspector } from "react-dev-inspector";

/**
 * Click-to-source inspector for local development.
 * Toggle with Ctrl+Shift+Alt+C (Windows/Linux) or Ctrl+Shift+Cmd+C (macOS).
 */
export function ReactDevInspector() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <Inspector />;
}
