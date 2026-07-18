"use client";

import { ValidationPageShell } from "@/components/register/ValidationPageShell";

export default function ShowcasePage() {
  return (
    <ValidationPageShell
      title="Kleber Showcase"
      subtitle="End-to-end address, phone, and email validation with Kleber"
      mode="full"
      showSideCards
    />
  );
}
