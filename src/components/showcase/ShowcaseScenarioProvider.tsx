"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_SHOWCASE_SCENARIO,
  getShowcaseScenario,
  type ShowcaseScenarioConfig,
  type ShowcaseScenarioId,
} from "@/lib/showcase/scenarios";
import {
  loadShowcaseScenario,
  saveShowcaseScenario,
  subscribeShowcaseScenario,
} from "@/lib/showcase/scenario-storage";

interface ShowcaseScenarioContextValue {
  scenarioId: ShowcaseScenarioId;
  scenario: ShowcaseScenarioConfig;
  setScenarioId: (id: ShowcaseScenarioId) => void;
}

const ShowcaseScenarioContext =
  createContext<ShowcaseScenarioContextValue | null>(null);

export function ShowcaseScenarioProvider({
  children,
}: {
  children: ReactNode;
}) {
  const scenarioId = useSyncExternalStore(
    subscribeShowcaseScenario,
    loadShowcaseScenario,
    () => DEFAULT_SHOWCASE_SCENARIO,
  );

  const setScenarioId = useCallback((id: ShowcaseScenarioId) => {
    saveShowcaseScenario(id);
  }, []);

  const value = useMemo(
    () => ({
      scenarioId,
      scenario: getShowcaseScenario(scenarioId),
      setScenarioId,
    }),
    [scenarioId, setScenarioId],
  );

  return (
    <ShowcaseScenarioContext.Provider value={value}>
      {children}
    </ShowcaseScenarioContext.Provider>
  );
}

export function useShowcaseScenario(): ShowcaseScenarioContextValue {
  const context = useContext(ShowcaseScenarioContext);
  if (!context) {
    throw new Error(
      "useShowcaseScenario must be used within ShowcaseScenarioProvider",
    );
  }
  return context;
}

/** Safe outside provider — defaults to Express Checkout config. */
export function useShowcaseScenarioOptional(): ShowcaseScenarioConfig {
  const context = useContext(ShowcaseScenarioContext);
  return context?.scenario ?? getShowcaseScenario(DEFAULT_SHOWCASE_SCENARIO);
}
