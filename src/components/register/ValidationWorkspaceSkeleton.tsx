export function ValidationWorkspaceSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4"
      aria-busy="true"
      aria-label="Loading form"
    >
      <div className="h-10 rounded-md bg-muted" />
      <div className="h-10 rounded-md bg-muted" />
      <div className="h-24 rounded-md bg-muted" />
      <div className="h-10 w-32 rounded-md bg-muted" />
    </div>
  );
}
