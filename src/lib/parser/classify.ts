import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, INCOME_ONLY_KW, INCOME_VERBS, SAVING_WORDS, STAFF_WORDS, GAVE_WORDS, STOP, Cat,
} from "./data";

export type TxType = "expense" | "income" | "saving";
export type Rule = { keyword: string; category: string };

const INCOME_NAMES = new Set(INCOME_CATEGORIES.map((c) => c.name));

function within1(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
}

type Indexed = { name: string; single: Set<string>; multi: string[] };
const index = (cats: Cat[]): Indexed[] =>
  cats.map((c) => ({ name: c.name, single: new Set(c.kw.filter((k) => !k.includes(" "))), multi: c.kw.filter((k) => k.includes(" ")) }));
const EXP_IDX = index(EXPENSE_CATEGORIES);
const INC_IDX = index(INCOME_CATEGORIES);

function scoreCats(tokens: string[], idx: Indexed[]): string | null {
  const joined = " " + tokens.join(" ") + " ";
  const set = new Set(tokens);
  let best: string | null = null, bestScore = 0;
  for (const c of idx) {
    let s = 0;
    for (const k of c.single) if (set.has(k)) s++;
    for (const k of c.multi) if (joined.includes(" " + k + " ")) s++;
    if (s > bestScore) { best = c.name; bestScore = s; }
  }
  if (best) return best;
  // typo tolerance for longer words: "grocry", "restarant", "pertol"
  for (const t of tokens) {
    if (t.length < 5 || !/^[a-z]+$/.test(t)) continue;
    for (const c of idx) {
      for (const k of c.single) {
        if (k.length >= 5 && /^[a-z]+$/.test(k) && within1(t, k)) return c.name;
      }
    }
  }
  return null;
}

function customRule(tokens: string[], rules: Rule[]): Rule | undefined {
  const joined = " " + tokens.join(" ") + " ";
  return rules.find((r) => joined.includes(" " + r.keyword + " "));
}

const ACCOUNT_SINGLE: Record<string, string> = {
  cash: "Cash", naqd: "Cash", "نقد": "Cash",
  meezan: "Meezan", "میزان": "Meezan",
  hbl: "HBL", ubl: "UBL", mcb: "MCB", abl: "Allied", allied: "Allied", alfalah: "Alfalah", faysal: "Faysal",
  askari: "Askari", scb: "Standard Chartered", bop: "BOP", bankislami: "BankIslami",
  sadapay: "SadaPay", nayapay: "NayaPay", easypaisa: "Easypaisa", jazzcash: "JazzCash",
  card: "Card", bank: "Bank",
};
const ACCOUNT_PAIR: Record<string, string> = {
  "credit card": "Credit card", "debit card": "Card", "bank alfalah": "Alfalah", "habib bank": "HBL",
  "habib metro": "Habib Metro", "bank islami": "BankIslami", "standard chartered": "Standard Chartered",
  "meezan bank": "Meezan", "easy paisa": "Easypaisa", "jazz cash": "JazzCash", "sada pay": "SadaPay", "naya pay": "NayaPay",
};

/** Which payment account (cash, a bank, a wallet) is mentioned, and which token indexes to drop from the note. */
export function detectAccounts(tokens: string[]): { names: string[]; drop: Set<number> } {
  const names: string[] = [];
  const drop = new Set<number>();
  for (let i = 0; i < tokens.length; i++) {
    const pair = i + 1 < tokens.length ? ACCOUNT_PAIR[tokens[i] + " " + tokens[i + 1]] : undefined;
    if (pair) { names.push(pair); drop.add(i); drop.add(i + 1); i++; continue; }
    const one = ACCOUNT_SINGLE[tokens[i]];
    if (one) { names.push(one); drop.add(i); }
  }
  return { names: [...new Set(names)], drop };
}

export type Classified = { type: TxType; category: string; note: string; account: string | null };

export function classify(tokens: string[], plus: boolean, rules: Rule[]): Classified {
  const set = new Set(tokens);
  const has = (...w: string[]) => w.some((x) => set.has(x));
  const hasAny = (s: Set<string>) => tokens.some((t) => s.has(t));

  const gaveTo = set.has("ko") && hasAny(GAVE_WORDS);
  const receivedByNe = set.has("ne") && hasAny(GAVE_WORDS);
  const salaryWord = has("salary", "tankhwah", "tankhah", "tankha", "tankhwa", "تنخواہ", "تنخواه", "سیلری");
  const paidSalary = salaryWord && (hasAny(STAFF_WORDS) || hasAny(GAVE_WORDS));
  const verbToks = tokens.filter((t, i) => !(t === "credit" && tokens[i + 1] === "card"));
  const incomeVerb = verbToks.some((t) => INCOME_VERBS.has(t)) || (set.has("got") && has("from", "se"));
  const incomeOnly = tokens.some((t) => INCOME_ONLY_KW.has(t)) && !paidSalary;

  let type: TxType = "expense";
  if (plus || (!gaveTo && !paidSalary && (receivedByNe || incomeVerb || incomeOnly))) type = "income";
  else if (hasAny(SAVING_WORDS)) type = "saving";

  let category: string;
  const rule = customRule(tokens, rules);
  if (type === "income") {
    category = rule && INCOME_NAMES.has(rule.category) ? rule.category : scoreCats(tokens, INC_IDX) ?? "Other";
  } else if (type === "saving") {
    category = has("committee", "kameti", "کمیٹی") ? "Committee"
      : has("invest", "invested", "investment", "ktrade", "psx", "mutual", "etf") ? "Investment"
      : "Savings";
  } else {
    category = rule && !INCOME_NAMES.has(rule.category) ? rule.category : scoreCats(tokens, EXP_IDX) ?? "Other";
  }

  const det = detectAccounts(tokens);
  let account: string | null = det.names[0] ?? null;
  let dropIdx = det.drop;
  // "credit card bill 20000" is a loan payment; "petrol 2000 credit card" is just how it was paid
  if (account === "Credit card" && type === "expense" && (category === "Other" || has("bill", "payment", "installment", "emi", "kist", "qist"))) {
    category = "Loans";
    account = null;
    dropIdx = new Set();
  }

  const drop = new Set<string>();
  if (type === "saving") SAVING_WORDS.forEach((w) => drop.add(w));
  const kept = tokens.filter((t, i) => !dropIdx.has(i) && !STOP.has(t) && !drop.has(t) && /[\p{L}\p{N}]/u.test(t));
  let note = kept.join(" ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (note) note = note.charAt(0).toUpperCase() + note.slice(1);
  if (!note) note = type === "saving" ? "Savings" : category;
  return { type, category, note, account };
}

export function resolveCategory(input: string): string {
  const l = input.trim().toLowerCase();
  for (const c of [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]) {
    if (c.name.toLowerCase() === l || c.kw.includes(l)) return c.name;
  }
  return l.charAt(0).toUpperCase() + l.slice(1);
}
