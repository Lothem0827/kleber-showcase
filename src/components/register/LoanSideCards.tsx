"use client";

import { ProductIllustration } from "@/components/icons/figma-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LOAN_NAME_DISPLAY_MAX = 18;

function formatLoanDisplayName(name?: string) {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return "John Smith";
  return trimmed.slice(0, LOAN_NAME_DISPLAY_MAX);
}

export function LoanSummaryCard({
  cardholderName,
}: {
  cardholderName?: string;
}) {
  return (
    <Card className="flex h-full flex-col rounded-[12px] border border-border bg-card py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-body">
          Loan summary
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 space-y-0 px-5 pb-5">
        <div className="flex h-40 shrink-0 flex-col justify-between overflow-hidden rounded-xl bg-charcoal-200 p-5 dark:bg-charcoal-600">
          <p className="text-[18px] font-medium text-body dark:text-white/70">
            {formatLoanDisplayName(cardholderName)}
          </p>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-heading dark:text-white">
              $25,000
            </p>
            <p className="text-sm text-body dark:text-white/70">
              Over 5 years · indicative only
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <CardTitle className="text-lg font-semibold text-heading">
            Finalise your application
          </CardTitle>
          <div className="space-y-1 text-sm text-body">
            <p>✓ Confirm your contact details</p>
            <p>✓ Verify your residential address</p>
            <p>✓ Continue to review</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ApplicantSecurityCard() {
  return (
    <Card className="flex h-fit flex-col rounded-[12px] border border-border py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-body">
          Your application
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 space-y-0 px-5 pb-5">
        <div className="flex h-40 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-charcoal-200 dark:bg-charcoal-300">
          <ProductIllustration />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold text-heading">
            Details stay protected
          </CardTitle>
          <p className="text-sm text-body">
            We verify contact and address information to help keep your
            application secure. Demo only — no credit check is performed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
