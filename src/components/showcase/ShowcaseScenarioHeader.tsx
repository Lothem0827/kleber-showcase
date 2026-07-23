"use client";

import { ScenarioSelect } from "@/components/showcase/ScenarioSelect";
import { useShowcaseScenario } from "@/components/showcase/ShowcaseScenarioProvider";
import { ValidationPageHeader } from "@/components/register/ValidationPageHeader";

export function ShowcaseScenarioHeader() {
  const { scenario } = useShowcaseScenario();

  return (
    <ValidationPageHeader
      title={scenario.title}
      subtitle={scenario.subtitle}
      actions={<ScenarioSelect />}
    />
  );
}
