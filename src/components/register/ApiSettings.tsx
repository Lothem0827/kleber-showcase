"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveApiSettings } from "@/lib/kleber/settings";
import type { ApiSettingsState, ApiToggles } from "@/lib/kleber/types";

type ValidationItem = {
  key: keyof ApiToggles;
  title: string;
  methodLines: string[];
};

type ValidationGroup = {
  label: string;
  items: ValidationItem[];
};

const VALIDATION_GROUPS: ValidationGroup[] = [
  {
    label: "Email Validation",
    items: [
      {
        key: "verifyEmail",
        title: "BriteVerify.VerifyEmail",
        methodLines: ["DataTools.Verify.Email.BriteVerify.VerifyEmail"],
      },
    ],
  },
  {
    label: "Phone Validation",
    items: [
      {
        key: "verifyPhone",
        title: "ReachTel.VerifyPhoneNumberIsConnected",
        methodLines: [
          "DataTools.Verify.PhoneNumber.ReachTel.",
          "VerifyPhoneNumberIsConnected",
        ],
      },
    ],
  },
  {
    label: "Address Validation",
    items: [
      {
        key: "verifyAddress",
        title: "AuPaf.VerifyAddress",
        methodLines: ["DataTools.Verify.Address.AuPaf.VerifyAddress"],
      },
      {
        key: "gnafAppend",
        title: "Gnaf.Au.Append",
        methodLines: ["DataTools.Enhance.Address.Geocoding.Gnaf.Au.Append"],
      },
      {
        key: "appendToDpid",
        title: "Permissions and Delivery",
        methodLines: [
          "DataTools.Enhance.Address.PermissionsAndDelivery.",
          "AuPost.AppendToDpid",
        ],
      },
      {
        key: "createKeys",
        title: "CreateKeys",
        methodLines: ["DataTools.Match.Address.Au.CreateKeys"],
      },
    ],
  },
];

interface ApiSettingsProps {
  draft: ApiSettingsState;
  saved: ApiSettingsState;
  onDraftChange: (draft: ApiSettingsState) => void;
  onDiscard: () => void;
  onSavedChange: () => void;
}

export function ApiSettings({
  draft,
  saved,
  onDraftChange,
  onDiscard,
  onSavedChange,
}: ApiSettingsProps) {
  const updateToggle = (key: keyof ApiToggles, checked: boolean) => {
    onDraftChange({
      ...draft,
      toggles: { ...draft.toggles, [key]: checked },
    });
  };

  const handleSave = () => {
    saveApiSettings(draft);
    onSavedChange();
    toast.success("API settings saved");
  };

  const handleDiscard = () => {
    onDraftChange(saved);
    onDiscard();
    toast.message("Changes discarded");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DrawerHeader className="gap-1.5 px-8 pt-8 pb-0 text-left">
        <DrawerTitle className="text-2xl font-semibold text-heading">
          API Settings
        </DrawerTitle>
        <DrawerDescription className="text-base text-body text-balance">
          Configure your Kleber API credentials and choose which methods appear
          in the showcase.
        </DrawerDescription>
      </DrawerHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-8 pb-6">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="space-y-2">
              <Label htmlFor="testApiKey">
                Test API Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="testApiKey"
                type="password"
                autoComplete="off"
                value={draft.testApiKey}
                placeholder="Enter your Kleber test API key"
                onChange={(e) =>
                  onDraftChange({ ...draft, testApiKey: e.target.value })
                }
                className="border-input"
              />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-heading">
              Show or Hide Methods
            </h2>
            <div className="flex flex-col gap-5">
              {VALIDATION_GROUPS.map((group) => (
                <div key={group.label} className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  {group.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-base font-semibold text-heading">
                          {item.title}
                        </p>
                        <div className="font-mono text-xs text-body">
                          {item.methodLines.map((line) => (
                            <p key={line} className="leading-normal">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                      <Switch
                        checked={draft.toggles[item.key]}
                        onCheckedChange={(checked) =>
                          updateToggle(item.key, checked)
                        }
                        aria-label={`Toggle ${item.title}`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <DrawerFooter className="mt-0 flex-row justify-end gap-2 border-t border-border px-8 py-5">
        <Button
          type="button"
          variant="outline"
          onClick={handleDiscard}
          className="h-10 rounded-lg px-3 text-base font-medium text-body"
        >
          Discard
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          className="h-10 rounded-lg px-3 text-base font-medium"
        >
          Save
        </Button>
      </DrawerFooter>
    </div>
  );
}
