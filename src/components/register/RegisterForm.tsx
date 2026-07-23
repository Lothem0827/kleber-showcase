"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { callKleber, getFirstResult } from "@/lib/kleber/client";
import { AU_STATES, KLEBER_METHODS } from "@/lib/kleber/methods";
import type {
  AddressSuggestion,
  ApiToggles,
  KleberAddressResult,
  KleberResponse,
  RegisterFormData,
  RemoteValidationResult,
  ValidationStepResult,
} from "@/lib/kleber/types";
import {
  mapSearchResults,
  parseRemoteValidationStatus,
} from "@/lib/kleber/validation";
import { buildEmailChecks } from "@/lib/kleber/email-checks";
import { buildPhoneChecks } from "@/lib/kleber/phone-checks";
import { buildAddressChecks, getAddressMatchFieldStatus } from "@/lib/kleber/address-checks";
import {
  buildAddressCleanResult,
  type AddressCleanResult,
} from "@/lib/kleber/address-clean";
import type { ValidationCheckItem } from "@/lib/kleber/validation-checks";
import {
  formatAddressLine,
  isAddressComplete,
  type AddressParts,
} from "@/lib/kleber/format-address";
import { cn } from "@/lib/utils";
import type { Country, Value as E164Number } from "react-phone-number-input";
import { AddressCleanedCard } from "@/components/register/AddressCleanedCard";
import { AddressConfirmDialog } from "@/components/register/AddressConfirmDialog";
import { ValidationChecksCard } from "@/components/register/ValidationChecksCard";
import { useShowcaseScenarioOptional } from "@/components/showcase/ShowcaseScenarioProvider";
import { Button } from "@/components/ui/button";
import type { ShowcaseScenarioConfig } from "@/lib/showcase/scenarios";

type FieldStatus = "idle" | "success" | "error" | "warning";

export type RegisterFormMode = "full" | "address" | "phone" | "email";

function remoteFieldStatus(
  validating: boolean,
  validation: RemoteValidationResult | null,
): FieldStatus {
  if (validating || !validation) return "idle";
  return validation.isValid ? "success" : "error";
}

function fieldValidityProps(status: FieldStatus) {
  return {
    "aria-invalid": status === "error" || undefined,
    "data-valid": status === "success" ? true : undefined,
    "data-warning": status === "warning" ? true : undefined,
  } as const;
}

/** Apply shared address outcome only to fields that have a value. */
function addressFieldVisualStatus(
  value: string,
  outcome: FieldStatus,
): FieldStatus {
  if (!value.trim() || outcome === "idle") return "idle";
  return outcome;
}

/** True when the line looks like a numbered street (e.g. "5 Cecil St"), not a building name. */
function looksLikeStreetAddress(line: string): boolean {
  return /^\d+[A-Za-z]?(?:\s|\/|-)/.test(line.trim());
}

/**
 * Map RepairAddress street fields into form line1/line2.
 * Match production: strip junk line2 for numbered streets; keep line2 for building names.
 */
function mapRepairedStreetLines(
  repaired: KleberAddressResult,
  fallbackStreet: string,
  originalLine2 = "",
): { addressLine1: string; addressLine2: string } {
  const parts = String(repaired.AddressLine ?? fallbackStreet).split(",");
  const buildingName = String(repaired.BuildingName || "").trim();
  const streetLine = parts[0]?.trim() || fallbackStreet;
  const splitLine2 = parts.length > 1 ? parts[1].trim() : "";
  const apiLine2 = String(repaired.AddressLine2 || "").trim();
  const keptLine2 = originalLine2.trim();

  if (buildingName) {
    const distinctStreet =
      streetLine &&
      streetLine.toLowerCase() !== buildingName.toLowerCase()
        ? streetLine
        : "";
    return {
      addressLine1: buildingName,
      addressLine2:
        distinctStreet || splitLine2 || apiLine2 || keptLine2,
    };
  }

  const addressLine1 = streetLine || fallbackStreet;
  if (splitLine2 || apiLine2) {
    return {
      addressLine1,
      addressLine2: splitLine2 || apiLine2,
    };
  }

  // No API line2: only clear junk when this is a numbered street address.
  if (looksLikeStreetAddress(addressLine1)) {
    return { addressLine1, addressLine2: "" };
  }

  return { addressLine1, addressLine2: keptLine2 };
}

const INITIAL_FORM: RegisterFormData = {
  countryCode: "AU",
  addressLookup: "",
  businessName: "",
  fullName: "",
  dateOfBirth: "",
  addressLine1: "",
  addressLine2: "",
  suburb: "",
  state: "",
  postcode: "",
  mobile: "",
  email: "",
};

const ADDRESS_METHODS = new Set<string>([
  KLEBER_METHODS.VERIFY_ADDRESS,
  KLEBER_METHODS.GNAF_APPEND,
  KLEBER_METHODS.APPEND_TO_DPID,
  KLEBER_METHODS.CREATE_KEYS,
]);

