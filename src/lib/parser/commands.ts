import type { Period } from "../time";
import { parseAmountOnly } from "./entries";
import { resolveCategory } from "./classify";
import { tokenize } from "./text";

export type Lang = "en" | "ro" | "ur";

export type Command =
  | { cmd: "help" }
  | { cmd: "report_menu" }
  | { cmd: "lang_menu" }
  | { cmd: "summary"; period: Period }
  | { cmd: "balance" }
  | { cmd: "undo" }
  | { cmd: "last"; n: number }
  | { cmd: "edit"; amount: number }
  | { cmd: "budget"; action: "list" } | { cmd: "budget"; action: "set"; category: string; amount: number }
  | { cmd: "budget"; action: "remove"; category: string }
  | { cmd: "goals"; action: "list" } | { cmd: "goals"; action: "create"; name: string; target: number }
  | { cmd: "goals"; action: "remove"; name: string }
  | { cmd: "category"; keyword: string; category: string }
  | { cmd: "export"; period: "month" | "lastmonth" }
  | { cmd: "language"; lang: Lang }
  | { cmd: "report_toggle"; on: boolean }
  | { cmd: "delete_data" };

const FILLER = new Set(
  ("ka ki ke ko report summary hisab hisaab kharcha kharch kharchay kharche expense expenses spending spent show dikhao " +
    "dikhaye batao bata de do dein please plz pls my total kitna kitne kitni hua hui hue hai ho gaya gayi sab poora pura " +
    "all me mein mera meri mere the a what is whats how much did i spend جی حساب خرچ رپورٹ کا کی کے دکھاؤ بتاؤ کتنا ہوا ہے میرا").split(" ")
);
const SUMMARY_KEYS = new Set("report summary hisab hisaab kharcha kharch kharchay kharche expenses expense spending حساب خرچ رپورٹ".split(" "));
const PERIODS: Record<string, Period> = {
  today: "today", aaj: "today", aj: "today", "آج": "today",
  yesterday: "yesterday", kal: "yesterday", kl: "yesterday", "کل": "yesterday",
  week: "week", weekly: "week", hafta: "week", haftay: "week", hafte: "week", haftawar: "week", "ہفتہ": "week", "ہفتے": "week",
  month: "month", monthly: "month", mahina: "month", mahine: "month", maheena: "month", mah: "month", "مہینہ": "month", "مہینے": "month", "ماہ": "month",
};
const LASTW = new Set("last previous pichla pichle pichhla pichhle پچھلا پچھلے".split(" "));
const BAL_KEYS = new Set("balance bal bacha bache bachay baqi baki bakaya بیلنس باقی بچا left remaining".split(" "));
const UNDO_KEYS = new Set("undo galat ghalat غلط delete remove cancel hatao hata mitao mita ہٹاؤ ہٹا مٹاؤ".split(" "));
const UNDO_FILL = new Set("last aakhri akhri entry wala wali ye yeh ko do kar karo it that one the previous pichli آخری کو دو کرو یہ hai".split(" "));

const LANG_MAP: Record<string, Lang> = {
  english: "en", en: "en", angrezi: "en", "انگریزی": "en",
  urdu: "ur", "اردو": "ur", ur: "ur",
  roman: "ro", "roman urdu": "ro", romanurdu: "ro", ro: "ro", hinglish: "ro",
};

