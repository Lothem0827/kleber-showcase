"use client";

import { MapPin } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AddressConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formattedAddress: string;
  onProceed: () => void;
};

export function AddressConfirmDialog({
  open,
  onOpenChange,
  formattedAddress,
  onProceed,
}: AddressConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
        <div className="flex flex-col gap-2">
          <AlertDialogHeader className="grid-rows-[auto] place-items-start gap-0 p-0 text-left">
            <AlertDialogTitle className="text-lg font-semibold leading-snug text-heading">
              Are you sure this is your address?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex items-start gap-2 text-sm text-body">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="leading-relaxed">{formattedAddress}</p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            type="button"
            className="h-10 rounded-lg px-3 text-base font-medium text-body"
          >
            Edit address
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            className="h-10 rounded-lg px-3 text-base font-medium"
            onClick={onProceed}
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
