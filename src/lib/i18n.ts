import type { Lang } from "./parser";
import { paymentHelpBlocks, paymentWelcomeHint } from "./accounts";

export const BRAND = "Hisab On Tip";

export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return "Rs " + r.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function firstName(name?: string | null): string | null {
  if (!name?.trim()) return null;
  const f = name.trim().split(/\s+/)[0];
  if (f.length < 2) return null;
  return f.length > 24 ? f.slice(0, 24) : f;
}

function salute(name: string | null, withName: string, without: string) {
  return name ? withName.replace("{name}", name) : without;
}

/** Shown before language is chosen — neutral Roman Urdu + English. */
export function langPickerIntro(name?: string | null): string {
  const n = firstName(name);
  const hi = salute(n, "Assalam o Alaikum, {name}! 👋", "Assalam o Alaikum! 👋");
  return (
    `${hi}\n\n` +
    `*${BRAND}* 💸\n` +
    `Roz ka kharcha, seedha WhatsApp pe — no app, no forms.\n\n` +
    `Pehle apni *zaban* choose karein 👇\n` +
    `(Pick your language)`
  );
}

export const LANG_BUTTONS = [
  { id: "lang:en", title: "English" },
  { id: "lang:ro", title: "Roman Urdu" },
  { id: "lang:ur", title: "اردو" },
] as const;

export type ReportRow = { id: string; title: string; description?: string };

type Strings = {
  welcome: (name?: string | null) => string;
  help: (name?: string | null) => string;
  reportListBody: string;
  reportListBtn: string;
  reportListRows: ReportRow[];
  periods: { today: string; yesterday: string; week: string; month: string; lastmonth: string };
  income: string; expenses: string; saved: string; left: string;
  noData: string; totalsLine: (today: string, month: string) => string; leftMonth: string;
  undone: (l: string) => string; nothingToUndo: string; edited: (l: string) => string;
  unknown: string; unsupported: string; error: string; tooMany: (n: number) => string;
  budgetSet: (c: string, a: string) => string; budgetRemoved: (c: string) => string; budgetNone: string; budgetHeader: string;
  budgetWarn: (c: string, pct: number) => string; budgetOver: (c: string) => string; budgetMissing: (c: string) => string;
  goalCreated: (n: string, t: string) => string; goalNone: string; goalHeader: string; goalRemoved: (n: string) => string;
  goalMissing: (n: string) => string; goalTip: string;
  ruleLearned: (k: string, c: string) => string; langSet: string;
  reportOn: string; reportOff: string; exportEmpty: string; exportCaption: string;
  deleteAsk: string; deleteDone: string; deleteCancelled: string; nudge: string;
  lastHeader: string; topCats: string; byAccount: string; voiceFail: string; voiceOff: string;
};

const PAY_HINT = paymentWelcomeHint();
const PAY_HELP = paymentHelpBlocks();

