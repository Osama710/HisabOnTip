import { NUM_WORDS, MULT_SUFFIXES, NumDef, STOP, UNITS } from "./data";
import { hasLetters } from "./text";

type NumTok =
  | { kind: "digits"; v: number; plain: boolean }
  | { kind: "word"; def: NumDef };

const DIGIT_RE = /^(\d+(?:\.\d+)?)(k)?$/;

function numTok(tok: string): NumTok | null {
  const m = DIGIT_RE.exec(tok);
  if (m) {
    let v = parseFloat(m[1]);
    if (m[2]) v *= 1000;
    return { kind: "digits", v, plain: !m[2] };
  }
  const d = NUM_WORDS[tok];
  return d ? { kind: "word", def: d } : null;
}

/** "paanchsau" -> ["paanch","sau"] */
export function splitMerged(tokens: string[]): string[] {
  const out: string[] = [];
  for (const t of tokens) {
    if (numTok(t) || /\d/.test(t)) { out.push(t); continue; }
    let done = false;
    for (const suf of MULT_SUFFIXES) {
      if (t.length > suf.length && t.endsWith(suf)) {
        const pre = t.slice(0, -suf.length);
        if (NUM_WORDS[pre]) { out.push(pre, suf); done = true; break; }
      }
    }
    if (!done) out.push(t);
  }
  return out;
}

export type Span = {
  start: number; end: number; value: number;
  digitsOnly: boolean; hasMult: boolean; unitQty: boolean;
};

function wordsValue(parts: NumTok[]): number {
  let total = 0, current = 0;
  for (const p of parts) {
    if (p.kind === "digits") { current += p.v; continue; }
    const { t, v } = p.def;
    if (t === "small" || t === "frac") current += v;
    else if (v === 100) current = (current || 1) * 100;
    else { total += (current || 1) * v; current = 0; }
  }
  return total + current;
}

export function findSpans(tokens: string[]): Span[] {
  const spans: Span[] = [];
  let i = 0;
  while (i < tokens.length) {
    const a = numTok(tokens[i]);
    if (!a) { i++; continue; }
    const parts: NumTok[] = [a];
    let k = i + 1;
    if (a.kind === "digits") {
      if (tokens[k] === "k" && a.plain) { parts.push({ kind: "word", def: { t: "mult", v: 1000 } }); k++; }
      const nx = k < tokens.length ? numTok(tokens[k]) : null;
      if (nx && nx.kind === "word" && nx.def.t === "mult") {
        while (k < tokens.length) {
          const n = numTok(tokens[k]);
          if (n && n.kind === "word") { parts.push(n); k++; } else break;
        }
      }
    } else {
      while (k < tokens.length) {
        const n = numTok(tokens[k]);
        if (n && n.kind === "word") { parts.push(n); k++; } else break;
      }
    }
    const hasMult = parts.some(
      (p) => (p.kind === "word" && p.def.t === "mult") || (p.kind === "digits" && !p.plain)
    );
    const digitsOnly = a.kind === "digits";
    const value = wordsValue(parts);
    const ok = (digitsOnly || hasMult) && value > 0 && value <= 1e9;
    if (ok) {
      spans.push({ start: i, end: k, value, digitsOnly, hasMult, unitQty: k < tokens.length && UNITS.has(tokens[k]) });
    }
    i = k;
  }
  return spans;
}

export function hasWords(tokens: string[]): boolean {
  return tokens.some((t) => hasLetters(t) && !STOP.has(t) && !NUM_WORDS[t]);
}

const isSmall = (s: Span) => s.digitsOnly && !s.hasMult && Number.isInteger(s.value) && s.value <= 20;

export type RawEntry = { amount: number; rest: string[] };

export function extractEntries(input: string[]): RawEntry[] {
  const tokens = splitMerged(input);
  const spans = findSpans(tokens).filter((s) => !s.unitQty);
  if (!spans.length) return [];
  const single = (s: Span): RawEntry => ({
    amount: s.value,
    rest: [...tokens.slice(0, s.start), ...tokens.slice(s.end)],
  });
  if (spans.length === 1) return [single(spans[0])];

  const first = spans[0];
  const textBefore = hasWords(tokens.slice(0, first.start));
  const between = hasWords(tokens.slice(first.end, spans[1].start));
  const qtyFirst = !textBefore && isSmall(first) && between;
  const style: "after" | "before" = textBefore || qtyFirst ? "after" : "before";

  // drop quantity-looking spans ("2 chai 100")
  const amounts: Span[] = [];
  let lastEnd = 0;
  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];
    const next = spans[i + 1];
    const wordsBefore = hasWords(tokens.slice(lastEnd, s.start));
    const isQty = !wordsBefore && isSmall(s) && !!next && hasWords(tokens.slice(s.end, next.start));
    if (isQty) continue;
    amounts.push(s);
    lastEnd = s.end;
  }
  if (amounts.length === 1) return [single(amounts[0])];

  const out: RawEntry[] = [];
  if (style === "after") {
    let prev = 0;
    amounts.forEach((s, i) => {
      const endIdx = i === amounts.length - 1 ? tokens.length : s.end;
      const chunk = tokens.slice(prev, endIdx);
      out.push({ amount: s.value, rest: chunk.filter((_, j) => !(prev + j >= s.start && prev + j < s.end)) });
      prev = endIdx;
    });
  } else {
    amounts.forEach((s, i) => {
      const startIdx = i === 0 ? 0 : s.start;
      const endIdx = i === amounts.length - 1 ? tokens.length : amounts[i + 1].start;
      const chunk = tokens.slice(startIdx, endIdx);
      out.push({ amount: s.value, rest: chunk.filter((_, j) => !(startIdx + j >= s.start && startIdx + j < s.end)) });
    });
  }
  return out;
}

/** Used for "edit 1.5k" and "budget food 20000": the whole token list must be one amount. */
export function parseAmountOnly(tokens: string[]): number | null {
  const t = splitMerged(tokens);
  const spans = findSpans(t);
  if (spans.length === 1 && spans[0].start === 0 && spans[0].end === t.length) return spans[0].value;
  return null;
}

export function hasAmount(tokens: string[]): boolean {
  return findSpans(splitMerged(tokens)).some((s) => !s.unitQty);
}
