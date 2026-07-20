import type { Metadata } from "next";
import { ValidationPageHeader } from "@/components/register/ValidationPageHeader";
import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export const metadata: Metadata = {
  title: "Address Validation",
  description: "Validate and repair Australian addresses with Kleber.",
};

export default function AddressValidationPage() {
  return (
    <ValidationPageShell
      header={
        <ValidationPageHeader
          title="Address Validation"
          subtitle="Validate and repair Australian addresses with Kleber"
        />
      }
      mode="address"
      defaultTestApiKey={process.env.KLEBER_KEY?.trim() ?? ""}
    />
  );
}
