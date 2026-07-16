"use client";

import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export default function PhoneValidationPage() {
  return (
    <ValidationPageShell
      title="Phone Validation"
      subtitle="Check whether a phone number is connected with Kleber"
      mode="phone"
    />
  );
}
