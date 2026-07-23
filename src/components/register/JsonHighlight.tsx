import { Fragment } from "react";
import { cn } from "@/lib/utils";

const TOKEN_CLASS = {
  key: "text-brand",
  string: "text-emerald-700 dark:text-emerald-400",
  number: "text-brand",
  boolean: "text-brand-dark",
  null: "text-muted-foreground",
  punctuation: "text-muted-foreground",
} as const;

type TokenType = keyof typeof TOKEN_CLASS;

const TOKEN_PATTERN =
  /("(?:\\.|[^"\\])*")\s*(:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}\[\],])/g;

function tokenizeJson(json: string): Array<{ type: TokenType; value: string }> {
  const tokens: Array<{ type: TokenType; value: string }> = [];
  let lastIndex = 0;

  for (const match of json.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: "punctuation", value: json.slice(lastIndex, index) });
    }

    const [full, stringLiteral, isKey, numberLiteral, keyword, punctuation] = match;

    if (stringLiteral !== undefined) {
      tokens.push({
        type: isKey ? "key" : "string",
        value: isKey ? full : stringLiteral,
      });
    } else if (numberLiteral !== undefined) {
      tokens.push({ type: "number", value: numberLiteral });
    } else if (keyword !== undefined) {
      tokens.push({
        type: keyword === "null" ? "null" : "boolean",
        value: keyword,
      });
    } else if (punctuation !== undefined) {
      tokens.push({ type: "punctuation", value: punctuation });
    } else {
      tokens.push({ type: "punctuation", value: full });
    }

    lastIndex = index + full.length;
  }

  if (lastIndex < json.length) {
    tokens.push({ type: "punctuation", value: json.slice(lastIndex) });
  }

  return tokens;
}

export function JsonHighlight({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  const json = JSON.stringify(value, null, 2);
  const tokens = tokenizeJson(json);

  return (
    <pre
      className={cn(
        "font-mono text-sm leading-relaxed text-body",
        className,
      )}
    >
      <code>
        {tokens.map((token, index) => (
          <Fragment key={`${token.type}-${index}`}>
            <span className={TOKEN_CLASS[token.type]}>{token.value}</span>
          </Fragment>
        ))}
      </code>
    </pre>
  );
}
