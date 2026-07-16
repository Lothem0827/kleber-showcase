"use client";

import * as React from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type GroupProps,
  type LayoutChangedMeta,
  type Layout,
  type LayoutStorage,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

const noopStorage: LayoutStorage = {
  getItem: () => null,
  setItem: () => {},
};

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

type ResizablePanelGroupProps = GroupProps & {
  autoSaveId?: string;
};

function ResizablePanelGroupInner({
  autoSaveId,
  className,
  defaultLayout: defaultLayoutProp,
  onLayoutChanged,
  orientation = "horizontal",
  storage,
  ...props
}: ResizablePanelGroupProps & { storage: LayoutStorage }) {
  const { defaultLayout, onLayoutChanged: persistLayout } = useDefaultLayout({
    id: autoSaveId ?? "ephemeral",
    storage,
    onlySaveAfterUserInteractions: true,
  });

  const handleLayoutChanged = React.useCallback(
    (layout: Layout, meta: LayoutChangedMeta) => {
      if (autoSaveId) {
        persistLayout(layout, meta);
      }
      onLayoutChanged?.(layout, meta);
    },
    [autoSaveId, onLayoutChanged, persistLayout],
  );

  return (
    <Group
      data-slot="resizable-panel-group"
      orientation={orientation}
      className={cn(
        "flex h-full w-full",
        orientation === "vertical" && "flex-col",
        className,
      )}
      defaultLayout={defaultLayout ?? defaultLayoutProp}
      onLayoutChanged={handleLayoutChanged}
      {...props}
    />
  );
}

function ResizablePanelGroup({
  autoSaveId,
  ...props
}: ResizablePanelGroupProps) {
  // false on server + first client render; true after hydration — avoids localStorage mismatch
  const mounted = React.useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <ResizablePanelGroupInner
      key={mounted ? "client" : "server"}
      autoSaveId={autoSaveId}
      storage={mounted && autoSaveId ? localStorage : noopStorage}
      {...props}
    />
  );
}

function ResizablePanel({ className, style, ...props }: PanelProps) {
  return (
    <Panel
      data-slot="resizable-panel"
      // Library defaults overflow:auto via inline style (wins over Tailwind).
      // Force hidden so each panel owns scroll via its own inner container.
      className={cn(
        "flex min-h-0 min-w-0 flex-col [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      style={{ overflow: "hidden", ...style }}
      {...props}
    />
  );
}

function ResizableHandle({ className, ...props }: SeparatorProps) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-transparent",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border after:transition-colors",
        "hover:after:bg-brand data-[separator=hover]:after:bg-brand/60 data-[separator=active]:after:bg-brand",
        "focus-visible:outline-none focus-visible:after:bg-brand",
        className,
      )}
      {...props}
    />
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
