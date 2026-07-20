export function ValidationPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 space-y-0.5">
      <h1 className="text-2xl font-semibold text-heading">{title}</h1>
      <p className="text-base text-body">{subtitle}</p>
    </div>
  );
}
