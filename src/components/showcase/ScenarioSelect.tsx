"use client";

import { ChevronUpDownIcon } from "@/components/icons/figma-icons";
import { useShowcaseScenario } from "@/components/showcase/ShowcaseScenarioProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SHOWCASE_SCENARIO_IDS,
  SHOWCASE_SCENARIOS,
  type ShowcaseScenarioId,
} from "@/lib/showcase/scenarios";

export function ScenarioSelect({ className }: { className?: string }) {
  const { scenarioId, setScenarioId } = useShowcaseScenario();

  return (
    <Select
      value={scenarioId}
      onValueChange={(value) => {
        if (value) setScenarioId(value as ShowcaseScenarioId);
      }}
    >
      <SelectTrigger
        data-tour="scenario-select"
        aria-label="Demo scenario"
        className={className ?? "min-w-[220px]"}
        icon={
          <ChevronUpDownIcon className="pointer-events-none size-4 text-muted-foreground dark:invert" />
        }
      >
        <SelectValue placeholder="Select scenario">
          {SHOWCASE_SCENARIOS[scenarioId].label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {SHOWCASE_SCENARIO_IDS.map((id) => (
          <SelectItem key={id} value={id}>
            {SHOWCASE_SCENARIOS[id].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
