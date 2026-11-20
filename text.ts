const DIGIT_MAP: Record<string, string> = {};
"۰۱۲۳۴۵۶۷۸۹".split("").forEach((c, i) => (DIGIT_MAP[c] = String(i)));
"٠١٢٣٤٥٦٧٨٩".split("").forEach((c, i) => (DIGIT_MAP[c] = String(i)));

/** Lowercases, unifies Urdu/Arabic variants and digits, strips currency noise.
 *  Keeps separators (newline ; , & +) so the caller can split entries. */
export function normalize(raw: string): string {
  let s = raw.normalize("NFKC");
  s = s.replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "");
  s = s.replace(/[\u064B-\u065F\u0670]/g, "");
  s = s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/ى/g, "ی").replace(/ۃ/g, "ہ").replace(/ە/g, "ہ");
  s = s.replace(/[۰-۹٠-٩]/g, (c) => DIGIT_MAP[c] ?? c);
  s = s.replace(/٫/g, ".").replace(/،/g, ",").replace(/؛/g, ";");
  s = s.toLowerCase();
  for (let i = 0; i < 3; i++) s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  s = s.replace(/₨/g, " ").replace(/\/[-=]/g, " ");
  s = s.replace(/(?<![\p{L}])(rs|pkr|rupees?|rupay(?:a|e)?|rupiya|rupaye)\.?(?![\p{L}])/gu, " ");
  s = s.replace(/روپے|روپیہ|روپئے|روپیے/g, " ");
  s = s.replace(/(\d)(st|nd|rd|th)(?![\p{L}])/gu, "$1");
  // "5hazar" -> "5 hazar", "paanchsau" is handled later at token level
  s = s.replace(/(\d)(sau|hazar|hazaar|hajar|lakh|lakhs|lac|lacs|karor|crore)(?![\p{L}])/gu, "$1 $2");
  // split letters<->digits ("chai40" -> "chai 40", "40chai" -> "40 chai") but keep "5k"
  s = s.replace(/([\p{L}])(\d)/gu, "$1 $2");
  s = s.replace(/(\d)([\p{L}]+)/gu, (m, d: string, w: string) => (w === "k" ? m : `${d} ${w}`));
  s = s.replace(/[ \t]+/g, " ");
  return s.trim();
}

/** Segment text -> tokens. Drops punctuation/emoji, keeps + - / : . for numbers and dates. */
export function tokenize(seg: string): string[] {
  return seg
    .replace(/[^\p{L}\p{N}.+\-\/:\s]/gu, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.\-+]+|[.\-]+$/g, ""))
    .filter((t) => t.length > 0 && t !== "+");
}

export function hasLetters(t: string) {
  return /\p{L}/u.test(t);
}