const en: Strings = {
  welcome: (name) => {
    const n = firstName(name);
    const hi = salute(n, "Assalam o Alaikum, {name}! ✨", "Assalam o Alaikum! ✨");
    return (
      `${hi}\n` +
      `*${BRAND}* — your daily money diary on WhatsApp.\n\n` +
      `*Log kharcha (just type):*\n` +
      `• chai 50\n` +
      `• petrol 2000\n` +
      `• salary 150000\n` +
      `• chai 40 aur rickshaw 200 (2 in 1 msg)\n\n` +
      `*Paid from?* End pe likho:\n` +
      `${PAY_HINT}\n\n` +
      `🎙️ Voice notes work too.\n\n` +
      `*Quick keys:*\n` +
      `• *report* → charts & summary\n` +
      `• *help* → full guide\n` +
      `• *balance* · *undo* · *today*`
    );
  },
  help: (name) => {
    const n = firstName(name);
    const head = n ? `${BRAND} · ${n}` : BRAND;
    return (
      `📖 *${head}*\n\n` +
      `*Add*\n` +
      `• chai 110 · petrol 2k · kal biryani 450\n` +
      `• save 5000 laptop\n\n` +
      `*Reports*\n` +
      `• Type *report* or pick from menu\n` +
      `• today · week · month · balance\n\n` +
      `*Fix*\n` +
      `• undo · edit 120 · last 5\n\n` +
      `*Plans*\n` +
      `• budget food 20000 · goal laptop 100000\n\n` +
      `*Payment tags*\n${PAY_HELP}\n\n` +
      `*Language* — english · urdu · roman\n` +
      `*Privacy* — delete my data`
    );
  },
  reportListBody: "📊 Tap a report — text + charts jahan data ho.",
  reportListBtn: "Reports",
  reportListRows: [
    { id: "cmd:today", title: "Today", description: "Aaj ka kharcha" },
    { id: "cmd:week", title: "This week", description: "7 days" },
    { id: "cmd:month", title: "This month", description: "Is mahine" },
    { id: "cmd:lastmonth", title: "Last month", description: "Pichla mahina" },
    { id: "cmd:balance", title: "Balance", description: "Kitna bacha" },
    { id: "cmd:help", title: "Help", description: "Saari commands" },
  ],
  periods: { today: "Today", yesterday: "Yesterday", week: "Last 7 days", month: "This month", lastmonth: "Last month" },
  income: "Income", expenses: "Expenses", saved: "Saved", left: "Left",
  noData: "Nothing logged for this period yet.",
  totalsLine: (t, m) => `Today: ${t} | Month: ${m}`,
  leftMonth: "Left this month",
  undone: (l) => `↩️ Removed: ${l}`, nothingToUndo: "Nothing to undo.", edited: (l) => `✏️ Updated: ${l}`,
  unknown: `Didn't catch that 🤔\nTry *chai 50* or *report*\n*help* — ${BRAND}`,
  unsupported: "Text ya voice note bhejein please 🙏",
  error: "Choti si error — 1 min baad try karein.",
  tooMany: (n) => `Max ${n} entries per message. Baqi alag message.`,
  budgetSet: (c, a) => `🎯 Budget: ${c} ${a}/month`, budgetRemoved: (c) => `Budget removed: ${c}`,
  budgetNone: "No budgets yet → budget food 20000", budgetHeader: "🎯 Budgets (this month)",
  budgetWarn: (c, p) => `⚠️ ${c} — ${p}% used`, budgetOver: (c) => `🚨 ${c} budget cross`, budgetMissing: (c) => `No budget for ${c}.`,
  goalCreated: (n, t) => `🏦 Goal: ${n} (${t})`,
  goalNone: "No goals → goal laptop 100000", goalHeader: "🏦 Savings goals", goalRemoved: (n) => `Removed: ${n}`,
  goalMissing: (n) => `No goal: ${n}.`, goalTip: "Tip → goal laptop 100000",
  ruleLearned: (k, c) => `👍 "${k}" → ${c}`, langSet: "English set ✅",
  reportOn: "Daily summary on ✅", reportOff: "Daily summary off. *report* still works.",
  exportEmpty: "File nahi bani.", exportCaption: `${BRAND} CSV`,
  deleteAsk: "⚠️ ALL data delete. 10 min mein *confirm*.",
  deleteDone: `Data cleared. Say *hi* — ${BRAND}`, deleteCancelled: "Cancelled ✅",
  nudge: `Aaj kuch log nahi kiya? chai 50? — ${BRAND}`,
  lastHeader: "🧾 Recent", topCats: "Top categories", byAccount: "By account",
  voiceFail: "Voice clear nahi 🎙️ Dobara ya type karo (chai 50).",
  voiceOff: "Voice off — type kar dein.",
};

const ro: Strings = {
  welcome: (name) => {
    const n = firstName(name);
    const hi = salute(n, "Assalam o Alaikum, {name}! ✨", "Assalam o Alaikum! ✨");
    return (
      `${hi}\n` +
      `*${BRAND}* — roz ka hisaab, seedha WhatsApp pe.\n\n` +
      `*Kharcha likho:*\n` +
      `• chai 50\n` +
      `• petrol 2000\n` +
      `• salary 150000\n` +
      `• chai 40 aur rickshaw 200\n\n` +
      `*Kis se pay?* Aakhir mein:\n` +
      `${PAY_HINT}\n\n` +
      `🎙️ Voice note bhi.\n\n` +
      `*Yad rakhein:*\n` +
      `• *report* → charts\n` +
      `• *help* → guide\n` +
      `• *balance* · *undo* · *aaj*`
    );
  },
  help: (name) => {
    const n = firstName(name);
    const head = n ? `${BRAND} · ${n}` : BRAND;
    return (
      `📖 *${head}*\n\n` +
      `*Likho*\n` +
      `• chai 110 · petrol 2k · kal biryani 450\n` +
      `• save 5000 laptop\n\n` +
      `*Report*\n` +
      `• *report* likho ya menu\n` +
      `• aaj · week · month · balance\n\n` +
      `*Theek*\n` +
      `• undo · edit 120 · last 5\n\n` +
      `*Budget / goals*\n` +
      `• budget food 20000 · goal laptop 100000\n\n` +
      `*Payment*\n${PAY_HELP}\n\n` +
      `*Zaban* english · urdu · roman`
    );
  },
  reportListBody: "📊 Report choose karein.",
  reportListBtn: "Report",
  reportListRows: [
    { id: "cmd:today", title: "Aaj", description: "Aaj ka kharcha" },
    { id: "cmd:week", title: "Hafta", description: "7 din" },
    { id: "cmd:month", title: "Mahina", description: "Is mahine" },
    { id: "cmd:lastmonth", title: "Pichla mahina", description: "Last month" },
    { id: "cmd:balance", title: "Balance", description: "Kitna bacha" },
    { id: "cmd:help", title: "Madad", description: "Commands" },
  ],
  periods: { today: "Aaj", yesterday: "Kal", week: "Pichle 7 din", month: "Is mahine", lastmonth: "Pichla mahina" },
  income: "Aamdan", expenses: "Kharcha", saved: "Bachat", left: "Bacha",
  noData: "Is arsay ki entry nahi.",
  totalsLine: (t, m) => `Aaj: ${t} | Mahina: ${m}`,
  leftMonth: "Is mahine bacha",
  undone: (l) => `↩️ Hata diya: ${l}`, nothingToUndo: "Kuch nahi.", edited: (l) => `✏️ ${l}`,
  unknown: `Samajh nahi aaya 🤔 *chai 50* ya *report* — ${BRAND}`,
  unsupported: "Text ya voice 🙏",
  error: "Thori der baad dobara.",
  tooMany: (n) => `Max ${n} per message.`,
  budgetSet: (c, a) => `🎯 ${c} ${a}/mahina`, budgetRemoved: (c) => `Hata: ${c}`,
  budgetNone: "budget food 20000", budgetHeader: "🎯 Budgets",
  budgetWarn: (c, p) => `⚠️ ${c} ${p}%`, budgetOver: (c) => `🚨 ${c}`, budgetMissing: (c) => c,
  goalCreated: (n, t) => `🏦 ${n} (${t})`,
  goalNone: "goal laptop 100000", goalHeader: "🏦 Goals", goalRemoved: (n) => n,
  goalMissing: (n) => n, goalTip: "goal laptop 100000",
  ruleLearned: (k, c) => `👍 ${k} → ${c}`, langSet: "Roman Urdu ✅",
  reportOn: "Roz summary on ✅", reportOff: "Roz summary off.",
  exportEmpty: "File fail", exportCaption: BRAND,
  deleteAsk: "⚠️ *confirm* 10 min",
  deleteDone: "hi likho", deleteCancelled: "Cancel",
  nudge: `Aaj kuch? — ${BRAND}`,
  lastHeader: "🧾 Recent", topCats: "Categories", byAccount: "Account",
  voiceFail: "Voice fail 🎙️", voiceOff: "Voice band",
};

