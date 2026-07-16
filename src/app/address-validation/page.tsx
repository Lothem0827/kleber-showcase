"use client";

import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export default function AddressValidationPage() {
  return (
    <ValidationPageShell
      title="Address Validation"
      subtitle="Validate and repair Australian addresses with Kleber"
      mode="address"
    />
  );
}
