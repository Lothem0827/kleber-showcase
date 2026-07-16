import type { RemoteValidationResult } from "./types";

export function parseRemoteValidationStatus(
  statusCode?: string,
): RemoteValidationResult {
  switch (statusCode) {
    case "0":
      return { isValid: true, isWarning: false, statusCode };
    case "1":
      return { isValid: true, isWarning: true, statusCode };
    case "2":
      return { isValid: false, isWarning: false, statusCode };
    case "3":
      return { isValid: false, isWarning: true, statusCode };
    default:
      return { isValid: false, isWarning: false, statusCode };
  }
}

export function mapSearchResults(
  results: Array<{
    AddressLine?: string;
    Locality?: string;
    State?: string;
    Postcode?: string;
  }>,
) {
  return results.map((item) => {
    const parts = (item.AddressLine ?? "").split(",");
    return {
      AddressLine: item.AddressLine ?? "",
      AddressLine1: parts[0]?.trim() ?? "",
      AddressLine2: parts.length > 1 ? parts[1].trim() : "",
      AddressItem: parts[0]?.trim() ?? "",
      Locality: item.Locality ?? "",
      State: item.State ?? "",
      Postcode: item.Postcode ?? "",
    };
  });
}
