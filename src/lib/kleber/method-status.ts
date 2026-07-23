import { getAddressMatchFieldStatus } from "./address-checks";
import { getFirstResult } from "./client";
import { KLEBER_METHODS } from "./methods";
import type { KleberAddressResult, KleberResponse } from "./types";
import { asString } from "./validation-checks";

export type ApiMethodValidityStatus = "success" | "warning" | "failed";

function emailValidityStatus(
  result: KleberAddressResult | undefined,
): ApiMethodValidityStatus {
  const statusCode = asString(result?.StatusCode);
  if (statusCode === "0") return "success";
  if (statusCode === "1" || statusCode === "3") return "warning";
  return "failed";
}

function phoneValidityStatus(
  result: KleberAddressResult | undefined,
): ApiMethodValidityStatus {
  const statusCode = asString(result?.StatusCode);
  const response = asString(result?.Response).toUpperCase();

  if (statusCode === "0" || response === "CONNECTED") return "success";
  if (statusCode === "2" || response === "INDETERMINATE") return "warning";
  return "failed";
}

function enhanceResultHasPayload(result: KleberAddressResult | undefined): boolean {
  if (!result) return false;
  return Object.values(result).some((value) => {
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    return false;
  });
}

/** Enhance methods: prefer StatusCode when set; else success if a result row has data. */
function enhanceValidityStatus(
  result: KleberAddressResult | undefined,
): ApiMethodValidityStatus {
  const statusCode = asString(result?.StatusCode);
  if (statusCode === "0") return "success";
  if (statusCode === "1" || statusCode === "3") return "warning";
  if (statusCode === "2") return "failed";
  return enhanceResultHasPayload(result) ? "success" : "warning";
}

/** Map a Kleber method response to Success / Warning / Failed for API Methods badges. */
export function getApiMethodValidityStatus(
  method: string,
  response: KleberResponse,
): ApiMethodValidityStatus {
  const result = getFirstResult<KleberAddressResult>(response);

  switch (method) {
    case KLEBER_METHODS.VERIFY_EMAIL:
      return emailValidityStatus(result);
    case KLEBER_METHODS.VERIFY_PHONE:
      return phoneValidityStatus(result);
    case KLEBER_METHODS.VERIFY_ADDRESS: {
      const match = getAddressMatchFieldStatus(result);
      return match === "success" ? "success" : "warning";
    }
    case KLEBER_METHODS.GNAF_APPEND:
    case KLEBER_METHODS.APPEND_TO_DPID:
    case KLEBER_METHODS.CREATE_KEYS:
      return enhanceValidityStatus(result);
    default:
      return enhanceValidityStatus(result);
  }
}
