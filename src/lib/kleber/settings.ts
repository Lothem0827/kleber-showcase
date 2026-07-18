import type { ApiSettingsState, ApiToggles } from "@/lib/kleber/types";

export const API_SETTINGS_STORAGE_KEY = "kleber-api-settings";
export const API_SETTINGS_EVENT = "kleber-api-settings";

export const DEFAULT_TOGGLES: ApiToggles = {
  verifyEmail: true,
  verifyPhone: true,
  verifyAddress: true,
  gnafAppend: true,
  appendToDpid: true,
  createKeys: true,
};

export const DEFAULT_API_SETTINGS: ApiSettingsState = {
  testApiKey: "",
  toggles: DEFAULT_TOGGLES,
};

let cachedRaw: string | null | undefined;
let cachedValue: ApiSettingsState = DEFAULT_API_SETTINGS;

function parseSettings(raw: string | null): ApiSettingsState {
  if (!raw) return DEFAULT_API_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<ApiSettingsState>;
    return {
      testApiKey: typeof parsed.testApiKey === "string" ? parsed.testApiKey : "",
      toggles: {
        verifyEmail: parsed.toggles?.verifyEmail ?? true,
        verifyPhone: parsed.toggles?.verifyPhone ?? true,
        verifyAddress: parsed.toggles?.verifyAddress ?? true,
        gnafAppend: parsed.toggles?.gnafAppend ?? true,
        appendToDpid: parsed.toggles?.appendToDpid ?? true,
        createKeys: parsed.toggles?.createKeys ?? true,
      },
    };
  } catch {
    return DEFAULT_API_SETTINGS;
  }
}

export function loadApiSettings(): ApiSettingsState {
  if (typeof window === "undefined") {
    return DEFAULT_API_SETTINGS;
  }

  const raw = localStorage.getItem(API_SETTINGS_STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedValue;
  }

  cachedRaw = raw;
  cachedValue = parseSettings(raw);
  return cachedValue;
}

export function saveApiSettings(settings: ApiSettingsState) {
  const raw = JSON.stringify(settings);
  localStorage.setItem(API_SETTINGS_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedValue = settings;
  window.dispatchEvent(new Event(API_SETTINGS_EVENT));
}

export function subscribeApiSettings(onStoreChange: () => void) {
  window.addEventListener(API_SETTINGS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(API_SETTINGS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
