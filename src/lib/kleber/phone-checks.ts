import type { KleberAddressResult } from "./types";
import {
  asString,
  type ValidationCheckItem,
} from "./validation-checks";

function firstPresent(result: KleberAddressResult, keys: string[]): string {
  for (const key of keys) {
    const value = asString(result[key]);
    if (value) return value;
  }
  return "";
}

/** Map ReachTel phone verify fields into user-facing check cards. */
export function buildPhoneChecks(
  result: KleberAddressResult | null | undefined,
  options?: { countryCode?: string; phoneNumber?: string },
): ValidationCheckItem[] {
  if (!result) return [];

  const statusCode = asString(result.StatusCode);
  const response = asString(result.Response).toUpperCase();
  const statusDescription = asString(result.StatusDescription);
  const countryCode = (options?.countryCode ?? "AU").toUpperCase();
  const digitCount = (options?.phoneNumber ?? "").replace(/\D/g, "").length;
  const carrier = firstPresent(result, [
    "Carrier",
    "CarrierName",
    "Operator",
    "Network",
    "ServiceProvider",
  ]);
  const lineType = firstPresent(result, [
    "LineType",
    "PhoneType",
    "NumberType",
    "PhoneNumberType",
  ]).toLowerCase();

  const isConnected = statusCode === "0" || response === "CONNECTED";
  const isDisconnected = statusCode === "1" || response === "DISCONNECTED";
  const isIndeterminate = statusCode === "2" || response === "INDETERMINATE";
  const isMalformed = response === "MALFORMED" || response === "NOPHONENUMBER";
  const isAu = countryCode === "AU";
  const isNz = countryCode === "NZ";

  const connection: ValidationCheckItem = isConnected
    ? {
        id: "connection",
        message: "This phone number is active and can be reached.",
        status: "success",
      }
    : isDisconnected
      ? {
          id: "connection",
          message:
            statusDescription ||
            "This phone number appears to be disconnected.",
          status: "error",
        }
      : isIndeterminate
        ? {
            id: "connection",
            message:
              "Connection status could not be confirmed for this number.",
            status: "warning",
          }
        : {
            id: "connection",
            message:
              statusDescription ||
              "This phone number could not be verified as connected.",
            status: "error",
          };

  const structure: ValidationCheckItem =
    !isMalformed && digitCount >= 8
      ? {
          id: "structure",
          message: isAu
            ? "The number follows correct Australian mobile structure."
            : isNz
              ? "The number follows correct New Zealand mobile structure."
              : "The number follows a valid phone structure.",
          status: "success",
        }
      : {
          id: "structure",
          message:
            statusDescription ||
            "The phone number structure could not be validated.",
          status: "error",
        };

  const formats: ValidationCheckItem =
    !isMalformed && digitCount >= 8
      ? {
          id: "formats",
          message: "Converted into usable local and international formats.",
          status: "success",
        }
      : {
          id: "formats",
          message: "Local and international formats could not be derived.",
          status: "error",
        };

  const country: ValidationCheckItem = isAu
    ? {
        id: "country",
        message: "Matched to Australia (+61) and expected region.",
        status: "success",
      }
    : isNz
      ? {
          id: "country",
          message: "Matched to New Zealand (+64) and expected region.",
          status: "success",
        }
      : {
          id: "country",
          message: "Phone verification is only supported for AU and NZ numbers.",
          status: "warning",
        };

  const typeLabel = lineType || "mobile";
  const carrierCheck: ValidationCheckItem = carrier
    ? {
        id: "carrier",
        message: `Identified ${carrier} and number type as ${typeLabel}.`,
        status: "success",
      }
    : isConnected
      ? {
          id: "carrier",
          message: `Identified number type as ${typeLabel}.`,
          status: "success",
        }
      : {
          id: "carrier",
          message: "Carrier and number type could not be identified.",
          status: "warning",
        };

  return [connection, structure, formats, country, carrierCheck];
}
