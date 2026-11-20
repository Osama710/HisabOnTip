import { extractDate } from "./dates";
import { classify, detectAccounts, Rule, TxType } from "./classify";
import { Command, Lang, matchCommand } from "./commands";
import { extractEntries, hasAmount } from "./entries";
import { normalize, tokenize } from "./text";
import { YMD } from "../time";

export type { Command, Lang, Rule };
export { resolveCategory } from "./classify";
export { normalize } from "./text";

export type ParsedEntry = {
  type: TxType; amount: number; category: string; note: string; date: YMD | null; account: string | null;
};
export type Ctx = { now: Date; tz: string; rules: Rule[] };
export type Parsed =
  | { kind: "command"; command: Command }
  | { kind: "entries"; entries: ParsedEntry[] }
  | { kind: "greeting" }
  | { kind: "thanks" }
  | { kind: "unknown" };

const GREET = new Set(
  ("hi hello hey hy hii hola salam salaam assalam assalamualaikum assalamoalaikum aoa o alaikum walaikum walaikumassalam " +
    "start السلام علیکم سلام ہیلو ہائے bhai yar yaar sir").split(" ")
);
const THANKS = new Set("thanks thank you thx ty shukriya shukria jazakallah ok okay theek acha achha ji great nice good شکریہ".split(" "));

const SPLIT_RE = /\s*,\s*|\s+(?:aur|and|then|phir|plus|اور)\s+|\s*&\s*|\s+\+\s+/;

function splitSegments(norm: string): string[] {
  const out: string[] = [];
  const lines = norm.split(/[\n;]+/).map((s) => s.trim()).filter(Boolean);
  for (const line of lines) {
    const parts = line.split(SPLIT_RE).map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) { out.push(line); continue; }
    // glue number-less pieces to the next piece that has a number ("chai, paratha 110")
    const merged: string[] = [];
    let carry = "";
    for (const p of parts) {
      const withCarry = carry ? carry + " " + p : p;
      if (hasAmount(tokenize(p))) { merged.push(withCarry); carry = ""; } else carry = withCarry;
    }
    if (carry) {
      if (merged.length) merged[merged.length - 1] += " " + carry;
      else merged.push(carry);
    }
    out.push(...merged);
  }
  return out;
}

export function parseMessage(raw: string, ctx: Ctx): Parsed {
  const norm = normalize(raw);
  if (!norm) return { kind: "unknown" };

  if (!/[\n;]/.test(norm)) {
    const command = matchCommand(norm);
    if (command) return { kind: "command", command };
  }

  const allTokens = tokenize(norm);
  if (!allTokens.length) return { kind: "thanks" };
  if (!/\d/.test(norm)) {
    if (allTokens.every((t) => GREET.has(t))) return { kind: "greeting" };
    if (allTokens.every((t) => THANKS.has(t) || GREET.has(t))) return { kind: "thanks" };
  }

  const segments = splitSegments(norm);
  const entries: ParsedEntry[] = [];
  let inheritFrom: YMD | null = null;

  segments.forEach((seg, idx) => {
    const plus = /^\s*\+/.test(seg);
    const { rest, date, leading } = extractDate(tokenize(seg), ctx.now, ctx.tz);
    if (idx === 0 && date && leading && segments.length > 1) inheritFrom = date;
    // one account named anywhere in the segment applies to every entry in it ("chai 40 rickshaw 200 cash")
    const segAccounts = detectAccounts(rest).names;
    const segAccount = segAccounts.length === 1 ? segAccounts[0] : null;
    for (const e of extractEntries(rest)) {
      const c = classify(e.rest, plus, ctx.rules);
      entries.push({ type: c.type, amount: e.amount, category: c.category, note: c.note, date, account: c.account ?? (c.category === "Loans" && segAccount === "Credit card" ? null : segAccount) });
    }
  });

  if (inheritFrom) for (const e of entries) if (!e.date) e.date = inheritFrom;
  const accountsUsed = new Set(entries.map((e) => e.account).filter(Boolean));
  if (accountsUsed.size === 1) {
    const only = [...accountsUsed][0];
    for (const e of entries) if (!e.account) e.account = only;
  }
  if (!entries.length) return { kind: "unknown" };
  return { kind: "entries", entries };
}

export function detectLang(text: string): Lang {
  if (/[\u0600-\u06FF]/.test(text)) return "ur";
  const roman = /\b(aur|ka|ki|ko|ne|kal|aaj|kharcha|kharch|mila|mili|hazar|hazaar|sau|lakh|dedh|dhai|paanch|bijli|tankhwah|bacha|kitna|diya|diye|liya|nahi|pehle|parso|dawai|kiraya|sabzi|doodh|hisab|hisaab|madad)\b/i;
  return roman.test(text) ? "ro" : "en";
}
