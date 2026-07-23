import type { Metadata } from "next";
import { ShowcaseScenarioHeader } from "@/components/showcase/ShowcaseScenarioHeader";
import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export const metadata: Metadata = {
  title: "Loqate Showcase",
  description:
    "End-to-end address, phone, and email validation with Loqate.",
};

export default function ShowcasePage() {
  return (
    <ValidationPageShell
      header={<ShowcaseScenarioHeader />}
      mode="full"
      showSideCards
      defaultTestApiKey={process.env.KLEBER_KEY?.trim() ?? ""}
    />
  );
}
