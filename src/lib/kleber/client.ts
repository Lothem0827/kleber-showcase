import type { KleberRequest, KleberResponse } from "./types";

export async function callKleber(
  method: string,
  params: Record<string, string | number | undefined> = {},
  options?: { requestKey?: string },
): Promise<KleberResponse> {
  const requestKey = options?.requestKey?.trim();
  const body: KleberRequest = {
    method,
    params,
    ...(requestKey ? { requestKey } : {}),
  };

  const response = await fetch("/api/kleber", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as KleberResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? data.DtResponse?.ErrorMessage ?? "Loqate request failed");
  }

  if (data.DtResponse?.ErrorMessage) {
    throw new Error(data.DtResponse.ErrorMessage);
  }

  return data;
}

export function getFirstResult<T extends Record<string, unknown>>(
  response: KleberResponse,
): T | undefined {
  const result = response.DtResponse.Result;
  if (!result || result.length === 0) {
    return undefined;
  }
  return result[0] as T;
}
