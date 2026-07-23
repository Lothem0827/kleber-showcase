import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-surface px-3 py-2 text-base text-foreground transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-[1.5px] focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_rgba(77,77,255,0.2)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-red-50 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)] data-[valid=true]:border-emerald-600 data-[valid=true]:bg-emerald-50 data-[valid=true]:focus-visible:border-emerald-600 data-[valid=true]:focus-visible:shadow-[0_0_0_3px_rgba(5,150,105,0.2)] data-[valid=true]:disabled:border-emerald-600 data-[valid=true]:disabled:bg-emerald-50 data-[valid=true]:disabled:opacity-100 data-[warning=true]:border-amber-500 data-[warning=true]:bg-amber-50 data-[warning=true]:focus-visible:border-amber-500 data-[warning=true]:focus-visible:shadow-[0_0_0_3px_rgba(245,158,11,0.25)] data-[warning=true]:disabled:border-amber-500 data-[warning=true]:disabled:bg-amber-50 data-[warning=true]:disabled:opacity-100 md:text-sm dark:bg-surface dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:bg-destructive/10 dark:data-[valid=true]:border-emerald-500 dark:data-[valid=true]:bg-emerald-950/30 dark:data-[valid=true]:disabled:border-emerald-500 dark:data-[valid=true]:disabled:bg-emerald-950/30 dark:data-[warning=true]:border-amber-500 dark:data-[warning=true]:bg-amber-950/30 dark:data-[warning=true]:disabled:border-amber-500 dark:data-[warning=true]:disabled:bg-amber-950/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
