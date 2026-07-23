"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useGroupRef } from "react-resizable-panels";
import { AppShell } from "@/components/layout/AppShell";
import {
  RegisterForm,
  type RegisterFormMode,
} from "@/components/register/RegisterForm";
import { ShowcaseScenarioProvider } from "@/components/showcase/ShowcaseScenarioProvider";
import { ValidationWorkspaceSkeleton } from "@/components/register/ValidationWorkspaceSkeleton";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsXl } from "@/hooks/use-xl";
import {
  getServerApiSettings,
  loadApiSettings,
  subscribeApiSettings,
} from "@/lib/kleber/settings";
import type { ApiSettingsState, ValidationStepResult } from "@/lib/kleber/types";

const DesktopValidationLayout = dynamic(
  () =>
    import("@/components/register/DesktopValidationLayout").then(
      (module) => module.DesktopValidationLayout,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-0 flex-1 p-6">
        <ValidationWorkspaceSkeleton />
      </div>
    ),
  },
);

const ApiMethodsPanel = dynamic(
  () =>
    import("@/components/register/ApiMethodsPanel").then(
      (module) => module.ApiMethodsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[200px] animate-pulse rounded-md bg-muted mx-6 mb-6"
        aria-busy="true"
        aria-label="Loading API methods"
      />
    ),
  },
);

const ShowcaseTour = dynamic(
  () =>
    import("@/components/onboarding/ShowcaseTour").then(
      (module) => module.ShowcaseTour,
    ),
  { ssr: false },
);

const ApiSettings = dynamic(
  () =>
    import("@/components/register/ApiSettings").then(
      (module) => module.ApiSettings,
    ),
  { ssr: false },
);

export function ValidationPageShell({
  header,
  mode,
  showSideCards: enableSideCards = false,
  defaultTestApiKey = "",
}: {
  /** Server-rendered page heading for fast LCP. */
  header: ReactNode;
  mode: RegisterFormMode;
  showSideCards?: boolean;
  /** Prefills API Settings when no key is saved (from server `KLEBER_KEY`). */
  defaultTestApiKey?: string;
}) {
  const isXl = useIsXl();
  const storedSettings = useSyncExternalStore(
    subscribeApiSettings,
    loadApiSettings,
    getServerApiSettings,
  );
  const savedSettings = useMemo(
    () => ({
      ...storedSettings,
      testApiKey:
        storedSettings.testApiKey.trim() ||
        defaultTestApiKey ||
        storedSettings.testApiKey,
    }),
    [storedSettings, defaultTestApiKey],
  );
  const [draftSettings, setDraftSettings] = useState<ApiSettingsState | null>(
    null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<
    ValidationStepResult[]
  >([]);
  const groupRef = useGroupRef();
  const previousLayoutRef = useRef<{ workspace: number; api: number } | null>(
    null,
  );

  const draft = draftSettings ?? savedSettings;
  const missingApiKey = !savedSettings.testApiKey.trim();
  const enableScenarios = mode === "full" && enableSideCards;

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setDraftSettings(null);
  }, []);

  const ensureApiAtLeastHalf = useCallback(() => {
    const current = groupRef.current?.getLayout();
    const apiSize = current?.api;

    if (apiSize != null && apiSize >= 50) {
      previousLayoutRef.current = null;
      return;
    }

    if (current?.workspace != null && current?.api != null) {
      previousLayoutRef.current = {
        workspace: current.workspace,
        api: current.api,
      };
    }
    groupRef.current?.setLayout({ workspace: 50, api: 50 });
  }, [groupRef]);

  const restorePreviousSplit = useCallback(() => {
    const previous = previousLayoutRef.current;
    if (!previous) return;

    groupRef.current?.setLayout(previous);
    previousLayoutRef.current = null;
  }, [groupRef]);

  const workspace = isXl ? (
    <div className="h-full min-h-0 flex-1">
      <DesktopValidationLayout
        header={header}
        mode={mode}
        toggles={savedSettings.toggles}
        requestKey={savedSettings.testApiKey}
        validationResults={validationResults}
        onValidationResultsChange={setValidationResults}
        onMissingApiKey={openSettings}
        settingsOpen={settingsOpen}
        enableSideCards={enableSideCards}
        groupRef={groupRef}
        onExpandWidth={ensureApiAtLeastHalf}
        onCollapseWidth={restorePreviousSplit}
      />
    </div>
  ) : (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="p-6">
        {header}
        <RegisterForm
          mode={mode}
          toggles={savedSettings.toggles}
          requestKey={savedSettings.testApiKey}
          onValidationResultsChange={setValidationResults}
          onMissingApiKey={openSettings}
          settingsOpen={settingsOpen}
        />
      </div>
      <ApiMethodsPanel
        results={validationResults}
        mode={mode}
        toggles={savedSettings.toggles}
        layout="stack"
      />
    </div>
  );

  return (
    <AppShell
      settingsOpen={settingsOpen}
      onOpenSettings={openSettings}
      onCloseSettings={closeSettings}
    >
      {enableScenarios ? (
        <ShowcaseScenarioProvider>{workspace}</ShowcaseScenarioProvider>
      ) : (
        workspace
      )}

      {mode === "full" ? <ShowcaseTour /> : null}

      <Drawer
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (!open) setDraftSettings(null);
        }}
        swipeDirection="left"
      >
        <DrawerContent
          overlayClassName="bg-[rgba(11,11,12,0.4)]"
          className="[--drawer-inset:12px] [--drawer-bleed-background:transparent] [--bleed:0px] after:hidden m-0 h-auto max-h-none overflow-hidden bg-muted text-foreground data-[swipe-axis=x]:!inset-y-auto data-[swipe-axis=x]:!top-[12px] data-[swipe-axis=x]:!bottom-[12px] data-[swipe-axis=x]:[--drawer-content-width:min(532px,calc(100%-24px))] data-[swipe-axis=x]:sm:[--drawer-content-width:532px] data-[swipe-direction=left]:!left-[12px] rounded-[12px] data-[swipe-direction=left]:rounded-[12px] data-[swipe-direction=left]:border-0"
        >
          <ApiSettings
            draft={draft}
            saved={savedSettings}
            missingApiKey={missingApiKey}
            autoFocusKey={settingsOpen && missingApiKey}
            onDraftChange={setDraftSettings}
            onDiscard={closeSettings}
            onSavedChange={() => {
              setDraftSettings(null);
              setSettingsOpen(false);
            }}
          />
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
}
