import type { Metadata } from "next";
import { ValidationPageHeader } from "@/components/register/ValidationPageHeader";
import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export const metadata: Metadata = {
  title: "Phone Validation",
  description: "Check whether a phone number is connected with Loqate.",
};

export default function PhoneValidationPage() {
  return (
    <ValidationPageShell
      header={
        <ValidationPageHeader
          title="Phone Validation"
          subtitle="Check whether a phone number is connected with Loqate"
        />
      }
      mode="phone"
      defaultTestApiKey={process.env.KLEBER_KEY?.trim() ?? ""}
    />
  );
}
