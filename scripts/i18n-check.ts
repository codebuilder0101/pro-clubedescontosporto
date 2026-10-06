/**
 * Fails (exit 1) if any message key is missing, empty or has mismatched ICU
 * arguments in any locale. Run with `npm run i18n:check`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultLocale, locales } from "../src/i18n/routing";
import { checkMessages } from "../src/lib/i18n-check";

const dir = join(process.cwd(), "messages");
const byLocale = Object.fromEntries(
  locales.map((locale) => [
    locale,
    JSON.parse(readFileSync(join(dir, `${locale}.json`), "utf8")),
  ]),
);

const issues = checkMessages(byLocale, defaultLocale);

if (issues.length > 0) {
  console.error(`i18n:check found ${issues.length} problem(s):`);
  for (const i of issues) console.error(`  [${i.locale}] ${i.key}: ${i.problem}`);
  process.exit(1);
}

console.log(`i18n:check OK (${locales.join(", ")})`);