export function matchCommand(norm: string): Command | null {
  const text = norm.replace(/^[\/!.]+/, "").trim();
  if (!text) return null;
  if (text === "lastmonth") return { cmd: "summary", period: "lastmonth" };
  const toks = tokenize(text);
  if (!toks.length) return null;
  const hasDigit = /\d/.test(text);

  if (/^(delete|erase|remove|wipe)\s+(my\s+)?(all\s+)?(data|account|everything)$/.test(text) || /^(mera\s+)?data\s+(delete|remove)(\s+kar\s*do)?$/.test(text)) {
    return { cmd: "delete_data" };
  }
  if (/^(help|madad|commands|menu|\?|guide|how to use|kaise use karun|مدد)$/.test(text)) return { cmd: "help" };
  if (/^(report|reports|hisab|hisaab|kharcha report|statement)$/.test(text)) return { cmd: "report_menu" };
  if (/^(zaban|زبان|change language|language menu)$/.test(text)) return { cmd: "lang_menu" };

  if (LANG_MAP[text]) return { cmd: "language", lang: LANG_MAP[text] };
  let m = /^(?:language|lang|zaban|زبان)\s+(.+)$/.exec(text);
  if (m && LANG_MAP[m[1].trim()]) return { cmd: "language", lang: LANG_MAP[m[1].trim()] };

  m = /^(?:report|reports|reminder|reminders|daily report|daily)\s+(on|off|band|chalu|stop|start|بند|چالو)$/.exec(text);
  if (m) return { cmd: "report_toggle", on: ["on", "chalu", "start", "چالو"].includes(m[1]) };

  m = /^(?:export|csv|download|excel|statement|sheet)(?:\s+(.*))?$/.exec(text);
  if (m) return { cmd: "export", period: /last|pichl|پچھل/.test(m[1] ?? "") ? "lastmonth" : "month" };

  m = /^(?:category|cat|learn)\s+(\S+)\s+(.+)$/.exec(text);
  if (m) return { cmd: "category", keyword: m[1], category: resolveCategory(m[2]) };

  m = /^(?:edit|correct|change|update|fix|theek|sahi|tabdeel)\s+(?:amount\s+)?(.+)$/.exec(text);
  if (m) {
    const a = parseAmountOnly(tokenize(m[1]));
    if (a) return { cmd: "edit", amount: a };
  }

  m = /^(?:budget|budgets|بجٹ)(?:\s+(.*))?$/.exec(text);
  if (m) {
    const rest = tokenize(m[1] ?? "");
    if (!rest.length) return { cmd: "budget", action: "list" };
    const lastTok = rest[rest.length - 1];
    if (["off", "remove", "delete", "hatao", "band", "reset"].includes(lastTok) && rest.length > 1) {
      return { cmd: "budget", action: "remove", category: resolveCategory(rest.slice(0, -1).join(" ")) };
    }
    for (let i = 0; i < rest.length; i++) {
      const a = parseAmountOnly(rest.slice(i));
      if (a && i > 0) return { cmd: "budget", action: "set", category: resolveCategory(rest.slice(0, i).join(" ")), amount: a };
    }
    return { cmd: "budget", action: "list" };
  }

  m = /^(?:goals?|گول)(?:\s+(.*))?$/.exec(text);
  if (m) {
    const rest = tokenize(m[1] ?? "");
    if (!rest.length) return { cmd: "goals", action: "list" };
    const lastTok = rest[rest.length - 1];
    if (["off", "remove", "delete", "hatao"].includes(lastTok) && rest.length > 1) {
      return { cmd: "goals", action: "remove", name: rest.slice(0, -1).join(" ") };
    }
    for (let i = 1; i < rest.length; i++) {
      const a = parseAmountOnly(rest.slice(i));
      if (a) return { cmd: "goals", action: "create", name: rest.slice(0, i).join(" "), target: a };
    }
    return { cmd: "goals", action: "list" };
  }
  if (/^(savings|bachat|بچت)$/.test(text)) return { cmd: "goals", action: "list" };

  if (!hasDigit && toks.every((t) => UNDO_KEYS.has(t) || UNDO_FILL.has(t) || FILLER.has(t)) && toks.some((t) => UNDO_KEYS.has(t))) {
    return { cmd: "undo" };
  }

  m = /^(?:last|recent|history|akhri|aakhri|latest|entries|list|pichli|pichle)(?:\s+(\d{1,2}))?(?:\s+(?:entries|transactions|kharche|kharchay|entry))?$/.exec(text);
  if (m) return { cmd: "last", n: Math.min(20, Math.max(1, Number(m[1] ?? 5))) };

  if (!hasDigit) {
    if (toks.every((t) => BAL_KEYS.has(t) || FILLER.has(t) || PERIODS[t] || LASTW.has(t) || t === "paisay" || t === "paise" || t === "pese" || t === "پیسے") && toks.some((t) => BAL_KEYS.has(t))) {
      return { cmd: "balance" };
    }
    const allowed = toks.every((t) => FILLER.has(t) || PERIODS[t] || LASTW.has(t));
    if (allowed) {
      const periodTok = toks.find((t) => PERIODS[t]);
      const last = toks.some((t) => LASTW.has(t));
      if (periodTok) {
        if (last && PERIODS[periodTok] === "month") return { cmd: "summary", period: "lastmonth" };
        return { cmd: "summary", period: PERIODS[periodTok] };
      }
      if (toks.some((t) => SUMMARY_KEYS.has(t))) {
        return { cmd: "summary", period: toks.includes("report") ? "month" : "today" };
      }
    }
  }
  return null;
}
