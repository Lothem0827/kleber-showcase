export const KLEBER_METHODS = {
  SEARCH_ADDRESS:
    "DataTools.Capture.Address.Predictive.AuPaf.SearchAddress",
  REPAIR_ADDRESS: "DataTools.Repair.Address.AuPaf.RepairAddress",
  VERIFY_ADDRESS: "DataTools.Verify.Address.AuPaf.VerifyAddress",
  GNAF_APPEND: "DataTools.Enhance.Address.Geocoding.Gnaf.Au.Append",
  APPEND_TO_DPID:
    "DataTools.Enhance.Address.PermissionsAndDelivery.AuPost.AppendToDpid",
  CREATE_KEYS: "DataTools.Match.Address.Au.CreateKeys",
  VERIFY_EMAIL: "DataTools.Verify.Email.BriteVerify.VerifyEmail",
  VERIFY_PHONE:
    "DataTools.Verify.PhoneNumber.ReachTel.VerifyPhoneNumberIsConnected",
} as const;

export const DEFAULT_KLEBER_URL =
  "https://kleber.datatoolscloud.net.au/KleberWebService/DtKleberService.svc/ProcessQueryStringRequest";

export const AU_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "WA", label: "Western Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "NT", label: "Northern Territory" },
  { value: "ACT", label: "Australian Capital Territory" },
] as const;
