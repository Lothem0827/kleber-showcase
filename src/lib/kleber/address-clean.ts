export type AddressCleanTone = "same" | "removed" | "added";

export type AddressCleanSegment = {
  text: string;
  tone: AddressCleanTone;
};

export type AddressParts = {
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
};

export type AddressCleanResult = {
  beforeSegments: AddressCleanSegment[];
  afterSegments: AddressCleanSegment[];
};

/** Format address parts into a single display line. */
export function formatAddressLine(parts: AddressParts): string {
  const street = [parts.addressLine1.trim(), parts.addressLine2.trim()]
    .filter(Boolean)
    .join(", ");
  const locality = [parts.suburb.trim(), parts.state.trim(), parts.postcode.trim()]
    .filter(Boolean)
    .join(" ");
  return [street, locality].filter(Boolean).join(", ");
}

function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [];
}

function isWord(token: string): boolean {
  return /\S/.test(token);
}

/** Word-level LCS diff; case-sensitive so casing fixes count as changes. */
function diffTokens(
  beforeTokens: string[],
  afterTokens: string[],
): { before: AddressCleanSegment[]; after: AddressCleanSegment[] } {
  const beforeWords: { token: string; index: number }[] = [];
  const afterWords: { token: string; index: number }[] = [];

  beforeTokens.forEach((token, index) => {
    if (isWord(token)) beforeWords.push({ token, index });
  });
  afterTokens.forEach((token, index) => {
    if (isWord(token)) afterWords.push({ token, index });
  });

  const n = beforeWords.length;
  const m = afterWords.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => 0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (beforeWords[i - 1].token === afterWords[j - 1].token) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const matchedBefore = new Set<number>();
  const matchedAfter = new Set<number>();
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (beforeWords[i - 1].token === afterWords[j - 1].token) {
      matchedBefore.add(beforeWords[i - 1].index);
      matchedAfter.add(afterWords[j - 1].index);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const before: AddressCleanSegment[] = beforeTokens.map((token, index) => ({
    text: token,
    tone: !isWord(token) || matchedBefore.has(index) ? "same" : "removed",
  }));

  const after: AddressCleanSegment[] = afterTokens.map((token, index) => ({
    text: token,
    tone: !isWord(token) || matchedAfter.has(index) ? "same" : "added",
  }));

  return { before, after };
}

function mergeAdjacent(segments: AddressCleanSegment[]): AddressCleanSegment[] {
  const merged: AddressCleanSegment[] = [];
  for (const segment of segments) {
    const last = merged[merged.length - 1];
    if (last && last.tone === segment.tone) {
      last.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

/**
 * Build before/after highlight segments after RepairAddress.
 * Returns null when the formatted address is unchanged.
 */
export function buildAddressCleanResult(
  beforeParts: AddressParts,
  afterParts: AddressParts,
): AddressCleanResult | null {
  const beforeText = formatAddressLine(beforeParts);
  const afterText = formatAddressLine(afterParts);

  if (beforeText === afterText) return null;

  const { before, after } = diffTokens(
    tokenize(beforeText),
    tokenize(afterText),
  );

  const beforeSegments = mergeAdjacent(before);
  const afterSegments = mergeAdjacent(after);

  const hasHighlight =
    beforeSegments.some((s) => s.tone === "removed") ||
    afterSegments.some((s) => s.tone === "added");

  if (!hasHighlight) return null;

  return { beforeSegments, afterSegments };
}
