"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useGroupRef } from "react-resizable-panels";
import { ApiMethodsPanel } from "@/components/register/ApiMethodsPanel";
import {
  RegisterForm,
  type RegisterFormMode,
} from "@/components/register/RegisterForm";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ApiSettingsState, ValidationStepResult } from "@/lib/kleber/types";

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

export function DesktopValidationLayout({
  header,
  mode,
  toggles,
  requestKey,
  validationResults,
  onValidationResultsChange,
  showSideCards,
  onWorkspaceResize,
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
  showSideCards: boolean;
  onWorkspaceResize: (workspace?: number) => void;
  groupRef: ReturnType<typeof useGroupRef>;
  onExpandWidth: () => void;
  onCollapseWidth: () => void;
}) {
  return (
    <ResizablePanelGroup
      groupRef={groupRef}
      autoSaveId="kleber-register"
      className="h-full w-full"
      onLayoutChange={(layout) => {
        onWorkspaceResize(layout.workspace);
      }}
      onLayoutChanged={(layout) => {
        onWorkspaceResize(layout.workspace);
      }}
    >
      <ResizablePanel id="workspace" defaultSize="60" minSize="30">
        <div className="h-full min-h-0 overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {header}
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
        </div>
      </ResizablePanel>
      <ResizableHandle data-tour="resize-handle" />
      <ResizablePanel id="api" defaultSize="40" minSize="30">
        <ApiMethodsPanel
          results={validationResults}
          mode={mode}
          toggles={toggles}
          onExpandWidth={onExpandWidth}
          onCollapseWidth={onCollapseWidth}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
