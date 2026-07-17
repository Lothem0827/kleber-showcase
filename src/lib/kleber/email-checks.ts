import type { KleberAddressResult } from "./types";
import {
  asString,
  isTruthyFlag,
  type ValidationCheckItem,
} from "./validation-checks";

/** Map BriteVerify VerifyEmail result fields into user-facing check cards. */
export function buildEmailChecks(
  result: KleberAddressResult | null | undefined,
): ValidationCheckItem[] {
  if (!result) return [];

  const statusCode = asString(result.StatusCode);
  const emailAccount = asString(result.EmailAccount);
  const emailDomain = asString(result.EmailDomain);
  const disposable = isTruthyFlag(result.Disposable);
  const roleAddress = isTruthyFlag(result.RoleAddress);

  const isValid = statusCode === "0";
  const isAcceptAll = statusCode === "1";
  const isInvalid = statusCode === "2";
  const isUnknown = statusCode === "3";
  const hasIdentity = Boolean(emailAccount && emailDomain);
  const statusDescription = asString(result.StatusDescription);

  const reachable: ValidationCheckItem = isValid
    ? {
        id: "reachable",
        message: "This is a real, reachable email that can receive messages.",
        status: "success",
      }
    : isAcceptAll
      ? {
          id: "reachable",
          message:
            "This domain accepts all addresses, so the inbox cannot be fully confirmed as real.",
          status: "warning",
        }
      : isUnknown
        ? {
            id: "reachable",
            message:
              "The email provider did not respond in time, so reachability is unconfirmed.",
            status: "warning",
          }
        : {
            id: "reachable",
            message:
              statusDescription ||
              "This email does not appear to be a real, reachable inbox.",
            status: "error",
          };

  const structure: ValidationCheckItem =
    !isInvalid || hasIdentity
      ? {
          id: "structure",
          message: "The email is correctly formatted and usable.",
          status: isInvalid ? "warning" : "success",
        }
      : {
          id: "structure",
          message:
            statusDescription ||
            "The email format or domain structure could not be validated.",
          status: "error",
        };

  const identity: ValidationCheckItem = hasIdentity
    ? {
        id: "identity",
        message: "We identified the email username and domain provider.",
        status: "success",
      }
    : {
        id: "identity",
        message: "We could not identify the email username and domain provider.",
        status: "error",
      };

  const disposableCheck: ValidationCheckItem = disposable
    ? {
        id: "disposable",
        message: "This appears to be a temporary or disposable email address.",
        status: "error",
      }
    : {
        id: "disposable",
        message: "This does not appear to be a temporary or disposable email.",
        status: "success",
      };

  const roleCheck: ValidationCheckItem = roleAddress
    ? {
        id: "role",
        message:
          "This looks like a shared role-based inbox (for example sales@ or support@).",
        status: "warning",
      }
    : {
        id: "role",
        message: "This appears to be a personal or named inbox.",
        status: "success",
      };

  return [reachable, structure, identity, disposableCheck, roleCheck];
}