function useRegisterForm(
  toggles: ApiToggles,
  requestKey?: string,
  mode: RegisterFormMode = "full",
  onMissingApiKey?: () => void,
  settingsOpen = false,
) {
  const [form, setForm] = useState<RegisterFormData>(INITIAL_FORM);
  const [manualEntry, setManualEntry] = useState(false);
  const [addressFieldsLocked, setAddressFieldsLocked] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<
    ValidationStepResult[]
  >([]);
  const [emailValidation, setEmailValidation] =
    useState<RemoteValidationResult | null>(null);
  const [emailChecks, setEmailChecks] = useState<ValidationCheckItem[]>([]);
  const [phoneChecks, setPhoneChecks] = useState<ValidationCheckItem[]>([]);
  const [addressChecks, setAddressChecks] = useState<ValidationCheckItem[]>([]);
  const [addressFieldStatus, setAddressFieldStatus] =
    useState<FieldStatus>("idle");
  const [addressCleanResult, setAddressCleanResult] =
    useState<AddressCleanResult | null>(null);
  const [phoneValidation, setPhoneValidation] =
    useState<RemoteValidationResult | null>(null);
  const [emailValidating, setEmailValidating] = useState(false);
  const [phoneValidating, setPhoneValidating] = useState(false);
  const [confirmAddressOpen, setConfirmAddressOpen] = useState(false);
  const missingKeyPromptedRef = useRef(false);

  const debouncedAddressQuery = useDebounce(form.addressLookup, 350);
  const debouncedEmail = useDebounce(form.email, 500);
  const debouncedPhone = useDebounce(form.mobile, 500);
  const addressFingerprint = [
    form.addressLine1,
    form.addressLine2,
    form.suburb,
    form.state,
    form.postcode,
  ].join("\u001f");
  const debouncedAddressFingerprint = useDebounce(addressFingerprint, 500);

  const kleber = useCallback(
    (
      method: string,
      params: Record<string, string | number | undefined> = {},
    ) => callKleber(method, params, { requestKey }),
    [requestKey],
  );

  const ensureApiKey = useCallback(() => {
    if (requestKey?.trim()) {
      missingKeyPromptedRef.current = false;
      return true;
    }
    if (!missingKeyPromptedRef.current) {
      missingKeyPromptedRef.current = true;
      toast.error("API key is not configured");
      onMissingApiKey?.();
    }
    return false;
  }, [onMissingApiKey, requestKey]);

  useEffect(() => {
    if (requestKey?.trim()) {
      missingKeyPromptedRef.current = false;
    }
  }, [requestKey]);

  useEffect(() => {
    if (settingsOpen) return;
    const timeoutId = window.setTimeout(() => {
      missingKeyPromptedRef.current = false;
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [settingsOpen]);

  const upsertMethodResult = useCallback((next: ValidationStepResult) => {
    setValidationResults((current) => {
      const without = current.filter((step) => step.method !== next.method);
      return [...without, next];
    });
  }, []);

  const removeMethodResult = useCallback((method: string) => {
    setValidationResults((current) =>
      current.filter((step) => step.method !== method),
    );
  }, []);

  const trackEmailResults = mode === "full" || mode === "email";
  const trackPhoneResults = mode === "full" || mode === "phone";

  const updateField = <K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));

    if (key === "addressLookup" && String(value).length < 3) {
      setSuggestions([]);
    }
    if (
      key === "addressLine1" ||
      key === "addressLine2" ||
      key === "suburb" ||
      key === "state" ||
      key === "postcode"
    ) {
      setAddressCleanResult(null);
      setAddressFieldStatus("idle");
    }
    if (key === "email" && (!value || !String(value).includes("@"))) {
      setEmailValidation(null);
      setEmailChecks([]);
      if (trackEmailResults) removeMethodResult(KLEBER_METHODS.VERIFY_EMAIL);
    }
    if (key === "mobile" && String(value).replace(/\D/g, "").length < 8) {
      setPhoneValidation(null);
      setPhoneChecks([]);
      if (trackPhoneResults) removeMethodResult(KLEBER_METHODS.VERIFY_PHONE);
    }
  };

  useEffect(() => {
    if (manualEntry || debouncedAddressQuery.length < 3) return;
    if (!ensureApiKey()) return;

    let cancelled = false;

    async function searchAddresses() {
      setSearchLoading(true);
      try {
        const response = await kleber(KLEBER_METHODS.SEARCH_ADDRESS, {
          AddressLine: debouncedAddressQuery,
          ResultLimit: 100,
        });
        if (!cancelled)
          setSuggestions(mapSearchResults(response.DtResponse.Result ?? []));
      } catch (error) {
        if (!cancelled) {
          setSuggestions([]);
          toast.error(
            error instanceof Error ? error.message : "Address search failed",
          );
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }

    void searchAddresses();
    return () => {
      cancelled = true;
    };
  }, [debouncedAddressQuery, ensureApiKey, kleber, manualEntry]);

  useEffect(() => {
    if (!trackEmailResults || !toggles.verifyEmail) {
      return;
    }
    if (!debouncedEmail || !debouncedEmail.includes("@")) {
      return;
    }
    if (!ensureApiKey()) return;
    let cancelled = false;
    async function validateEmail() {
      setEmailValidating(true);
      upsertMethodResult({
        step: "Verify Email",
        method: KLEBER_METHODS.VERIFY_EMAIL,
        enabled: true,
        loading: true,
      });
      try {
        const response = await kleber(KLEBER_METHODS.VERIFY_EMAIL, {
          EmailAddress: debouncedEmail,
        });
        if (cancelled) return;
        const result = getFirstResult<KleberAddressResult>(response);
        const parsed = parseRemoteValidationStatus(result?.StatusCode);
        parsed.statusDescription = result?.StatusDescription;
        setEmailValidation(parsed);
        setEmailChecks(buildEmailChecks(result));
        upsertMethodResult({
          step: "Verify Email",
          method: KLEBER_METHODS.VERIFY_EMAIL,
          enabled: true,
          loading: false,
          response,
        });
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Email validation failed";
          setEmailValidation({
            isValid: false,
            isWarning: false,
            statusDescription: message,
          });
          setEmailChecks(
            buildEmailChecks({
              StatusCode: "2",
              StatusDescription: message,
            }),
          );
          upsertMethodResult({
            step: "Verify Email",
            method: KLEBER_METHODS.VERIFY_EMAIL,
            enabled: true,
            loading: false,
            error: message,
          });
        }
      } finally {
        if (!cancelled) setEmailValidating(false);
      }
    }
    void validateEmail();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedEmail,
    ensureApiKey,
    kleber,
    toggles.verifyEmail,
    trackEmailResults,
    upsertMethodResult,
  ]);

  useEffect(() => {
    if (!trackPhoneResults || !toggles.verifyPhone) {
      return;
    }
    if (!debouncedPhone || debouncedPhone.replace(/\D/g, "").length < 8) {
      return;
    }
    if (!ensureApiKey()) return;
    let cancelled = false;
    async function validatePhone() {
      setPhoneValidating(true);
      upsertMethodResult({
        step: "Verify Phone",
        method: KLEBER_METHODS.VERIFY_PHONE,
        enabled: true,
        loading: true,
      });
      try {
        const response = await kleber(KLEBER_METHODS.VERIFY_PHONE, {
          PhoneNumber: debouncedPhone,
          DefaultCountryCode: form.countryCode === "AU" ? "+61" : "+64",
        });
        if (cancelled) return;
        const result = getFirstResult<KleberAddressResult>(response);
        const parsed = parseRemoteValidationStatus(result?.StatusCode);
        parsed.statusDescription = result?.StatusDescription;
        setPhoneValidation(parsed);
        setPhoneChecks(
          buildPhoneChecks(result, {
            countryCode: form.countryCode,
            phoneNumber: debouncedPhone,
          }),
        );
        upsertMethodResult({
          step: "Verify Phone",
          method: KLEBER_METHODS.VERIFY_PHONE,
          enabled: true,
          loading: false,
          response,
        });
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Phone validation failed";
          setPhoneValidation({
            isValid: false,
            isWarning: false,
            statusDescription: message,
          });
          setPhoneChecks(
            buildPhoneChecks(
              {
                StatusCode: "1",
                StatusDescription: message,
                Response: "FAILED",
              },
              {
                countryCode: form.countryCode,
                phoneNumber: debouncedPhone,
              },
            ),
          );
          upsertMethodResult({
            step: "Verify Phone",
            method: KLEBER_METHODS.VERIFY_PHONE,
            enabled: true,
            loading: false,
            error: message,
          });
        }
      } finally {
        if (!cancelled) setPhoneValidating(false);
      }
    }
    void validatePhone();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedPhone,
    ensureApiKey,
    form.countryCode,
    kleber,
    toggles.verifyPhone,
    trackPhoneResults,
    upsertMethodResult,
  ]);

  const handleAddressSelect = async (suggestion: AddressSuggestion) => {
    setSuggestions([]);
    setManualEntry(true);
    setAddressFieldsLocked(true);
    setAddressCleanResult(null);

    updateField("addressLookup", suggestion.AddressLine);
    updateField("addressLine1", suggestion.AddressLine);
    updateField("addressLine2", suggestion.AddressLine1);
    updateField("suburb", suggestion.Locality);
    updateField("state", suggestion.State);
    updateField("postcode", suggestion.Postcode);

    try {
      const response = await kleber(KLEBER_METHODS.REPAIR_ADDRESS, {
        AddressLine1: suggestion.AddressLine1,
        AddressLine2: suggestion.AddressLine2,
        Locality: suggestion.Locality,
        State: suggestion.State,
        Postcode: suggestion.Postcode,
      });
      const repaired = getFirstResult<KleberAddressResult>(response);
      if (repaired) {
        const { addressLine1: line1, addressLine2: line2 } =
          mapRepairedStreetLines(
            repaired,
            suggestion.AddressLine1 || suggestion.AddressLine,
            suggestion.AddressLine2,
          );
        updateField("addressLookup", line1);
        updateField("addressLine1", line1);
        updateField("addressLine2", line2);
        updateField(
          "suburb",
          (repaired.Locality as string) ?? suggestion.Locality,
        );
        updateField("state", (repaired.State as string) ?? suggestion.State);
        updateField(
          "postcode",
          (repaired.Postcode as string) ?? suggestion.Postcode,
        );
        setAddressChecks(buildAddressChecks(repaired));
        setAddressFieldStatus(getAddressMatchFieldStatus(repaired));
      }
    } catch (error) {
      setAddressChecks([]);
      setAddressFieldStatus("idle");
      toast.error(
        error instanceof Error ? error.message : "Address repair failed",
      );
    }
  };

  const updateStep = (method: string, patch: Partial<ValidationStepResult>) => {
    setValidationResults((current) =>
      current.map((step) =>
        step.method === method ? { ...step, ...patch } : step,
      ),
    );
  };

  const runValidationChain = async (addressOverride?: {
    addressLine1: string;
    addressLine2: string;
    suburb: string;
    state: string;
    postcode: string;
  }) => {
    const addressSteps: ValidationStepResult[] = [
      {
        step: "Verify Address",
        method: KLEBER_METHODS.VERIFY_ADDRESS,
        enabled: toggles.verifyAddress,
        loading: false,
      },
      {
        step: "GNAF Geocoding",
        method: KLEBER_METHODS.GNAF_APPEND,
        enabled: toggles.gnafAppend,
        loading: false,
      },
      {
        step: "Australia Post DPID",
        method: KLEBER_METHODS.APPEND_TO_DPID,
        enabled: toggles.appendToDpid,
        loading: false,
      },
      {
        step: "Create Address Keys",
        method: KLEBER_METHODS.CREATE_KEYS,
        enabled: toggles.createKeys,
        loading: false,
      },
    ];
    setValidationResults((current) => [
      ...current.filter((step) => !ADDRESS_METHODS.has(step.method)),
      ...addressSteps,
    ]);

    const line1 = addressOverride?.addressLine1 ?? form.addressLine1;
    const line2 = addressOverride?.addressLine2 ?? form.addressLine2;
    const suburb = addressOverride?.suburb ?? form.suburb;
    const state = addressOverride?.state ?? form.state;
    const postcode = addressOverride?.postcode ?? form.postcode;

    const addressPayload = {
      AddressLine1: line1,
      AddressLine2: line2,
      Locality: suburb,
      State: state,
      Postcode: postcode,
    };

    let verifyResponse: KleberResponse | undefined;

    if (toggles.verifyAddress) {
      updateStep(KLEBER_METHODS.VERIFY_ADDRESS, { loading: true });
      try {
        verifyResponse = await kleber(
          KLEBER_METHODS.VERIFY_ADDRESS,
          addressPayload,
        );
        const verified = getFirstResult<KleberAddressResult>(verifyResponse);
        updateStep(KLEBER_METHODS.VERIFY_ADDRESS, {
          loading: false,
          response: verifyResponse,
        });
        setAddressChecks(buildAddressChecks(verified));
        setAddressFieldStatus(getAddressMatchFieldStatus(verified));
      } catch (error) {
        updateStep(KLEBER_METHODS.VERIFY_ADDRESS, {
          loading: false,
          error: error instanceof Error ? error.message : "Verify failed",
        });
        setAddressFieldStatus("warning");
        throw error;
      }
    }

    if (toggles.gnafAppend) {
      updateStep(KLEBER_METHODS.GNAF_APPEND, { loading: true });
      try {
        const response = await kleber(
          KLEBER_METHODS.GNAF_APPEND,
          addressPayload,
        );
        updateStep(KLEBER_METHODS.GNAF_APPEND, { loading: false, response });
      } catch (error) {
        updateStep(KLEBER_METHODS.GNAF_APPEND, {
          loading: false,
          error: error instanceof Error ? error.message : "GNAF append failed",
        });
      }
    }

    if (toggles.appendToDpid) {
      updateStep(KLEBER_METHODS.APPEND_TO_DPID, { loading: true });
      try {
        const dpid =
          getFirstResult<KleberAddressResult>(
            verifyResponse ?? { DtResponse: {} },
          )?.DPID ?? "";
        if (!dpid) throw new Error("DPID not available from verify step");
        const response = await kleber(KLEBER_METHODS.APPEND_TO_DPID, {
          DPID: dpid,
        });
        updateStep(KLEBER_METHODS.APPEND_TO_DPID, {
          loading: false,
          response,
        });
      } catch (error) {
        updateStep(KLEBER_METHODS.APPEND_TO_DPID, {
          loading: false,
          error:
            error instanceof Error ? error.message : "Append to DPID failed",
        });
      }
    }

    if (toggles.createKeys) {
      updateStep(KLEBER_METHODS.CREATE_KEYS, { loading: true });
      try {
        const addressLine3 =
          !line2 && suburb ? `${suburb} ${state} ${postcode}`.trim() : "";
        const response = await kleber(KLEBER_METHODS.CREATE_KEYS, {
          AddressLine1: line1,
          AddressLine2: line2,
          AddressLine3: addressLine3,
        });
        updateStep(KLEBER_METHODS.CREATE_KEYS, { loading: false, response });
      } catch (error) {
        updateStep(KLEBER_METHODS.CREATE_KEYS, {
          loading: false,
          error: error instanceof Error ? error.message : "Create keys failed",
        });
      }
    }
  };

  const needsAddress = mode === "full" || mode === "address";

  const runAddressValidationFromParts = async (
    addressLine1: string,
    addressLine2: string,
    suburb: string,
    state: string,
    postcode: string,
    { repair }: { repair: boolean },
  ) => {
    try {
      let addressWasCleaned = false;
      let repairedParts: AddressParts | undefined;

      if (repair) {
        const beforeParts = {
          addressLine1,
          addressLine2,
          suburb,
          state,
          postcode,
        };
        const repairResponse = await kleber(KLEBER_METHODS.REPAIR_ADDRESS, {
          AddressLine1: addressLine1,
          AddressLine2: addressLine2,
          Locality: suburb,
          State: state,
          Postcode: postcode,
        });
        const repaired = getFirstResult<KleberAddressResult>(repairResponse);
        if (repaired) {
          const street = mapRepairedStreetLines(
            repaired,
            addressLine1,
            addressLine2,
          );
          repairedParts = {
            addressLine1: street.addressLine1,
            addressLine2: street.addressLine2,
            suburb: String(repaired.Locality || suburb),
            state: String(repaired.State || state),
            postcode: String(repaired.Postcode || postcode),
          };
          const addressChanged =
            repairedParts.addressLine1 !== beforeParts.addressLine1 ||
            repairedParts.addressLine2 !== beforeParts.addressLine2 ||
            repairedParts.suburb !== beforeParts.suburb ||
            repairedParts.state !== beforeParts.state ||
            repairedParts.postcode !== beforeParts.postcode;
          if (addressChanged) {
            setForm((current) => ({
              ...current,
              ...repairedParts,
            }));
          }
          const cleanResult = buildAddressCleanResult(
            beforeParts,
            repairedParts,
          );
          if (cleanResult) {
            setAddressCleanResult(cleanResult);
            addressWasCleaned = true;
          }
        }
      }

      await runValidationChain(repairedParts);
      if (addressWasCleaned) {
        toast.success("Address cleaned into the standard postal format");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Validation chain failed",
      );
    }
  };

  const submitManualAddress = async () => {
    await runAddressValidationFromParts(
      form.addressLine1,
      form.addressLine2,
      form.suburb,
      form.state,
      form.postcode,
      { repair: true },
    );
  };

  const clearManualAddress = useCallback(() => {
    setConfirmAddressOpen(false);
    setForm((current) => ({
      ...current,
      addressLine1: "",
      addressLine2: "",
      suburb: "",
      state: "",
      postcode: "",
    }));
    setAddressCleanResult(null);
    setAddressFieldStatus("idle");
    setValidationResults((current) =>
      current.filter((step) => !ADDRESS_METHODS.has(step.method)),
    );
    setAddressChecks([]);
  }, []);

  const handleSaveManualAddress = useCallback(() => {
    const parts: AddressParts = {
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      suburb: form.suburb,
      state: form.state,
      postcode: form.postcode,
    };
    if (!isAddressComplete(parts)) {
      toast.error("Complete address line 1, suburb, state, and postcode.");
      return;
    }
    setConfirmAddressOpen(true);
  }, [
    form.addressLine1,
    form.addressLine2,
    form.postcode,
    form.state,
    form.suburb,
  ]);

  const handleConfirmProceed = async () => {
    if (!ensureApiKey()) return;
    setConfirmAddressOpen(false);
    await submitManualAddress();
  };

  const formattedManualAddress = useMemo(
    () =>
      formatAddressLine({
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        suburb: form.suburb,
        state: form.state,
        postcode: form.postcode,
      }),
    [
      form.addressLine1,
      form.addressLine2,
      form.postcode,
      form.state,
      form.suburb,
    ],
  );

  useEffect(() => {
    if (!needsAddress) return;
    if (manualEntry && !addressFieldsLocked) return;

    const [
      addressLine1 = "",
      addressLine2 = "",
      suburb = "",
      state = "",
      postcode = "",
    ] = debouncedAddressFingerprint.split("\u001f");

    const addressComplete =
      Boolean(addressLine1.trim()) &&
      Boolean(suburb.trim()) &&
      Boolean(state.trim()) &&
      Boolean(postcode.trim());

    if (!addressComplete) {
      return;
    }

    let cancelled = false;

    async function runAddressValidation() {
      if (cancelled) return;
      await runAddressValidationFromParts(
        addressLine1,
        addressLine2,
        suburb,
        state,
        postcode,
        { repair: manualEntry },
      );
    }

    void runAddressValidation();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- address fingerprint drives re-runs
  }, [
    addressFieldsLocked,
    debouncedAddressFingerprint,
    kleber,
    manualEntry,
    needsAddress,
    toggles.appendToDpid,
    toggles.createKeys,
    toggles.gnafAppend,
    toggles.verifyAddress,
  ]);

  const visibleSuggestions =
    !manualEntry && form.addressLookup.length >= 3 ? suggestions : [];
  const emailStatus = useMemo(() => {
    if (emailValidating) return "Validating email...";
    if (!form.email || !form.email.includes("@")) return null;
    if (!emailValidation) return null;
    return (
      emailValidation.statusDescription ??
      (emailValidation.isValid
        ? "Email looks valid"
        : "Email could not be verified")
    );
  }, [emailValidating, form.email, emailValidation]);
  const phoneStatus = useMemo(() => {
    if (phoneValidating) return "Validating phone number...";
    if (!form.mobile || form.mobile.replace(/\D/g, "").length < 8) return null;
    if (!phoneValidation) return null;
    return (
      phoneValidation.statusDescription ??
      (phoneValidation.isValid
        ? "Phone number looks valid"
        : "Phone number could not be verified")
    );
  }, [phoneValidating, form.mobile, phoneValidation]);

  const emailFieldStatus = remoteFieldStatus(emailValidating, emailValidation);
  const phoneFieldStatus = remoteFieldStatus(phoneValidating, phoneValidation);
  const addressLine1Status = addressFieldVisualStatus(
    form.addressLine1,
    addressFieldStatus,
  );
  const addressLine2Status = addressFieldVisualStatus(
    form.addressLine2,
    addressFieldStatus,
  );
  const suburbStatus = addressFieldVisualStatus(form.suburb, addressFieldStatus);
  const stateStatus = addressFieldVisualStatus(form.state, addressFieldStatus);
  const postcodeStatus = addressFieldVisualStatus(
    form.postcode,
    addressFieldStatus,
  );

  const clearAddressValidation = () => {
    setAddressChecks([]);
    setAddressCleanResult(null);
    setAddressFieldStatus("idle");
    setValidationResults((current) =>
      current.filter((step) => !ADDRESS_METHODS.has(step.method)),
    );
  };

  return {
    form,
    manualEntry,
    addressFieldsLocked,
    searchLoading,
    validationResults,
    visibleSuggestions,
    emailStatus,
    phoneStatus,
    emailValidating,
    phoneValidating,
    emailFieldStatus,
    phoneFieldStatus,
    emailChecks,
    phoneChecks,
    addressChecks,
    addressFieldStatus,
    addressCleanResult,
    addressLine1Status,
    addressLine2Status,
    suburbStatus,
    stateStatus,
    postcodeStatus,
    updateField,
    setManualEntry,
    setAddressFieldsLocked,
    setAddressChecks,
    setAddressCleanResult,
    setAddressFieldStatus,
    handleAddressSelect,
    clearAddressValidation,
    confirmAddressOpen,
    setConfirmAddressOpen,
    formattedManualAddress,
    clearManualAddress,
    handleSaveManualAddress,
    handleConfirmProceed,
  };
}

