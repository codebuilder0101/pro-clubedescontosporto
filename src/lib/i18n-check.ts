import {
  isLiteralElement,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTagElement,
  parse,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";

type Messages ={ [key: string]: string | Messages };

export type I18nIssue = { locale: string; key: string; problem: string };

/** Flattens nested messages into dotted keys: { "Hero.title": "..." }. */
export function flatten(messages: Messages, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(messages)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

/**
 * ICU argument names used in a message ("{count, plural, ...}" -> "count"),
 * including arguments nested inside plural/select branches and rich-text tags.
 * Throws if the message is not valid ICU syntax.
 */
export function placeholders(message: string): string[] {
  const names = new Set<string>();
  const walk = (elements: MessageFormatElement[]) => {
    for (const el of elements) {
      if (isLiteralElement(el) || isPoundElement(el)) continue;
      if (isTagElement(el)) {
        walk(el.children);
        continue;
      }
      names.add(el.value);
      if (isPluralElement(el) || isSelectElement(el)) {
        for (const option of Object.values(el.options)) walk(option.value);
      }
    }
  };
  walk(parse(message));
  return [...names].sort();
}

/**
 * Every locale must have every key that any locale has, with a non-empty
 * string value and the same ICU arguments as the reference locale.
 */
export function checkMessages(
  byLocale: Record<string, Messages>,
  referenceLocale: string,
): I18nIssue[] {
  const flat = Object.fromEntries(
    Object.entries(byLocale).map(([locale, m]) => [locale, flatten(m)]),
  );
  const allKeys = new Set(Object.values(flat).flatMap((f) => Object.keys(f)));
  const reference = flat[referenceLocale] ?? {};
  const issues: I18nIssue[] = [];

  for (const [locale, messages] of Object.entries(flat)) {
    for (const key of [...allKeys].sort()) {
      const value = messages[key];
      if (value === undefined) {
        issues.push({ locale, key, problem: "missing" });
      } else if (typeof value !== "string") {
        issues.push({ locale, key, problem: "not a string" });
      } else if (value.trim() === "") {
        issues.push({ locale, key, problem: "empty" });
      } else {
        let actual: string;
        try {
          actual = placeholders(value).join(", ");
        } catch {
          issues.push({ locale, key, problem: "invalid ICU message syntax" });
          continue;
        }
        if (locale === referenceLocale || typeof reference[key] !== "string") continue;
        let expected: string;
        try {
          expected = placeholders(reference[key] as string).join(", ");
        } catch {
          continue; // reported when the reference locale itself is checked
        }
        if (expected !== actual) {
          issues.push({
            locale,
            key,
            problem: `placeholders {${actual}} differ from ${referenceLocale} {${expected}}`,
          });
        }
      }
    }
  }
  return issues;
}
