import type { Metadata } from "next";
import { ValidationPageHeader } from "@/components/register/ValidationPageHeader";
import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export const metadata: Metadata = {
  title: "Address Verify",
  description: "Validate and repair Australian addresses with Loqate.",
};

export default function AddressValidationPage() {
  return (
    <ValidationPageShell
      header={
        <ValidationPageHeader
          title="Address Verify"
          subtitle="Validate and repair Australian addresses with Loqate"
        />
      }
      mode="address"
      defaultTestApiKey={process.env.KLEBER_KEY?.trim() ?? ""}
    />
  );
}
