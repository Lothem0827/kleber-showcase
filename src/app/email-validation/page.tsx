"use client";

import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export default function EmailValidationPage() {
  return (
    <ValidationPageShell
      title="Email Validation"
      subtitle="Verify email deliverability with Kleber"
      mode="email"
    />
  );
}
