"use client";

import { ProductIllustration } from "@/components/icons/figma-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductCard() {
  return (
    <Card className="flex h-full flex-col rounded-[12px] border border-border bg-card py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-body">
          Product
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 space-y-0 px-5 pb-5">
        <div className="flex h-40 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-charcoal-200 dark:bg-charcoal-300">
          <ProductIllustration />
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-heading">
              Premium Gift Package
            </CardTitle>
            <span className="inline-flex rounded px-1.5 py-0.5 text-xs text-brand-dark bg-brand-subtle">
              Limited Edition 2026
            </span>
          </div>
          <p className="text-xl font-bold ">$129.99</p>
          <div className="space-y-1 text-sm text-body">
            <p>✓ Free shipping</p>
            <p>✓ 30-day returns</p>
            <p>✓ Secure checkout</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
