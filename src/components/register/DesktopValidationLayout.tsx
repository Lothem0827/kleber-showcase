"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGroupRef, usePanelRef } from "react-resizable-panels";
import { ApiMethodsPanel } from "@/components/register/ApiMethodsPanel";
import {
  RegisterForm,
  type RegisterFormMode,
} from "@/components/register/RegisterForm";
import { useShowcaseScenarioOptional } from "@/components/showcase/ShowcaseScenarioProvider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type {
  ApiSettingsState,
  ValidationStepResult,
} from "@/lib/kleber/types";

const ProductCard = dynamic(
  () =>
    import("@/components/register/ProductCard").then(
      (module) => module.ProductCard,
    ),
  { ssr: false },
);

const PaymentMethodCard = dynamic(
  () =>
    import("@/components/register/PaymentMethodCard").then(
      (module) => module.PaymentMethodCard,
    ),
  { ssr: false },
);

const LoanSummaryCard = dynamic(
  () =>
    import("@/components/register/LoanSideCards").then(
      (module) => module.LoanSummaryCard,
    ),
  { ssr: false },
);

const ApplicantSecurityCard = dynamic(
  () =>
    import("@/components/register/LoanSideCards").then(
      (module) => module.ApplicantSecurityCard,
    ),
  { ssr: false },
);

/** Fixed column width for Product / Payment cards. */
const SIDE_CARDS_COLUMN_PX = 350;
/** Tailwind `gap-5` = 1.25rem = 20px. */
const GRID_GAP_PX = 20;
/**
 * When the workspace grid is this narrow or smaller, the form column would be
 * ≤ the cards column (350px). Hide cards so Personal / Address details keep room.
 */
const SIDE_CARDS_HIDE_AT_OR_BELOW_PX = SIDE_CARDS_COLUMN_PX * 2 + GRID_GAP_PX;

export function DesktopValidationLayout({
  header,
  mode,
  toggles,
  requestKey,
  validationResults,
  onValidationResultsChange,
  onMissingApiKey,
  settingsOpen,
  enableSideCards,
  groupRef,
  onExpandWidth,
  onCollapseWidth,
}: {
  header: ReactNode;
  mode: RegisterFormMode;
  toggles: ApiSettingsState["toggles"];
  requestKey?: string;
  validationResults: ValidationStepResult[];
  onValidationResultsChange: (results: ValidationStepResult[]) => void;
  onMissingApiKey?: () => void;
  settingsOpen?: boolean;
  enableSideCards: boolean;
  groupRef: ReturnType<typeof useGroupRef>;
  onExpandWidth: () => void;
  onCollapseWidth: () => void;
}) {
  const apiPanelRef = usePanelRef();
  const gridRef = useRef<HTMLDivElement>(null);
  const [apiCollapsed, setApiCollapsed] = useState(true);
  const [sideCardsFit, setSideCardsFit] = useState(true);
  const [cardholderName, setCardholderName] = useState("");
  const scenario = useShowcaseScenarioOptional();
  const useLoanCards = enableSideCards && scenario.sideCards === "loan";

  const syncApiCollapsed = useCallback(() => {
    const next = apiPanelRef.current?.isCollapsed() ?? true;
    // Defer past the panel library's layout pass to avoid React fiber crashes.
    queueMicrotask(() => {
      setApiCollapsed((prev) => (prev === next ? prev : next));
    });
  }, [apiPanelRef]);

  useEffect(() => {
    let cancelled = false;
    const collapseOnLoad = () => {
      if (cancelled) return;
      apiPanelRef.current?.collapse();
      syncApiCollapsed();
    };
    // Run after paint so the panel ref exists; again after hydration remount.
    collapseOnLoad();
    const frame = requestAnimationFrame(() => {
      collapseOnLoad();
      requestAnimationFrame(collapseOnLoad);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [apiPanelRef, syncApiCollapsed]);

  useEffect(() => {
    if (!enableSideCards) {
      setSideCardsFit(false);
      return;
    }

    const node = gridRef.current;
    if (!node) return;

    const updateFit = () => {
      const width = node.getBoundingClientRect().width;
      // Hide when form would be ≤ cards width (both ~350px + gap).
      setSideCardsFit(width > SIDE_CARDS_HIDE_AT_OR_BELOW_PX);
    };

    updateFit();
    const observer = new ResizeObserver(updateFit);
    observer.observe(node);
    return () => observer.disconnect();
  }, [enableSideCards]);

  const toggleApiCollapse = useCallback(() => {
    const panel = apiPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, [apiPanelRef]);

  const expandApiPanel = useCallback(() => {
    const panel = apiPanelRef.current;
    if (!panel || !panel.isCollapsed()) return;
    panel.expand();
  }, [apiPanelRef]);

  const showSideCards = enableSideCards && sideCardsFit;

  return (
    <ResizablePanelGroup
      groupRef={groupRef}
      autoSaveId="kleber-register-api-collapsed"
      className="h-full w-full"
      onLayoutChanged={() => {
        syncApiCollapsed();
      }}
    >
      <ResizablePanel id="workspace" defaultSize="100" minSize="30">
        <div className="h-full min-h-0 overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {header}
          <div
            ref={gridRef}
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
              onMissingApiKey={onMissingApiKey}
              onFullNameChange={setCardholderName}
              settingsOpen={settingsOpen}
              apiMethodsCollapsed={apiCollapsed}
              onOpenApiMethods={expandApiPanel}
            />
            {showSideCards ? (
              <div className="grid grid-rows-2 gap-5 [grid-template-rows:1fr_1fr]">
                {useLoanCards ? (
                  <>
                    <LoanSummaryCard cardholderName={cardholderName} />
                    <ApplicantSecurityCard />
                  </>
                ) : (
                  <>
                    <ProductCard />
                    <PaymentMethodCard cardholderName={cardholderName} />
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle
        data-tour="resize-handle"
        className={apiCollapsed ? "pointer-events-none opacity-0" : undefined}
      />
      <ResizablePanel
        id="api"
        defaultSize={48}
        minSize="20"
        collapsible
        collapsedSize={48}
        panelRef={apiPanelRef}
        onResize={syncApiCollapsed}
      >
        <ApiMethodsPanel
          results={validationResults}
          mode={mode}
          toggles={toggles}
          onExpandWidth={onExpandWidth}
          onCollapseWidth={onCollapseWidth}
          collapsed={apiCollapsed}
          onToggleCollapse={toggleApiCollapse}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
