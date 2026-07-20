import type { Metadata } from "next";
import { ValidationPageHeader } from "@/components/register/ValidationPageHeader";
import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export const metadata: Metadata = {
  title: "Email Validation",
  description: "Verify email deliverability with Kleber.",
};

export default function EmailValidationPage() {
  return (
    <ValidationPageShell
      header={
        <ValidationPageHeader
          title="Email Validation"
          subtitle="Verify email deliverability with Kleber"
        />
      }
      mode="email"
      defaultTestApiKey={process.env.KLEBER_KEY?.trim() ?? ""}
    />
  );
}