const ur: Strings = {
  welcome: (name) => {
    const n = firstName(name);
    const hi = salute(n, "السلام علیکم، {name}! ✨", "السلام علیکم! ✨");
    return (
      `${hi}\n` +
      `*${BRAND}* — روزانہ خرچ، واٹس ایپ پر۔\n\n` +
      `*لکھیں:*\n` +
      `• چائے 50\n` +
      `• پیٹرول 2000\n` +
      `• تنخواہ 150000\n\n` +
      `*ادائیگی:* آخر میں meezan / cash / easypaisa\n` +
      `• مکمل فہرست → *help*\n\n` +
      `🎙️ وائس نوٹ\n\n` +
      `• *report* · *help* · *balance*`
    );
  },
  help: (name) => {
    const n = firstName(name);
    const head = n ? `${BRAND} · ${n}` : BRAND;
    return `📖 *${head}*\n\n*report* · today · undo · budget\n\n${PAY_HELP}`;
  },
  reportListBody: "📊 رپورٹ منتخب کریں",
  reportListBtn: "رپورٹ",
  reportListRows: [
    { id: "cmd:today", title: "آج", description: "آج کا خرچ" },
    { id: "cmd:week", title: "ہفتہ", description: "7 دن" },
    { id: "cmd:month", title: "مہینہ", description: "اس مہینے" },
    { id: "cmd:balance", title: "بیلنس", description: "باقی" },
    { id: "cmd:help", title: "مدد", description: "کمانڈز" },
  ],
  periods: { today: "آج", yesterday: "کل", week: "پچھلے 7 دن", month: "اس مہینے", lastmonth: "پچھلا مہینہ" },
  income: "آمدن", expenses: "خرچ", saved: "بچت", left: "باقی",
  noData: "کوئی انٹری نہیں۔",
  totalsLine: (t, m) => `آج: ${t} | مہینہ: ${m}`,
  leftMonth: "باقی",
  undone: (l) => `↩️ ${l}`, nothingToUndo: "—", edited: (l) => `✏️ ${l}`,
  unknown: `سمجھ نہیں آیا 🤔 ${BRAND}`,
  unsupported: "ٹیکسٹ یا وائس 🙏",
  error: "دوبارہ کوشش کریں۔",
  tooMany: (n) => `${n} max`,
  budgetSet: (c, a) => `🎯 ${c}`, budgetRemoved: (c) => c,
  budgetNone: "budget", budgetHeader: "🎯",
  budgetWarn: (c, p) => `⚠️ ${p}%`, budgetOver: (c) => `🚨 ${c}`, budgetMissing: (c) => c,
  goalCreated: (n, t) => `🏦 ${n}`,
  goalNone: "—", goalHeader: "🏦", goalRemoved: (n) => n,
  goalMissing: (n) => n, goalTip: "—",
  ruleLearned: (k, c) => `👍`, langSet: "اردو ✅",
  reportOn: "آن", reportOff: "بند",
  exportEmpty: "—", exportCaption: BRAND,
  deleteAsk: "⚠️ confirm",
  deleteDone: "hi", deleteCancelled: "—",
  nudge: BRAND,
  lastHeader: "🧾", topCats: "—", byAccount: "—",
  voiceFail: "🎙️", voiceOff: "—",
};

export const L: Record<Lang, Strings> = { en, ro, ur };