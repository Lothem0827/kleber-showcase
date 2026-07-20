import type { Metadata } from "next";
import { ValidationPageHeader } from "@/components/register/ValidationPageHeader";
import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export const metadata: Metadata = {
  title: "Kleber Showcase",
  description:
    "End-to-end address, phone, and email validation with Kleber.",
};

export default function ShowcasePage() {
  return (
    <ValidationPageShell
      header={
        <ValidationPageHeader
          title="Kleber Showcase"
          subtitle="End-to-end address, phone, and email validation with Kleber"
        />
      }
      mode="full"
      showSideCards
      defaultTestApiKey={process.env.KLEBER_KEY?.trim() ?? ""}
    />
  );
}
