"use client";

import { useMemo, useState } from "react";
import { Copy, Maximize2, PanelLeftIcon } from "lucide-react";
import { toast } from "sonner";
import { ChevronUpDownIcon } from "@/components/icons/figma-icons";
import { JsonHighlight } from "@/components/register/JsonHighlight";
import type { RegisterFormMode } from "@/components/register/RegisterForm";
import { Button } from "@/components/ui/button";
import { getApiMethodValidityStatus } from "@/lib/kleber/method-status";
import { KLEBER_METHODS } from "@/lib/kleber/methods";
import { DEFAULT_TOGGLES } from "@/lib/kleber/settings";
import type {
  ApiToggles,
  KleberResponse,
  ValidationStepResult,
} from "@/lib/kleber/types";
import { cn } from "@/lib/utils";

/** Same panel icon as the left sidebar trigger, mirrored for the right rail. */
function ApiPanelToggleIcon({ className }: { className?: string }) {
  return (
    <PanelLeftIcon className={cn("size-5 scale-x-[-1]", className)} aria-hidden />
  );
}

type MethodStatus =
  | "processing"
  | "success"
  | "warning"
  | "skipped"
  | "failed";

const METHOD_STATUS_STYLES: Record<
  MethodStatus,
  { label: string; className: string }
> = {
  processing: {
    label: "Processing",
    className: "bg-brand-subtle text-brand",
  },
  success: {
    label: "Success",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  warning: {
    label: "Warning",
    className:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  skipped: {
    label: "Skipped",
    className: "bg-secondary text-muted-foreground",
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-50 text-red-700 dark:bg-destructive/15 dark:text-destructive",
  },
};

function getMethodStatus(
  result: ValidationStepResult | undefined,
  method: string,
): MethodStatus | null {
  if (!result) return null;
  if (!result.enabled) return "skipped";
  if (result.loading) return "processing";
  if (result.error) return "failed";
  if (result.response) {
    return getApiMethodValidityStatus(method, result.response);
  }
  return null;
}

function MethodStatusBadge({ status }: { status: MethodStatus }) {
  const { label, className } = METHOD_STATUS_STYLES[status];
  return (
    <span
      className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", className)}
    >
      {label}
    </span>
  );
}

type ApiMethodSection = {
  title: string;
  method: string;
  methodLines: readonly string[];
  toggleKey: keyof ApiToggles;
};

type ApiMethodGroup = {
  label: string;
  sections: ApiMethodSection[];
};

const ADDRESS_METHOD_SECTIONS: ApiMethodSection[] = [
  {
    title: "AuPaf.VerifyAddress",
    method: KLEBER_METHODS.VERIFY_ADDRESS,
    methodLines: [KLEBER_METHODS.VERIFY_ADDRESS],
    toggleKey: "verifyAddress",
  },
  {
    title: "Gnaf.Au.Append",
    method: KLEBER_METHODS.GNAF_APPEND,
    methodLines: [KLEBER_METHODS.GNAF_APPEND],
    toggleKey: "gnafAppend",
  },
  {
    title: "Permissions and Delivery",
    method: KLEBER_METHODS.APPEND_TO_DPID,
    methodLines: [
      "DataTools.Enhance.Address.PermissionsAndDelivery.",
      "AuPost.AppendToDpid",
    ],
    toggleKey: "appendToDpid",
  },
  {
    title: "CreateKeys",
    method: KLEBER_METHODS.CREATE_KEYS,
    methodLines: [KLEBER_METHODS.CREATE_KEYS],
    toggleKey: "createKeys",
  },
];

const PHONE_METHOD_SECTIONS: ApiMethodSection[] = [
  {
    title: "ReachTel.VerifyPhoneNumberIsConnected",
    method: KLEBER_METHODS.VERIFY_PHONE,
    methodLines: [
      "DataTools.Verify.PhoneNumber.ReachTel.",
      "VerifyPhoneNumberIsConnected",
    ],
    toggleKey: "verifyPhone",
  },
];

const EMAIL_METHOD_SECTIONS: ApiMethodSection[] = [
  {
    title: "BriteVerify.VerifyEmail",
    method: KLEBER_METHODS.VERIFY_EMAIL,
    methodLines: [KLEBER_METHODS.VERIFY_EMAIL],
    toggleKey: "verifyEmail",
  },
];

function getMethodGroups(mode: RegisterFormMode): ApiMethodGroup[] {
  if (mode === "phone") {
    return [{ label: "Phone Validation", sections: PHONE_METHOD_SECTIONS }];
  }
  if (mode === "email") {
    return [{ label: "Email Validation", sections: EMAIL_METHOD_SECTIONS }];
  }
  if (mode === "address") {
    return [{ label: "Address Verify", sections: ADDRESS_METHOD_SECTIONS }];
  }
  return [
    { label: "Email Validation", sections: EMAIL_METHOD_SECTIONS },
    { label: "Phone Validation", sections: PHONE_METHOD_SECTIONS },
    { label: "Address Verify", sections: ADDRESS_METHOD_SECTIONS },
  ];
}

type ViewMode = "table" | "code";

interface ApiMethodsPanelProps {
  results: ValidationStepResult[];
  mode?: RegisterFormMode;
  toggles?: ApiToggles;
  onExpandWidth?: () => void;
  onCollapseWidth?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  /** `fill` for desktop split pane; `stack` for mobile natural-height layout */
  layout?: "fill" | "stack";
}

export function ApiMethodsPanel({
  results,
  mode = "full",
  toggles = DEFAULT_TOGGLES,
  onExpandWidth,
  onCollapseWidth,
  collapsed = false,
  onToggleCollapse,
  className,
  layout = "fill",
}: ApiMethodsPanelProps) {
  const methodGroups = useMemo(
    () =>
      getMethodGroups(mode)
        .map((group) => ({
          ...group,
          sections: group.sections.filter(
            (section) => toggles[section.toggleKey],
          ),
        }))
        .filter((group) => group.sections.length > 0),
    [mode, toggles],
  );
  const isStack = layout === "stack";
  const [manualOpenMethod, setManualOpenMethod] = useState<
    string | null | undefined
  >(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [expandedContent, setExpandedContent] = useState(false);

  const toggleExpandedContent = () => {
    const next = !expandedContent;
    setExpandedContent(next);
    if (next) {
      onExpandWidth?.();
    } else {
      onCollapseWidth?.();
    }
  };

  const resultsByMethod = useMemo(
    () => new Map(results.map((result) => [result.method, result])),
    [results],
  );

  const activeMethod = useMemo(
    () =>
      results.find(
        (result) => result.loading || result.response || result.error,
      )?.method ?? null,
    [results],
  );

  const openMethod =
    manualOpenMethod !== undefined ? manualOpenMethod : activeMethod;

  const showCollapseControl = !isStack && onToggleCollapse != null;
  const isRailCollapsed = collapsed && showCollapseControl;

  return (
    <aside
      data-tour="api-methods"
      className={cn(
        "@container relative flex w-full flex-col border-l border-border bg-muted",
        isStack
          ? "h-auto overflow-visible border-l-0"
          : "h-full min-h-0 overflow-hidden",
        className,
      )}
    >
      {showCollapseControl ? (
        <button
          type="button"
          data-tour="api-methods-collapse"
          onClick={onToggleCollapse}
          aria-label={
            isRailCollapsed ? "Expand API Methods" : "Collapse API Methods"
          }
          title={
            isRailCollapsed ? "Expand API Methods" : "Collapse API Methods"
          }
          className="absolute top-3 right-2 z-10 inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-icon hover:bg-brand-subtle"
        >
          <ApiPanelToggleIcon className="text-icon" />
        </button>
      ) : null}

      {/* Keep the methods tree mounted when collapsed to avoid React fiber crashes mid-resize. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isRailCollapsed && "pointer-events-none invisible absolute inset-0",
        )}
        aria-hidden={isRailCollapsed || undefined}
      >
        <header
          className={cn(
            "shrink-0 border-b border-border px-6 py-6",
            showCollapseControl && "pr-12",
          )}
        >
          <div className="space-y-0.5">
            <h2 className="text-2xl font-semibold text-heading">API Methods</h2>
            <p className="text-base text-body">
              Live responses from the current validation run
            </p>
          </div>
        </header>

        <div
            className={cn(
              "flex flex-col overflow-x-hidden",
              isStack ? "overflow-y-visible" : "min-h-0 flex-1 overflow-y-auto",
            )}
        >
          {methodGroups.map((group) => (
            <div key={group.label}>
              <div className="border-b border-border px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h3>
              </div>
              {group.sections.map((section) => {
                const result = resultsByMethod.get(section.method);
                const isOpen = openMethod === section.method;
                const status = getMethodStatus(result, section.method);

                return (
                  <section
                    key={section.method}
                    className="border-b border-border px-5 py-5"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setManualOpenMethod(isOpen ? null : section.method)
                      }
                      className="flex w-full min-w-0 items-start justify-between gap-3 text-left"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5 overflow-hidden">
                        <div className="flex min-w-0 items-start gap-2">
                          <p className="min-w-0 flex-1 break-all text-base font-semibold text-heading">
                            {section.title}
                          </p>
                          {status ? (
                            <MethodStatusBadge status={status} />
                          ) : null}
                        </div>
                        <div className="hidden min-w-0 font-mono text-sm text-body @[22rem]:block">
                          {section.methodLines.map((line) => (
                            <p key={line} className="break-all leading-normal">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                      <ChevronUpDownIcon className="mt-1 size-4 shrink-0 text-icon dark:invert" />
                    </button>

                    {isOpen ? (
                      <div className="mt-5 space-y-2">
                        <div className="flex shrink-0 items-center justify-between gap-3">
                          <div className="flex rounded-lg bg-background p-1">
                            <button
                              type="button"
                              onClick={() => setViewMode("table")}
                              className={cn(
                                "rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                                viewMode === "table"
                                  ? "bg-heading text-surface"
                                  : "text-muted-foreground",
                              )}
                            >
                              Table
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode("code")}
                              className={cn(
                                "rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                                viewMode === "code"
                                  ? "bg-heading text-surface"
                                  : "text-muted-foreground",
                              )}
                            >
                              Code
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              className="size-6 rounded-md"
                              onClick={toggleExpandedContent}
                              aria-label={
                                expandedContent
                                  ? "Collapse result panel"
                                  : "Expand result panel"
                              }
                            >
                              <Maximize2 className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              className="size-6 rounded-md"
                              onClick={() => void copyResult(result?.response)}
                              disabled={!result?.response}
                              aria-label="Copy API response"
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "h-fit overflow-auto rounded-xl bg-surface",
                            expandedContent ? "max-h-[100dvh]" : "max-h-[200px]",
                          )}
                        >
                          <ResultContent
                            result={result}
                            viewMode={viewMode}
                          />
                        </div>
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {isRailCollapsed ? (
        <div className="h-14 shrink-0 border-b border-border" aria-hidden />
      ) : null}
    </aside>
  );
}

function ResultContent({
  result,
  viewMode,
}: {
  result?: ValidationStepResult;
  viewMode: ViewMode;
}) {
  if (!result) {
    return (
      <p className="p-4 text-sm text-body">Run validation to see API results.</p>
    );
  }

  if (!result.enabled) {
    return (
      <p className="p-4 text-sm text-body">Skipped (disabled in settings)</p>
    );
  }

  if (result.loading) {
    return (
      <p className="p-4 text-sm font-medium text-brand">Running...</p>
    );
  }

  if (result.error) {
    return (
      <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-destructive/15 dark:text-destructive">
        {result.error}
      </p>
    );
  }

  if (!result.response) {
    return <p className="p-4 text-sm text-body">Pending</p>;
  }

  if (viewMode === "table") {
    return <ResultTable response={result.response} />;
  }

  return (
    <div className="p-4">
      <JsonHighlight value={result.response} />
    </div>
  );
}

function ResultTable({ response }: { response: KleberResponse }) {
  const firstResult = response.DtResponse.Result?.[0];
  const { Result: _result, ...dtResponseMeta } = response.DtResponse;
  const rows = flattenResponse(firstResult ?? dtResponseMeta);

  if (rows.length === 0) {
    return (
      <p className="p-4 text-sm text-body">No table data available.</p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="sticky top-0 border-b border-border bg-background">
        <tr>
          <th className="px-4 py-2 font-semibold text-heading">Key</th>
          <th className="px-4 py-2 font-semibold text-heading">Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-border last:border-b-0">
            <td className="px-4 py-2 font-mono text-body">{row.key}</td>
            <td className="px-4 py-2 text-body">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function flattenResponse(
  value: unknown,
  prefix = "",
  rows: { key: string; value: string }[] = [],
): { key: string; value: string }[] {
  if (value === null || value === undefined) {
    if (prefix) rows.push({ key: prefix, value: String(value) });
    return rows;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenResponse(item, `${prefix}[${index}]`, rows);
    });
    return rows;
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(
      ([key, nested]) => {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (nested !== null && typeof nested === "object") {
          flattenResponse(nested, nextPrefix, rows);
        } else {
          rows.push({ key: nextPrefix, value: String(nested) });
        }
      },
    );
    return rows;
  }

  if (prefix) rows.push({ key: prefix, value: String(value) });
  return rows;
}

async function copyResult(response?: KleberResponse) {
  if (!response) return;

  try {
    await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    toast.success("API response copied");
  } catch {
    toast.error("Unable to copy response");
  }
}
