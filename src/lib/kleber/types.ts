export interface KleberRequest {
  method: string;
  params?: Record<string, string | number | undefined>;
  requestKey?: string;
}

export interface KleberAddressResult {
  AddressLine?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  AddressBlockLine1?: string;
  AddressBlockLine2?: string;
  AddressItem?: string;
  Locality?: string;
  State?: string;
  Postcode?: string;
  DPID?: string;
  MatchType?: string;
  MatchTypeDescription?: string;
  FieldChanges?: string;
  BuildingName?: string;
  AltLocality?: string;
  AltState?: string;
  AltPostcode?: string;
  StatusCode?: string;
  StatusDescription?: string;
  EmailAccount?: string;
  EmailDomain?: string;
  Connected?: string | boolean;
  Disposable?: string | boolean;
  RoleAddress?: string | boolean;
  Response?: string;
  RidNumber?: string;
  [key: string]: unknown;
}

export interface DtResponse {
  RequestId?: string;
  ResultCount?: string;
  ErrorMessage?: string;
  Result?: KleberAddressResult[];
}

export interface KleberResponse {
  DtResponse: DtResponse;
}

export interface AddressSuggestion {
  AddressLine: string;
  AddressLine1: string;
  AddressLine2: string;
  AddressItem: string;
  Locality: string;
  State: string;
  Postcode: string;
}

export interface RegisterFormData {
  countryCode: string;
  addressLookup: string;
  businessName: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
  mobile: string;
  email: string;
}

export interface ValidationStepResult {
  step: string;
  method: string;
  enabled: boolean;
  loading: boolean;
  error?: string;
  response?: KleberResponse;
}

export interface RemoteValidationResult {
  isValid: boolean;
  isWarning: boolean;
  statusCode?: string;
  statusDescription?: string;
}

export interface ApiToggles {
  verifyEmail: boolean;
  verifyPhone: boolean;
  verifyAddress: boolean;
  gnafAppend: boolean;
  appendToDpid: boolean;
  createKeys: boolean;
}

export interface ApiSettingsState {
  testApiKey: string;
  toggles: ApiToggles;
}
