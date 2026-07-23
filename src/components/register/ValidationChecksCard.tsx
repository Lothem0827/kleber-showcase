import { CheckIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ValidationCheckItem } from "@/lib/kleber/validation-checks";

function checkVariant(status: ValidationCheckItem["status"]) {
  if (status === "success") return "success" as const;
  if (status === "warning") return "warning" as const;
  return "destructive" as const;
}

function CheckStatusIcon({
  status,
}: {
  status: ValidationCheckItem["status"];
}) {
  if (status === "success") {
    return <CheckIcon />;
  }
  if (status === "warning") {
    return <TriangleAlertIcon />;
  }
  return <XIcon />;
}

export function ValidationChecksCard({
  checks,
  showOpenApiMethods = false,
  onOpenApiMethods,
}: {
  checks: ValidationCheckItem[];
  showOpenApiMethods?: boolean;
  onOpenApiMethods?: () => void;
}) {
  if (checks.length === 0) return null;

  const showApiLink = showOpenApiMethods && onOpenApiMethods != null;

  return (
    <Card className="rounded-[12px] border border-border bg-card py-0 shadow-none">
      <CardHeader className="px-5 pt-5 pb-0">
        <CardTitle className="text-base font-semibold text-heading">
          What Was Checked
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 px-5 pb-5">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {checks.map((check) => (
            <Alert
              key={check.id}
              variant={checkVariant(check.status)}
              className="items-start rounded-xl px-4 py-4"
            >
              <CheckStatusIcon status={check.status} />
              <AlertDescription className="font-medium text-current">
                {check.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
        {showApiLink ? (
          <p className="text-sm text-body font-medium mt-2">
            Want to inspect the API responses?{" "}
            <button
              type="button"
              onClick={onOpenApiMethods}
              className="font-medium text-brand hover:text-brand-hover"
            >
              Open API Methods
            </button>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** @deprecated Prefer ValidationChecksCard */
export const EmailChecksCard = ValidationChecksCard;
