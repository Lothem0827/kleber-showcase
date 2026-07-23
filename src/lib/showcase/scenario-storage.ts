import {
  DEFAULT_SHOWCASE_SCENARIO,
  isShowcaseScenarioId,
  type ShowcaseScenarioId,
} from "@/lib/showcase/scenarios";

export const SHOWCASE_SCENARIO_STORAGE_KEY = "kleber-showcase-scenario";
export const SHOWCASE_SCENARIO_EVENT = "kleber-showcase-scenario";

export function loadShowcaseScenario(): ShowcaseScenarioId {
  if (typeof window === "undefined") {
    return DEFAULT_SHOWCASE_SCENARIO;
  }

  const raw = localStorage.getItem(SHOWCASE_SCENARIO_STORAGE_KEY);
  return isShowcaseScenarioId(raw) ? raw : DEFAULT_SHOWCASE_SCENARIO;
}

export function saveShowcaseScenario(scenario: ShowcaseScenarioId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHOWCASE_SCENARIO_STORAGE_KEY, scenario);
  window.dispatchEvent(new Event(SHOWCASE_SCENARIO_EVENT));
}

export function subscribeShowcaseScenario(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === SHOWCASE_SCENARIO_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };

  window.addEventListener(SHOWCASE_SCENARIO_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SHOWCASE_SCENARIO_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}
