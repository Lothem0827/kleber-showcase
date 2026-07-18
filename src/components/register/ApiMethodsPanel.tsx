"use client";

import { useMemo, useState } from "react";
import { Copy, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import {
  ChevronUpDownIcon,
  SidebarCollapseIcon,
} from "@/components/icons/figma-icons";
import { JsonHighlight } from "@/components/register/JsonHighlight";
import { Button } from "@/components/ui/button";
import { KLEBER_METHODS } from "@/lib/kleber/methods";
import type { KleberResponse, ValidationStepResult } from "@/lib/kleber/types";
import { cn } from "@/lib/utils";

type MethodStatus = "processing" | "complete" | "skipped" | "failed";

const METHOD_STATUS_STYLES: Record<
  MethodStatus,
  { label: string; className: string }
> = {
  processing: {
    label: "Processing",
    className: "bg-brand-subtle text-brand",
  },
  complete: {
    label: "Complete",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
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

function getMethodStatus(result?: ValidationStepResult): MethodStatus | null {
  if (!result) return null;
  if (!result.enabled) return "skipped";
  if (result.loading) return "processing";
  if (result.error) return "failed";
  if (result.response) return "complete";
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

const API_METHOD_SECTIONS = [
  {
    title: "AuPaf.VerifyAddress",
    method: KLEBER_METHODS.VERIFY_ADDRESS,
    methodLines: [KLEBER_METHODS.VERIFY_ADDRESS],
  },
  {
    title: "Gnaf.Au.Append",
    method: KLEBER_METHODS.GNAF_APPEND,
    methodLines: [KLEBER_METHODS.GNAF_APPEND],
  },
  {
    title: "Permissions and Delivery",
    method: KLEBER_METHODS.APPEND_TO_DPID,
    methodLines: [
      "DataTools.Enhance.Address.PermissionsAndDelivery.",
      "AuPost.AppendToDpid",
    ],
  },
  {
    title: "CreateKeys",
    method: KLEBER_METHODS.CREATE_KEYS,
    methodLines: [KLEBER_METHODS.CREATE_KEYS],
  },
] as const;

type ViewMode = "table" | "code";

interface ApiMethodsPanelProps {
  results: ValidationStepResult[];
  onExpandWidth?: () => void;
  onCollapseWidth?: () => void;
  className?: string;
}

export function ApiMethodsPanel({
  results,
  onExpandWidth,
  onCollapseWidth,
  className,
}: ApiMethodsPanelProps) {
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

  return (
    <aside
      data-tour="api-methods"
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-muted",
        className,
      )}
    >
      <header className="shrink-0 border-b border-border px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-semibold text-heading">API Methods</h2>
            <p className="text-base text-body">
              Live responses from the current validation run
            </p>
          </div>

          {/* <SidebarCollapseIcon className="text-icon dark:invert" /> */}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {API_METHOD_SECTIONS.map((section) => {
          const result = resultsByMethod.get(section.method);
          const isOpen = openMethod === section.method;
          const status = getMethodStatus(result);

          return (
            <section
              key={section.method}
              className="border-b border-t border-border px-5 py-5 first:border-t-0"
            >
              <button
                type="button"
                onClick={() =>
                  setManualOpenMethod(isOpen ? null : section.method)
                }
                className="flex w-full shrink-0 items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-heading">
                      {section.title}
                    </p>
                    {status ? <MethodStatusBadge status={status} /> : null}
                  </div>
                  <div className="font-mono text-sm text-body">
                    {section.methodLines.map((line) => (
                      <p key={line} className="leading-normal">
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
                      "overflow-auto rounded-xl bg-surface",
                      expandedContent ? "h-[100dvh]" : "h-[287px]",
                    )}
                  >
                    <ResultContent
                      result={result}
                      viewMode={viewMode}
                      fillHeight
                    />
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function ResultContent({
  result,
  viewMode,
  fillHeight = false,
}: {
  result?: ValidationStepResult;
  viewMode: ViewMode;
  fillHeight?: boolean;
}) {
  if (!result) {
    return (
      <p className="flex h-full items-center justify-center p-4 text-sm text-body">
        Run validation to see API results.
      </p>
    );
  }

  if (!result.enabled) {
    return (
      <p className="flex h-full items-center justify-center p-4 text-sm text-body">
        Skipped (disabled in settings)
      </p>
    );
  }

  if (result.loading) {
    return (
      <p className="flex h-full items-center justify-center p-4 text-sm font-medium text-brand">
        Running...
      </p>
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
    return (
      <p className="flex h-full items-center justify-center p-4 text-sm text-body">
        Pending
      </p>
    );
  }

  if (viewMode === "table") {
    return <ResultTable response={result.response} />;
  }

  return (
    <div className={cn("p-4", fillHeight && "min-h-full")}>
      <JsonHighlight value={result.response} />
    </div>
  );
}

function ResultTable({ response }: { response: KleberResponse }) {
  const rows = flattenResponse(response);

  if (rows.length === 0) {
    return (
      <p className="flex h-full items-center justify-center p-4 text-sm text-body">
        No table data available.
      </p>
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
