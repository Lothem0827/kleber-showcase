export const SHOWCASE_SCENARIO_IDS = [
  "expressCheckout",
  "loanApplication",
] as const;

export type ShowcaseScenarioId = (typeof SHOWCASE_SCENARIO_IDS)[number];

export type SideCardSet = "checkout" | "loan";

export interface ShowcaseScenarioConfig {
  id: ShowcaseScenarioId;
  label: string;
  title: string;
  subtitle: string;
  contactTitle: string;
  contactDescription: string;
  addressTitle: string;
  addressDescription: string;
  showFullName: boolean;
  showDateOfBirth: boolean;
  sideCards: SideCardSet;
}

export const DEFAULT_SHOWCASE_SCENARIO: ShowcaseScenarioId = "expressCheckout";

export const SHOWCASE_SCENARIOS: Record<
  ShowcaseScenarioId,
  ShowcaseScenarioConfig
> = {
  expressCheckout: {
    id: "expressCheckout",
    label: "Express Checkout",
    title: "Express Checkout",
    subtitle: "Confirm contact and delivery details before you pay",
    contactTitle: "Contact",
    contactDescription: "We'll use these details for receipts and delivery updates",
    addressTitle: "Shipping address",
    addressDescription: "Where should we send your order?",
    showFullName: true,
    showDateOfBirth: false,
    sideCards: "checkout",
  },
  loanApplication: {
    id: "loanApplication",
    label: "Loan Application",
    title: "Loan Application",
    subtitle: "Confirm contact and residential details to continue",
    contactTitle: "Applicant",
    contactDescription: "Details for this loan application",
    addressTitle: "Residential address",
    addressDescription: "Address where you currently live",
    showFullName: true,
    showDateOfBirth: true,
    sideCards: "loan",
  },
};

export function isShowcaseScenarioId(
  value: string | null | undefined,
): value is ShowcaseScenarioId {
  return (
    value === "expressCheckout" || value === "loanApplication"
  );
}

export function getShowcaseScenario(
  id: ShowcaseScenarioId = DEFAULT_SHOWCASE_SCENARIO,
): ShowcaseScenarioConfig {
  return SHOWCASE_SCENARIOS[id];
}
