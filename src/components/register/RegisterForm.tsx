"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { buildAddressChecks } from "@/lib/kleber/address-checks";
import {
  buildAddressCleanResult,
  type AddressCleanResult,
} from "@/lib/kleber/address-clean";
import type { ValidationCheckItem } from "@/lib/kleber/validation-checks";
import { cn } from "@/lib/utils";
import type { Country, Value as E164Number } from "react-phone-number-input";
import { AddressCleanedCard } from "@/components/register/AddressCleanedCard";
import { ValidationChecksCard } from "@/components/register/ValidationChecksCard";

type FieldStatus = "idle" | "success" | "error";

export type RegisterFormMode = "full" | "address" | "phone" | "email";

function remoteFieldStatus(
  validating: boolean,
  validation: RemoteValidationResult | null,
): FieldStatus {
  if (validating || !validation) return "idle";
  return validation.isValid ? "success" : "error";
}

function requiredFieldStatus(
  value: string,
  submitAttempted: boolean,
): FieldStatus {
  if (value.trim()) return "success";
  if (submitAttempted) return "error";
  return "idle";
}

function fieldValidityProps(status: FieldStatus) {
  return {
    "aria-invalid": status === "error" || undefined,
    "data-valid": status === "success" ? true : undefined,
  } as const;
}

const INITIAL_FORM: RegisterFormData = {
  countryCode: "AU",
  addressLookup: "",
  businessName: "",
  addressLine1: "",
  addressLine2: "",
  suburb: "",
  state: "",
  postcode: "",
  mobile: "",
  email: "",
};

