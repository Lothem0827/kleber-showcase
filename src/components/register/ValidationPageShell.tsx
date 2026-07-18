"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useGroupRef } from "react-resizable-panels";
import { AppShell } from "@/components/layout/AppShell";
import { ShowcaseTour } from "@/components/onboarding/ShowcaseTour";
import { ApiMethodsPanel } from "@/components/register/ApiMethodsPanel";
import { ApiSettings } from "@/components/register/ApiSettings";
import { PaymentMethodCard } from "@/components/register/PaymentMethodCard";
import { ProductCard } from "@/components/register/ProductCard";
import {
  RegisterForm,
  type RegisterFormMode,
} from "@/components/register/RegisterForm";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DEFAULT_API_SETTINGS,
  loadApiSettings,
  subscribeApiSettings,
} from "@/lib/kleber/settings";
import type { ApiSettingsState, ValidationStepResult } from "@/lib/kleber/types";

const SIDE_CARDS_HIDE_AT = 50;

function shouldHideSideCards(workspace?: number) {
  if (workspace == null) return false;
  return workspace <= SIDE_CARDS_HIDE_AT;
}

function ValidationWorkspace({
  title,
  subtitle,
  mode,
  toggles,
  requestKey,
  onValidationResultsChange,
  showSideCards = true,
}: {
  title: string;
  subtitle: string;
  mode: RegisterFormMode;
  toggles: ApiSettingsState["toggles"];
  requestKey?: string;
  onValidationResultsChange: (results: ValidationStepResult[]) => void;
  showSideCards?: boolean;
}) {
  return (
    <>
      <div className="mb-5 space-y-0.5">
        <h1 className="text-2xl font-semibold text-heading">{title}</h1>
        <p className="text-base text-body">{subtitle}</p>
      </div>
      <div
        className={
          showSideCards
            ? "grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"
            : "grid items-start gap-5"
        }
      >
        <RegisterForm
          mode={mode}
          toggles={toggles}
          requestKey={requestKey}
          onValidationResultsChange={onValidationResultsChange}
        />
        {showSideCards ? (
          <div className="grid grid-rows-2 gap-5 [grid-template-rows:1fr_1fr]">
            <ProductCard />
            <PaymentMethodCard />
          </div>
        ) : null}
      </div>
    </>
  );
}

export function ValidationPageShell({
  title,
  subtitle,
  mode,
  showSideCards: enableSideCards = false,
}: {
  title: string;
  subtitle: string;
  mode: RegisterFormMode;
  showSideCards?: boolean;
}) {
  const savedSettings = useSyncExternalStore(
    subscribeApiSettings,
    loadApiSettings,
    () => DEFAULT_API_SETTINGS,
  );
  const [draftSettings, setDraftSettings] = useState<ApiSettingsState | null>(
    null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<
    ValidationStepResult[]
  >([]);
  const [showSideCards, setShowSideCards] = useState(enableSideCards);
  const groupRef = useGroupRef();
  const previousLayoutRef = useRef<{ workspace: number; api: number } | null>(
    null,
  );

  const draft = draftSettings ?? savedSettings;

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setDraftSettings(null);
  }, []);

  const syncSideCardsVisibility = useCallback(
    (workspace?: number) => {
      if (!enableSideCards) {
        setShowSideCards(false);
        return;
      }
      setShowSideCards(!shouldHideSideCards(workspace));
    },
    [enableSideCards],
  );

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
    setShowSideCards(false);
  }, [groupRef]);

  const restorePreviousSplit = useCallback(() => {
    const previous = previousLayoutRef.current;
    if (!previous) return;

    groupRef.current?.setLayout(previous);
    syncSideCardsVisibility(previous.workspace);
    previousLayoutRef.current = null;
  }, [groupRef, syncSideCardsVisibility]);

  return (
    <AppShell
      settingsOpen={settingsOpen}
      onOpenSettings={() => setSettingsOpen(true)}
      onCloseSettings={closeSettings}
    >
      <div className="hidden h-full min-h-0 flex-1 xl:flex">
        <ResizablePanelGroup
          groupRef={groupRef}
          autoSaveId="kleber-register"
          className="h-full w-full"
          onLayoutChange={(layout) => {
            syncSideCardsVisibility(layout.workspace);
          }}
          onLayoutChanged={(layout) => {
            syncSideCardsVisibility(layout.workspace);
          }}
        >
          <ResizablePanel id="workspace" defaultSize="60" minSize="30">
            <div className="h-full min-h-0 overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <ValidationWorkspace
                title={title}
                subtitle={subtitle}
                mode={mode}
                toggles={savedSettings.toggles}
                requestKey={savedSettings.testApiKey}
                onValidationResultsChange={setValidationResults}
                showSideCards={enableSideCards && showSideCards}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle data-tour="resize-handle" />
          <ResizablePanel id="api" defaultSize="40" minSize="30">
            <ApiMethodsPanel
              results={validationResults}
              mode={mode}
              toggles={savedSettings.toggles}
              onExpandWidth={ensureApiAtLeastHalf}
              onCollapseWidth={restorePreviousSplit}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto xl:hidden">
        <div className="p-6">
          <ValidationWorkspace
            title={title}
            subtitle={subtitle}
            mode={mode}
            toggles={savedSettings.toggles}
            requestKey={savedSettings.testApiKey}
            onValidationResultsChange={setValidationResults}
            showSideCards={false}
          />
        </div>
        <ApiMethodsPanel
          results={validationResults}
          mode={mode}
          toggles={savedSettings.toggles}
          layout="stack"
        />
      </div>

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
