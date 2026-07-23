import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AddressCleanResult,
  AddressCleanSegment,
} from "@/lib/kleber/address-clean";
import { cn } from "@/lib/utils";

function HighlightedAddress({
  label,
  segments,
}: {
  label: string;
  segments: AddressCleanSegment[];
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed text-body">
        {segments.map((segment, index) => {
          if (segment.tone === "same") {
            return <span key={`${index}-${segment.text}`}>{segment.text}</span>;
          }

          const isRemoved = segment.tone === "removed";
          return (
            <mark
              key={`${index}-${segment.text}`}
              className={cn(
                "rounded-sm px-1 py-0.5",
                isRemoved
                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
              )}
            >
              {segment.text}
            </mark>
          );
        })}
      </p>
    </div>
  );
}

export function AddressCleanedCard({ result }: { result: AddressCleanResult }) {
  return (
    <Card className="rounded-[12px] border border-border bg-card py-0 shadow-none">
      <CardHeader className="px-5 pt-5 pb-0">
        <CardTitle className="text-base font-semibold text-heading">
          Address Cleaned
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
        <HighlightedAddress label="Before" segments={result.beforeSegments} />
        <HighlightedAddress label="After" segments={result.afterSegments} />
      </CardContent>
    </Card>
  );
}