function useRegisterForm(
  toggles: ApiToggles,
  requestKey?: string,
  mode: RegisterFormMode = "full",
) {
  const [form, setForm] = useState<RegisterFormData>(INITIAL_FORM);
  const [manualEntry, setManualEntry] = useState(false);
  const [addressFieldsLocked, setAddressFieldsLocked] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationResults, setValidationResults] = useState<
    ValidationStepResult[]
  >([]);
  const [emailValidation, setEmailValidation] =
    useState<RemoteValidationResult | null>(null);
  const [emailChecks, setEmailChecks] = useState<ValidationCheckItem[]>([]);
  const [phoneChecks, setPhoneChecks] = useState<ValidationCheckItem[]>([]);
  const [addressChecks, setAddressChecks] = useState<ValidationCheckItem[]>([]);
  const [addressCleanResult, setAddressCleanResult] =
    useState<AddressCleanResult | null>(null);
  const [phoneValidation, setPhoneValidation] =
    useState<RemoteValidationResult | null>(null);
  const [emailValidating, setEmailValidating] = useState(false);
  const [phoneValidating, setPhoneValidating] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const debouncedAddressQuery = useDebounce(form.addressLookup, 350);
  const debouncedEmail = useDebounce(form.email, 500);
  const debouncedPhone = useDebounce(form.mobile, 500);

  const kleber = useCallback(
    (
      method: string,
      params: Record<string, string | number | undefined> = {},
    ) => callKleber(method, params, { requestKey }),
    [requestKey],
  );

  const updateField = <K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));

    if (key === "addressLookup" && String(value).length < 3) {
      setSuggestions([]);
    }
    if (key === "email" && (!value || !String(value).includes("@"))) {
      setEmailValidation(null);
      setEmailChecks([]);
    }
    if (key === "mobile" && String(value).replace(/\D/g, "").length < 8) {
      setPhoneValidation(null);
      setPhoneChecks([]);
    }
  };

  useEffect(() => {
    if (manualEntry || debouncedAddressQuery.length < 3) return;

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
  }, [debouncedAddressQuery, kleber, manualEntry]);

  useEffect(() => {
    if (!debouncedEmail || !debouncedEmail.includes("@")) {
      return;
    }
    let cancelled = false;
    async function validateEmail() {
      setEmailValidating(true);
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
        }
      } finally {
        if (!cancelled) setEmailValidating(false);
      }
    }
    void validateEmail();
    return () => {
      cancelled = true;
    };
  }, [debouncedEmail, kleber]);

  useEffect(() => {
    if (!debouncedPhone || debouncedPhone.replace(/\D/g, "").length < 8) {
      return;
    }
    let cancelled = false;
    async function validatePhone() {
      setPhoneValidating(true);
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
        }
      } finally {
        if (!cancelled) setPhoneValidating(false);
      }
    }
    void validatePhone();
    return () => {
      cancelled = true;
    };
  }, [debouncedPhone, form.countryCode, kleber]);

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
        const parts = (repaired.AddressLine ?? suggestion.AddressLine).split(
          ",",
        );
        const buildingName = String(repaired.BuildingName || "").trim();
        const streetLine = parts[0]?.trim() || suggestion.AddressLine1 || "";
        const line1 = buildingName || streetLine || suggestion.AddressLine;
        updateField("addressLookup", line1);
        updateField("addressLine1", line1);
        updateField(
          "addressLine2",
          buildingName
            ? streetLine
            : parts.length > 1
              ? parts[1].trim()
              : suggestion.AddressLine2,
        );
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
      }
    } catch (error) {
      setAddressChecks([]);
      toast.error(
        error instanceof Error ? error.message : "Address repair failed",
      );
    }
  };

  const updateStep = (index: number, patch: Partial<ValidationStepResult>) => {
    setValidationResults((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step,
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
    const steps: ValidationStepResult[] = [
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
    setValidationResults(steps);

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
      updateStep(0, { loading: true });
      try {
        verifyResponse = await kleber(
          KLEBER_METHODS.VERIFY_ADDRESS,
          addressPayload,
        );
        updateStep(0, { loading: false, response: verifyResponse });
        setAddressChecks(
          buildAddressChecks(
            getFirstResult<KleberAddressResult>(verifyResponse),
          ),
        );
      } catch (error) {
        updateStep(0, {
          loading: false,
          error: error instanceof Error ? error.message : "Verify failed",
        });
        throw error;
      }
    }

    if (toggles.gnafAppend) {
      updateStep(1, { loading: true });
      try {
        const response = await kleber(
          KLEBER_METHODS.GNAF_APPEND,
          addressPayload,
        );
        updateStep(1, { loading: false, response });
      } catch (error) {
        updateStep(1, {
          loading: false,
          error: error instanceof Error ? error.message : "GNAF append failed",
        });
      }
    }

    if (toggles.appendToDpid) {
      updateStep(2, { loading: true });
      try {
        const dpid =
          getFirstResult<KleberAddressResult>(
            verifyResponse ?? { DtResponse: {} },
          )?.DPID ?? "";
        if (!dpid) throw new Error("DPID not available from verify step");
        const response = await kleber(KLEBER_METHODS.APPEND_TO_DPID, {
          DPID: dpid,
        });
        updateStep(2, { loading: false, response });
      } catch (error) {
        updateStep(2, {
          loading: false,
          error:
            error instanceof Error ? error.message : "Append to DPID failed",
        });
      }
    }

    if (toggles.createKeys) {
      updateStep(3, { loading: true });
      try {
        const addressLine3 =
          !line2 && suburb ? `${suburb} ${state} ${postcode}`.trim() : "";
        const response = await kleber(KLEBER_METHODS.CREATE_KEYS, {
          AddressLine1: line1,
          AddressLine2: line2,
          AddressLine3: addressLine3,
        });
        updateStep(3, { loading: false, response });
      } catch (error) {
        updateStep(3, {
          loading: false,
          error: error instanceof Error ? error.message : "Create keys failed",
        });
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);

    const needsEmail = mode === "full" || mode === "email";
    const needsPhone = mode === "full" || mode === "phone";
    const needsAddress = mode === "full" || mode === "address";

    if (needsEmail && !form.email.trim()) {
      toast.error("Please provide an email address");
      return;
    }
    if (needsPhone && !form.mobile.trim()) {
      toast.error("Please provide a phone number");
      return;
    }
    if (
      needsAddress &&
      (!form.addressLine1.trim() ||
        !form.suburb ||
        !form.state ||
        !form.postcode)
    ) {
      toast.error("Please complete the address fields");
      return;
    }
    if (needsEmail && emailValidation && !emailValidation.isValid) {
      toast.error("Please provide a valid email address");
      return;
    }
    if (needsPhone && phoneValidation && !phoneValidation.isValid) {
      toast.error("Please provide a valid phone number");
      return;
    }

    if (mode === "email") {
      toast.success("Email validation completed");
      return;
    }
    if (mode === "phone") {
      toast.success("Phone validation completed");
      return;
    }

    setSubmitting(true);
    setAddressCleanResult(null);
    try {
      let addressWasCleaned = false;
      let repairedParts:
        | {
            addressLine1: string;
            addressLine2: string;
            suburb: string;
            state: string;
            postcode: string;
          }
        | undefined;
      if (manualEntry) {
        const beforeParts = {
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          suburb: form.suburb,
          state: form.state,
          postcode: form.postcode,
        };
        const repairResponse = await kleber(KLEBER_METHODS.REPAIR_ADDRESS, {
          AddressLine1: form.addressLine1,
          AddressLine2: form.addressLine2,
          Locality: form.suburb,
          State: form.state,
          Postcode: form.postcode,
        });
        const repaired = getFirstResult<KleberAddressResult>(repairResponse);
        if (repaired) {
          const parts = String(repaired.AddressLine ?? form.addressLine1).split(
            ",",
          );
          const buildingName = String(repaired.BuildingName || "").trim();
          const streetLine = parts[0]?.trim() || form.addressLine1;
          repairedParts = {
            addressLine1: buildingName || streetLine || form.addressLine1,
            addressLine2: buildingName
              ? streetLine
              : parts.length > 1
                ? parts[1].trim()
                : form.addressLine2,
            suburb: String(repaired.Locality ?? form.suburb),
            state: String(repaired.State ?? form.state),
            postcode: String(repaired.Postcode ?? form.postcode),
          };
          setForm((current) => ({
            ...current,
            ...repairedParts,
          }));
          const cleanResult = buildAddressCleanResult(
            beforeParts,
            repairedParts,
          );
          if (cleanResult) {
            setAddressCleanResult(cleanResult);
            addressWasCleaned = true;
          }
          setAddressFieldsLocked(true);
        }
      }
      await runValidationChain(repairedParts);
      toast.success(
        addressWasCleaned
          ? "Address cleaned into the standard postal format"
          : mode === "address"
            ? "Address validation completed"
            : "Registration validation completed",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Validation chain failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

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
  const addressLine1Status = requiredFieldStatus(
    form.addressLine1,
    submitAttempted,
  );
  const addressLine2Status: FieldStatus = form.addressLine2.trim()
    ? "success"
    : "idle";
  const suburbStatus = requiredFieldStatus(form.suburb, submitAttempted);
  const stateStatus = requiredFieldStatus(form.state, submitAttempted);
  const postcodeStatus = requiredFieldStatus(form.postcode, submitAttempted);

  return {
    form,
    manualEntry,
    addressFieldsLocked,
    searchLoading,
    submitting,
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
    handleAddressSelect,
    handleSubmit,
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
  countryCode: string;
  email: string;
  mobile: string;
  emailStatus: string | null;
  phoneStatus: string | null;
  emailFieldStatus: FieldStatus;
  phoneFieldStatus: FieldStatus;
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
          Personal Details
        </CardTitle>
        <CardDescription className="text-sm text-body">
          Contact information for this order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pt-2 pb-5">
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
      </CardContent>
    </Card>
  );
}

function AddressDetailsCard(props: {
  form: RegisterFormData;
  manualEntry: boolean;
  addressFieldsLocked: boolean;
  searchLoading: boolean;
  suggestions: AddressSuggestion[];
  addressLine1Status: FieldStatus;
  addressLine2Status: FieldStatus;
  suburbStatus: FieldStatus;
  stateStatus: FieldStatus;
  postcodeStatus: FieldStatus;
  onFieldChange: <K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K],
  ) => void;
  onManualEntryChange: (checked: boolean) => void;
  onUnlockAddress: () => void;
  onAddressSelect: (suggestion: AddressSuggestion) => void;
}) {
  return (
    <Card className="overflow-visible rounded-[12px] border border-border bg-card py-0 shadow-none">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="text-base font-semibold text-heading">
          Address Details
        </CardTitle>
        <CardDescription className="text-sm text-body">
          Where your order will be shipped
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
                  Address filled from search — edit if you need to change a unit
                  or level.
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
                placeholder="20 Bond St"
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
                placeholder="Suite 301, Level 3"
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
}

export function RegisterForm({
  toggles,
  requestKey,
  mode = "full",
  onValidationResultsChange,
}: RegisterFormProps) {
  const {
    form,
    manualEntry,
    addressFieldsLocked,
    searchLoading,
    submitting,
    validationResults,
    visibleSuggestions,
    emailStatus,
    phoneStatus,
    emailFieldStatus,
    phoneFieldStatus,
    emailChecks,
    phoneChecks,
    addressChecks,
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
    handleAddressSelect,
    handleSubmit,
  } = useRegisterForm(toggles, requestKey, mode);

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
          : [];

  return (
    <div className="space-y-5" data-tour="form-details">
      {showPersonal ? (
        <PersonalDetailsCard
          fields={personalFields}
          countryCode={form.countryCode}
          email={form.email}
          mobile={form.mobile}
          emailStatus={emailStatus}
          phoneStatus={phoneStatus}
          emailFieldStatus={emailFieldStatus}
          phoneFieldStatus={phoneFieldStatus}
          onCountryCodeChange={(value) => updateField("countryCode", value)}
          onEmailChange={(value) => updateField("email", value)}
          onMobileChange={(value) => updateField("mobile", value)}
        />
      ) : null}

      {showAddress ? (
        <AddressDetailsCard
          form={form}
          manualEntry={manualEntry}
          addressFieldsLocked={addressFieldsLocked}
          searchLoading={searchLoading}
          suggestions={visibleSuggestions}
          addressLine1Status={addressLine1Status}
          addressLine2Status={addressLine2Status}
          suburbStatus={suburbStatus}
          stateStatus={stateStatus}
          postcodeStatus={postcodeStatus}
          onFieldChange={updateField}
          onManualEntryChange={(checked) => {
            setManualEntry(checked);
            setAddressFieldsLocked(false);
            setAddressCleanResult(null);
            if (!checked) setAddressChecks([]);
          }}
          onUnlockAddress={() => {
            setAddressFieldsLocked(false);
            setAddressChecks([]);
            setAddressCleanResult(null);
          }}
          onAddressSelect={(suggestion) => void handleAddressSelect(suggestion)}
        />
      ) : null}

      {addressCleanResult ? (
        <AddressCleanedCard result={addressCleanResult} />
      ) : null}

      {activeChecks.length > 0 ? (
        <ValidationChecksCard checks={activeChecks} />
      ) : null}

      {mode === "full" || mode === "address" ? (
        <div className="flex items-center gap-4" data-tour="validate-button">
          <Button
            type="button"
            variant="default"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="h-10 rounded-lg bg-primary px-4 text-primary-foreground hover:bg-brand-hover"
          >
            {submitting ? "Validating..." : "Validate Details"}
          </Button>
          <p className="text-sm text-body">
            Runs the Kleber validation chain after the form is confirmed.
          </p>
        </div>
      ) : null}
    </div>
  );
}