function FormField({
  id,
  label,
  required = false,
  hint,
  status = "idle",
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string | null;
  status?: FieldStatus;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? (
        <p
          className={cn(
            "text-sm",
            status === "success" && "text-emerald-700 dark:text-emerald-400",
            status === "error" && "text-destructive",
            status === "warning" && "text-amber-700 dark:text-amber-400",
            status === "idle" && "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PersonalDetailsCard(props: {
  fields?: "both" | "email" | "phone";
  title?: string;
  description?: string;
  showFullName?: boolean;
  showDateOfBirth?: boolean;
  fullName?: string;
  dateOfBirth?: string;
  countryCode: string;
  email: string;
  mobile: string;
  emailStatus: string | null;
  phoneStatus: string | null;
  emailFieldStatus: FieldStatus;
  phoneFieldStatus: FieldStatus;
  onFullNameChange?: (value: string) => void;
  onDateOfBirthChange?: (value: string) => void;
  onCountryCodeChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onMobileChange: (value: string) => void;
}) {
  const fields = props.fields ?? "both";
  const showEmail = fields === "both" || fields === "email";
  const showPhone = fields === "both" || fields === "phone";

  return (
    <Card className="rounded-[12px] border border-border bg-card py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="text-base font-semibold text-heading">
          {props.title ?? "Personal Details"}
        </CardTitle>
        <CardDescription className="text-sm text-body">
          {props.description ?? "Contact information for this order"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pt-2 pb-5">
        {props.showFullName ? (
          <FormField id="fullName" label="Full name" required>
            <Input
              id="fullName"
              type="text"
              value={props.fullName ?? ""}
              placeholder="John Smith"
              autoComplete="name"
              onChange={(e) => props.onFullNameChange?.(e.target.value)}
            />
          </FormField>
        ) : null}

        {showEmail ? (
          <FormField
            id="email"
            label="Email address"
            required
            hint={props.emailStatus}
            status={props.emailFieldStatus}
          >
            <Input
              id="email"
              type="email"
              value={props.email}
              placeholder="you@example.com"
              onChange={(e) => props.onEmailChange(e.target.value)}
              {...fieldValidityProps(props.emailFieldStatus)}
            />
          </FormField>
        ) : null}

        {showPhone ? (
          <FormField
            id="mobile"
            label="Phone number"
            required
            hint={props.phoneStatus}
            status={props.phoneFieldStatus}
          >
            <PhoneInput
              id="mobile"
              international
              countries={["AU", "NZ"]}
              defaultCountry={
                (props.countryCode === "NZ" ? "NZ" : "AU") as Country
              }
              value={(props.mobile || undefined) as E164Number | undefined}
              placeholder="4 3312 3123"
              className="w-full"
              triggerClassName="h-11"
              onChange={(value) => props.onMobileChange(value ?? "")}
              onCountryChange={(country) => {
                if (country) props.onCountryCodeChange(country);
              }}
              {...fieldValidityProps(props.phoneFieldStatus)}
            />
          </FormField>
        ) : null}

        {props.showDateOfBirth ? (
          <FormField id="dateOfBirth" label="Date of birth" required>
            <Input
              id="dateOfBirth"
              type="date"
              value={props.dateOfBirth ?? ""}
              onChange={(e) => props.onDateOfBirthChange?.(e.target.value)}
            />
          </FormField>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AddressDetailsCard(props: {
  form: RegisterFormData;
  title?: string;
  description?: string;
  manualEntry: boolean;
  addressFieldsLocked: boolean;
  searchLoading: boolean;
  suggestions: AddressSuggestion[];
  addressLine1Status: FieldStatus;
  addressLine2Status: FieldStatus;
  suburbStatus: FieldStatus;
  stateStatus: FieldStatus;
  postcodeStatus: FieldStatus;
  confirmAddressOpen: boolean;
  formattedManualAddress: string;
  onConfirmAddressOpenChange: (open: boolean) => void;
  onClearManualAddress: () => void;
  onSaveManualAddress: () => void;
  onConfirmProceed: () => void;
  onFieldChange: <K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K],
  ) => void;
  onManualEntryChange: (checked: boolean) => void;
  onUnlockAddress: () => void;
  onAddressSelect: (suggestion: AddressSuggestion) => void;
}) {
  const showManualActions = props.manualEntry && !props.addressFieldsLocked;

  return (
    <Card className="overflow-visible rounded-[12px] border border-border bg-card py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="text-base font-semibold text-heading">
          {props.title ?? "Address Details"}
        </CardTitle>
        <CardDescription className="text-sm text-body">
          {props.description ?? "Where your order will be shipped"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-visible px-5 pb-5 pt-2">
        {!props.manualEntry ? (
          <div className="space-y-3">
            <div className="relative z-30">
              <FormField id="addressLookup" label="Address search">
                <Input
                  id="addressLookup"
                  value={props.form.addressLookup}
                  onChange={(e) =>
                    props.onFieldChange("addressLookup", e.target.value)
                  }
                  placeholder="Type your address here.."
                />
              </FormField>
              {props.searchLoading ? (
                <p className="text-sm text-muted-foreground">
                  Searching addresses...
                </p>
              ) : null}
              {props.suggestions.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                  {props.suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.AddressLine}-${suggestion.Postcode}`}
                      type="button"
                      onClick={() => props.onAddressSelect(suggestion)}
                      className="block w-full border-b border-border px-4 py-3 text-left text-sm text-body last:border-b-0 hover:bg-brand-subtle"
                    >
                      {suggestion.AddressLine}, {suggestion.Locality},{" "}
                      {suggestion.State} {suggestion.Postcode}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-sm text-body">
              Manually enter your address?{" "}
              <button
                type="button"
                onClick={() => props.onManualEntryChange(true)}
                className="font-medium text-brand hover:text-brand-hover"
              >
                Click Here
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {props.addressFieldsLocked ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Address filled from search — edit if you need to change
                </p>
                <button
                  type="button"
                  onClick={props.onUnlockAddress}
                  className="text-sm font-medium text-brand hover:text-brand-hover"
                >
                  Edit address
                </button>
              </div>
            ) : null}
            <FormField
              id="addressLine1"
              label="Address line 1"
              required
              status={props.addressLine1Status}
            >
              <Input
                id="addressLine1"
                value={props.form.addressLine1}
                disabled={props.addressFieldsLocked}
                placeholder={
                  !props.form.addressLine2.trim() ? "20 Bond St" : undefined
                }
                onChange={(e) =>
                  props.onFieldChange("addressLine1", e.target.value)
                }
                {...fieldValidityProps(props.addressLine1Status)}
              />
            </FormField>
            <FormField
              id="addressLine2"
              label="Address line 2"
              status={props.addressLine2Status}
            >
              <Input
                id="addressLine2"
                value={props.form.addressLine2}
                disabled={props.addressFieldsLocked}
                placeholder={
                  !props.form.addressLine1.trim()
                    ? "Suite 301, Level 3"
                    : undefined
                }
                onChange={(e) =>
                  props.onFieldChange("addressLine2", e.target.value)
                }
                {...fieldValidityProps(props.addressLine2Status)}
              />
            </FormField>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                id="suburb"
                label="Suburb"
                required
                status={props.suburbStatus}
              >
                <Input
                  id="suburb"
                  value={props.form.suburb}
                  disabled={props.addressFieldsLocked}
                  placeholder="Sydney"
                  onChange={(e) =>
                    props.onFieldChange("suburb", e.target.value)
                  }
                  {...fieldValidityProps(props.suburbStatus)}
                />
              </FormField>
              <FormField
                id="state"
                label="State"
                required
                status={props.stateStatus}
              >
                <Select
                  value={props.form.state}
                  disabled={props.addressFieldsLocked}
                  onValueChange={(value) => {
                    if (value) props.onFieldChange("state", value);
                  }}
                >
                  <SelectTrigger
                    id="state"
                    className="w-full"
                    disabled={props.addressFieldsLocked}
                    {...fieldValidityProps(props.stateStatus)}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {AU_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                id="postcode"
                label="Postcode"
                required
                status={props.postcodeStatus}
              >
                <Input
                  id="postcode"
                  value={props.form.postcode}
                  disabled={props.addressFieldsLocked}
                  placeholder="2000"
                  onChange={(e) =>
                    props.onFieldChange("postcode", e.target.value)
                  }
                  {...fieldValidityProps(props.postcodeStatus)}
                />
              </FormField>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-body font-medium">
                Want to search for your address?{" "}
                <button
                  type="button"
                  onClick={() => props.onManualEntryChange(false)}
                  className="font-medium text-brand hover:text-brand-hover"
                >
                  Click Here
                </button>
              </p>
              {showManualActions ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="h-10 px-3 text-base font-medium"
                    onClick={props.onClearManualAddress}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="h-10 px-3 text-base font-medium"
                    onClick={props.onSaveManualAddress}
                  >
                    Save
                  </Button>
                </div>
              ) : null}
            </div>
            {showManualActions ? (
              <AddressConfirmDialog
                open={props.confirmAddressOpen}
                onOpenChange={props.onConfirmAddressOpenChange}
                formattedAddress={props.formattedManualAddress}
                onProceed={props.onConfirmProceed}
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RegisterFormProps {
  toggles: ApiToggles;
  requestKey?: string;
  mode?: RegisterFormMode;
  onValidationResultsChange?: (results: ValidationStepResult[]) => void;
  onMissingApiKey?: () => void;
  onFullNameChange?: (value: string) => void;
  settingsOpen?: boolean;
  apiMethodsCollapsed?: boolean;
  onOpenApiMethods?: () => void;
}

export function RegisterForm({
  toggles,
  requestKey,
  mode = "full",
  onValidationResultsChange,
  onMissingApiKey,
  onFullNameChange,
  settingsOpen = false,
  apiMethodsCollapsed = false,
  onOpenApiMethods,
}: RegisterFormProps) {
  const {
    form,
    manualEntry,
    addressFieldsLocked,
    searchLoading,
    validationResults,
    visibleSuggestions,
    emailStatus,
    phoneStatus,
    emailFieldStatus,
    phoneFieldStatus,
    emailChecks,
    phoneChecks,
    addressChecks,
    addressFieldStatus,
    addressCleanResult,
    addressLine1Status,
    addressLine2Status,
    suburbStatus,
    stateStatus,
    postcodeStatus,
    updateField,
    setManualEntry,
    setAddressFieldsLocked,
    setAddressChecks,
    setAddressCleanResult,
    setAddressFieldStatus,
    handleAddressSelect,
    clearAddressValidation,
    confirmAddressOpen,
    setConfirmAddressOpen,
    formattedManualAddress,
    clearManualAddress,
    handleSaveManualAddress,
    handleConfirmProceed,
  } = useRegisterForm(toggles, requestKey, mode, onMissingApiKey, settingsOpen);

  const scenario = useShowcaseScenarioOptional();
  const useScenarioCopy = mode === "full";
  const contactCopy: Pick<
    ShowcaseScenarioConfig,
    | "contactTitle"
    | "contactDescription"
    | "showFullName"
    | "showDateOfBirth"
    | "addressTitle"
    | "addressDescription"
  > = useScenarioCopy
    ? scenario
    : {
        contactTitle: "Personal Details",
        contactDescription: "Contact information for this order",
        showFullName: false,
        showDateOfBirth: false,
        addressTitle: "Address Details",
        addressDescription: "Where your order will be shipped",
      };

  useEffect(() => {
    onValidationResultsChange?.(validationResults);
  }, [onValidationResultsChange, validationResults]);

  const showPersonal = mode === "full" || mode === "email" || mode === "phone";
  const showAddress = mode === "full" || mode === "address";
  const personalFields =
    mode === "email" ? "email" : mode === "phone" ? "phone" : "both";
  const activeChecks =
    mode === "email"
      ? emailChecks
      : mode === "phone"
        ? phoneChecks
        : mode === "address"
          ? addressChecks
          : addressFieldStatus === "warning"
            ? addressChecks
            : [];

  return (
    <div className="space-y-5" data-tour="form-details">
      {showPersonal ? (
        <PersonalDetailsCard
          fields={personalFields}
          title={contactCopy.contactTitle}
          description={contactCopy.contactDescription}
          showFullName={contactCopy.showFullName}
          showDateOfBirth={contactCopy.showDateOfBirth}
          fullName={form.fullName}
          dateOfBirth={form.dateOfBirth}
          countryCode={form.countryCode}
          email={form.email}
          mobile={form.mobile}
          emailStatus={emailStatus}
          phoneStatus={phoneStatus}
          emailFieldStatus={emailFieldStatus}
          phoneFieldStatus={phoneFieldStatus}
          onFullNameChange={(value) => {
            updateField("fullName", value);
            onFullNameChange?.(value);
          }}
          onDateOfBirthChange={(value) => updateField("dateOfBirth", value)}
          onCountryCodeChange={(value) => updateField("countryCode", value)}
          onEmailChange={(value) => updateField("email", value)}
          onMobileChange={(value) => updateField("mobile", value)}
        />
      ) : null}

      {showAddress ? (
        <AddressDetailsCard
          form={form}
          title={contactCopy.addressTitle}
          description={contactCopy.addressDescription}
          manualEntry={manualEntry}
          addressFieldsLocked={addressFieldsLocked}
          searchLoading={searchLoading}
          suggestions={visibleSuggestions}
          addressLine1Status={addressLine1Status}
          addressLine2Status={addressLine2Status}
          suburbStatus={suburbStatus}
          stateStatus={stateStatus}
          postcodeStatus={postcodeStatus}
          confirmAddressOpen={confirmAddressOpen}
          formattedManualAddress={formattedManualAddress}
          onConfirmAddressOpenChange={setConfirmAddressOpen}
          onClearManualAddress={clearManualAddress}
          onSaveManualAddress={handleSaveManualAddress}
          onConfirmProceed={() => void handleConfirmProceed()}
          onFieldChange={updateField}
          onManualEntryChange={(checked) => {
            setManualEntry(checked);
            setAddressFieldsLocked(false);
            setAddressCleanResult(null);
            setAddressFieldStatus("idle");
            setConfirmAddressOpen(false);
            if (!checked) setAddressChecks([]);
          }}
          onUnlockAddress={() => {
            setAddressFieldsLocked(false);
            clearAddressValidation();
          }}
          onAddressSelect={(suggestion) => void handleAddressSelect(suggestion)}
        />
      ) : null}

      {addressCleanResult ? (
        <AddressCleanedCard result={addressCleanResult} />
      ) : null}

      {activeChecks.length > 0 ? (
        <ValidationChecksCard
          checks={activeChecks}
          showOpenApiMethods={Boolean(apiMethodsCollapsed && onOpenApiMethods)}
          onOpenApiMethods={onOpenApiMethods}
        />
      ) : null}
    </div>
  );
}
