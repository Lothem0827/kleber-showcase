"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardChip } from "@/components/icons/figma-icons";

export function PaymentMethodCard() {
  return (
    <Card className="flex h-fit flex-col rounded-[12px] border border-border  py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-body">
          Payment Method
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 space-y-0 px-5 pb-5">
        <div className="relative flex h-40 shrink-0 flex-col justify-between overflow-hidden rounded-xl p-5 text-white bg-charcoal-600">
          {/* Decorative overlay */}
          <Image
            src="/icons/card-bg.svg"
            alt=""
            aria-hidden
            fill
            sizes="320px"
            className="pointer-events-none z-0 object-cover object-center"
          />
          <div className="relative z-10">
            <CardChip />
          </div>
          <div className="relative z-10 space-y-3 font-mono">
            <p className="text-lg font-bold tracking-[0.08em]">
              3455 4562 7710 3507
            </p>
            <div className="flex items-center justify-between text-sm">
              <p className="font-bold">John Smith</p>
              <p className="text-[10px] font-medium">Valid Thru 12/27</p>
            </div>
          </div>
        </div>
        <p className="mt-auto text-xs text-muted-foreground">
          Demo card for showcase no charges will be made
        </p>
      </CardContent>
    </Card>
  );
}
