import type { ReactNode } from "react";

export function ValidationPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-0.5">
        <h1 className="text-2xl font-semibold text-heading">{title}</h1>
        <p className="text-base text-body">{subtitle}</p>
      </div>
      {actions ? <div className="shrink-0 sm:pt-0.5">{actions}</div> : null}
    </div>
  );
}
