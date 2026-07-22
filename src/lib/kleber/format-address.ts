export type AddressParts = {
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
};

export function formatAddressLine(parts: AddressParts): string {
  return [
    parts.addressLine1,
    parts.addressLine2,
    parts.suburb,
    parts.state,
    parts.postcode,
  ]
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(" ");
}

export function isAddressComplete(parts: AddressParts): boolean {
  return (
    Boolean(parts.addressLine1.trim()) &&
    Boolean(parts.suburb.trim()) &&
    Boolean(parts.state.trim()) &&
    Boolean(parts.postcode.trim())
  );
}
