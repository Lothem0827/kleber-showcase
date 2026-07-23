import type { KleberAddressResult } from "./types";
import {
  asString,
  type ValidationCheckItem,
} from "./validation-checks";

const GOOD_MATCH_TYPES = new Set(["0", "18", "20"]);
const WARNING_MATCH_TYPES = new Set(["9"]);

export type AddressMatchFieldStatus = "success" | "warning";

/** Input-field color after verify: green for a good match, amber otherwise. */
export function getAddressMatchFieldStatus(
  result: KleberAddressResult | null | undefined,
): AddressMatchFieldStatus {
  if (!result) return "warning";
  const matchType = asString(result.MatchType);
  const dpid = asString(result.DPID);
  if (GOOD_MATCH_TYPES.has(matchType) || Boolean(dpid)) return "success";
  return "warning";
}

/** Map AuPaf verify/repair address fields into user-facing check cards. */
export function buildAddressChecks(
  result: KleberAddressResult | null | undefined,
): ValidationCheckItem[] {
  if (!result) return [];

  const matchType = asString(result.MatchType);
  const matchTypeDescription = asString(result.MatchTypeDescription);
  const dpid = asString(result.DPID);
  const locality = asString(result.Locality);
  const state = asString(result.State);
  const postcode = asString(result.Postcode);
  const addressLine = asString(result.AddressLine ?? result.AddressLine1);
  const fieldChanges = asString(result.FieldChanges);
  const statusDescription = asString(result.StatusDescription);

  const isGoodMatch = GOOD_MATCH_TYPES.has(matchType) || Boolean(dpid);
  const isWarningMatch = WARNING_MATCH_TYPES.has(matchType) && matchType !== "0";
  const hasComponents = Boolean(locality && state && postcode);
  const hasStreet = Boolean(addressLine);
  const hasGroupOnly =
    fieldChanges.toUpperCase().includes("GID") ||
    fieldChanges.toUpperCase().includes("LID");

  const deliverable: ValidationCheckItem = isGoodMatch
    ? {
        id: "deliverable",
        message:
          "Confirmed this is a genuine address that can receive deliveries.",
        status: isWarningMatch ? "warning" : "success",
      }
    : {
        id: "deliverable",
        message:
          matchTypeDescription ||
          statusDescription ||
          "This address could not be confirmed as deliverable.",
        status: "error",
      };

  const standardised: ValidationCheckItem =
    hasStreet && hasComponents
      ? {
          id: "standardised",
          message: "Cleaned and formatted into the correct postal structure.",
          status: "success",
        }
      : {
          id: "standardised",
          message: "The address could not be cleaned into a valid postal structure.",
          status: "error",
        };

  const dpidCheck: ValidationCheckItem = dpid
    ? {
        id: "dpid",
        message:
          "Unique delivery identifier confirms high confidence of validity.",
        status: "success",
      }
    : hasGroupOnly
      ? {
          id: "dpid",
          message:
            "Only a street or locality level match was found, so no full DPID was allocated.",
          status: "warning",
        }
      : {
          id: "dpid",
          message:
            "A unique delivery identifier (DPID) was not allocated for this address.",
          status: "error",
        };

  const trustedSource: ValidationCheckItem = isGoodMatch
    ? {
        id: "trusted",
        message:
          "Checked against authoritative postal and government grade sources.",
        status: "success",
      }
    : {
        id: "trusted",
        message:
          "The address could not be verified against authoritative postal sources.",
        status: "error",
      };

  const consistency: ValidationCheckItem =
    hasStreet && hasComponents
      ? {
          id: "consistency",
          message:
            "Corrected and validated suburb, postcode and state alignment.",
          status: "success",
        }
      : {
          id: "consistency",
          message:
            "Suburb, postcode and state alignment could not be validated.",
          status: "error",
        };

  return [deliverable, standardised, dpidCheck, trustedSource, consistency];
}
