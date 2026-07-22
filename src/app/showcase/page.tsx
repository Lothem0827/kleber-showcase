import type { Metadata } from "next";
import { ValidationPageHeader } from "@/components/register/ValidationPageHeader";
import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export const metadata: Metadata = {
  title: "Loqate Showcase",
  description:
    "End-to-end address, phone, and email validation with Loqate.",
};

export default function ShowcasePage() {
  return (
    <ValidationPageShell
      header={
        <ValidationPageHeader
          title="Loqate Showcase"
          subtitle="End-to-end address, phone, and email validation with Loqate"
        />
      }
      mode="full"
      showSideCards
      defaultTestApiKey={process.env.KLEBER_KEY?.trim() ?? ""}
    />
  );
}
