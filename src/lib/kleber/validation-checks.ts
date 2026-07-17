export type ValidationCheckStatus = "success" | "error" | "warning";

export interface ValidationCheckItem {
  id: string;
  message: string;
  status: ValidationCheckStatus;
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isTruthyFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "y"
    );
  }
  return false;
}
