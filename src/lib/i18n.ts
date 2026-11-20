import type { Lang } from "./parser";
import { paymentLabelsLine } from "./accounts";

export const BRAND = "Hisab On Tip";

export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return "Rs " + r.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** First word of WhatsApp profile name for a warmer greeting. */
export function firstName(name?: string | null): string | null {
  if (!name?.trim()) return null;
  const f = name.trim().split(/\s+/)[0];
  if (f.length < 2) return null;
  return f.length > 24 ? f.slice(0, 24) : f;
}

function salute(name: string | null, withName: string, without: string) {
  return name ? withName.replace("{name}", name) : without;
}

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

const PAY = paymentLabelsLine();

const en: Strings = {
  welcome: (name) => {
    const n = firstName(name);
    const hi = salute(n, "Assalam o Alaikum, {name}! 👋", "Assalam o Alaikum! 👋");
    return (
      `${hi}\n\n` +
      `Welcome to *${BRAND}* — roz ka hisaab, seedha WhatsApp pe.\n\n` +
      `Bas likho jitna kharcha:\n` +
      `chai 50 · petrol 2000 · salary 150000\n` +
      `do cheezain ek message: chai 40 aur rickshaw 200\n\n` +
      `Kis se pay kiya? Aakhir mein likh dein:\n` +
      `petrol 2000 meezan · chai 50 cash\n\n` +
      `*Banks & wallets:* ${PAY}\n\n` +
      `🎙️ Voice note bhi chalega. Reports ke liye neeche wala menu kholo, ya *help* likho.`
    );
  },
  help: (name) => {
    const n = firstName(name);
    const head = n ? `${BRAND} — madad for ${n}` : `${BRAND} — quick help`;
    return (
      `📖 *${head}*\n\n` +
      `*Log:* chai 110 | petrol 2k | salary 150k | kal biryani 450\n` +
      `*Save:* save 5000 laptop\n` +
      `*Reports:* menu below, or type today / week / month\n` +
      `*Balance:* balance · *Undo:* undo · *Last:* last 5\n` +
      `*Budget:* budget food 20000 · *Goals:* goal laptop 100000\n` +
      `*Payment tag:* petrol 2000 easypaisa (end of message)\n` +
      `*Accounts:* ${PAY}\n` +
      `*Zaban:* urdu · roman · english\n` +
      `*Privacy:* delete my data`
    );
  },
  reportListBody: "Choose a report — charts aa jayenge jahan data ho.",
  reportListBtn: "Pick report",
  reportListRows: [
    { id: "cmd:today", title: "Today", description: "Aaj ka kharcha" },
    { id: "cmd:week", title: "This week", description: "Last 7 days" },
    { id: "cmd:month", title: "This month", description: "Is mahine" },
    { id: "cmd:lastmonth", title: "Last month", description: "Pichla mahina" },
    { id: "cmd:balance", title: "Balance", description: "Income minus spend" },
    { id: "cmd:help", title: "Full help", description: "All commands" },
  ],
  periods: { today: "Today", yesterday: "Yesterday", week: "Last 7 days", month: "This month", lastmonth: "Last month" },
  income: "Income", expenses: "Expenses", saved: "Saved", left: "Left",
  noData: "Nothing logged for this period yet.",
  totalsLine: (t, m) => `Today: ${t} | Month: ${m}`,
  leftMonth: "Left this month",
  undone: (l) => `↩️ Removed: ${l}`, nothingToUndo: "Nothing to undo.", edited: (l) => `✏️ Updated: ${l}`,
  unknown: `Hmm, samajh nahi aaya 🤔 Try chai 50 ya petrol 2000. *help* for more — ${BRAND}`,
  unsupported: "Sirf text aur voice notes please 🙏",
  error: "Thori si gadbad ho gayi. Ek minute baad dobara try karein.",
  tooMany: (n) => `Ek message mein max ${n} entries. Baqi alag message mein bhej dein.`,
  budgetSet: (c, a) => `🎯 Budget set: ${c} ${a}/month`, budgetRemoved: (c) => `Budget removed: ${c}`,
  budgetNone: "Abhi koi budget nahi. Try: budget food 20000", budgetHeader: "🎯 Budgets (this month)",
  budgetWarn: (c, p) => `⚠️ ${c} — ${p}% used`, budgetOver: (c) => `🚨 ${c} budget cross ho gaya`, budgetMissing: (c) => `No budget for ${c}.`,
  goalCreated: (n, t) => `🏦 Goal: ${n} (${t}). Add: save 5000 ${n}`,
  goalNone: "No goals yet. Try: goal laptop 100000", goalHeader: "🏦 Savings goals", goalRemoved: (n) => `Goal removed: ${n}`,
  goalMissing: (n) => `No goal named ${n}.`, goalTip: "Goal chahiye? goal laptop 100000",
  ruleLearned: (k, c) => `👍 Theek — ab "${k}" → ${c}`, langSet: "Language: English ✅",
  reportOn: "Roz ka summary on ✅", reportOff: "Daily summary off. Ab bhi today / week / month type kar sakte ho.",
  exportEmpty: "File nahi bani. Dobara try karo.", exportCaption: `${BRAND} — your CSV`,
  deleteAsk: "⚠️ SAARA data delete hoga. 10 min mein *confirm* likho, warna kuch aur likho to cancel.",
  deleteDone: `Sab saaf. Dobara start: hi likho — ${BRAND}`, deleteCancelled: "Cancel. Kuch delete nahi hua.",
  nudge: `Aaj abhi kuch log nahi kiya? Chai 50 jaisa kuch bhej do — ${BRAND}`,
  lastHeader: "🧾 Recent", topCats: "Top categories", byAccount: "By account",
  voiceFail: "Voice clear nahi aayi 🎙️ Dobara bolo ya type kar do (chai 50).",
  voiceOff: "Voice abhi band hai — type kar dein.",
};

const ro: Strings = {
  welcome: (name) => {
    const n = firstName(name);
    const hi = salute(n, "Assalam o Alaikum, {name}! 👋", "Assalam o Alaikum! 👋");
    return (
      `${hi}\n\n` +
      `*${BRAND}* pe khush amdeed — roz ka hisaab, seedha WhatsApp pe.\n\n` +
      `Bas likho:\n` +
      `chai 50 · petrol 2000 · salary 150000\n` +
      `chai 40 aur rickshaw 200\n\n` +
      `Kis se diya? Akhir mein: petrol 2000 meezan · chai 50 cash\n\n` +
      `*Banks & wallets:* ${PAY}\n\n` +
      `🎙️ Voice note bhi chalta hai. Reports ke liye neeche menu, ya *help*.`
    );
  },
  help: (name) => {
    const n = firstName(name);
    const head = n ? `${BRAND} — ${n} ke liye` : `${BRAND} — madad`;
    return (
      `📖 *${head}*\n\n` +
      `*Likho:* chai 110 | petrol 2k | salary 150k\n` +
      `*Bachat:* save 5000 laptop\n` +
      `*Report:* menu neeche, ya aaj / week / month\n` +
      `*Balance:* balance · *Undo:* undo · *Last:* last 5\n` +
      `*Budget:* budget food 20000 · *Goals:* goal laptop 100000\n` +
      `*Account:* petrol 2000 jazzcash\n` +
      `*${PAY}*\n` +
      `*Zaban:* urdu · roman · english · delete my data`
    );
  },
  reportListBody: "Report choose karein — jahan data ho wahan chart bhi.",
  reportListBtn: "Report",
  reportListRows: [
    { id: "cmd:today", title: "Aaj", description: "Aaj ka kharcha" },
    { id: "cmd:week", title: "Hafta", description: "7 din" },
    { id: "cmd:month", title: "Mahina", description: "Is mahine" },
    { id: "cmd:lastmonth", title: "Pichla mahina", description: "Last month" },
    { id: "cmd:balance", title: "Balance", description: "Kitna bacha" },
    { id: "cmd:help", title: "Madad", description: "Saari commands" },
  ],
  periods: { today: "Aaj", yesterday: "Kal", week: "Pichle 7 din", month: "Is mahine", lastmonth: "Pichla mahina" },
  income: "Aamdan", expenses: "Kharcha", saved: "Bachat", left: "Bacha",
  noData: "Is arsay ki koi entry nahi.",
  totalsLine: (t, m) => `Aaj: ${t} | Mahina: ${m}`,
  leftMonth: "Is mahine bacha",
  undone: (l) => `↩️ Hata diya: ${l}`, nothingToUndo: "Kuch hatane ko nahi.", edited: (l) => `✏️ Theek: ${l}`,
  unknown: `Samajh nahi aaya 🤔 chai 50 try karo. *help* — ${BRAND}`,
  unsupported: "Sirf text ya voice note 🙏",
  error: "Thori gadbad. Thori der baad dobara.",
  tooMany: (n) => `Ek message mein ${n} entries max.`,
  budgetSet: (c, a) => `🎯 Budget: ${c} ${a}/mahina`, budgetRemoved: (c) => `Budget hata: ${c}`,
  budgetNone: "Budget nahi. Likho: budget food 20000", budgetHeader: "🎯 Budgets (is mahine)",
  budgetWarn: (c, p) => `⚠️ ${c} — ${p}%`, budgetOver: (c) => `🚨 ${c} cross`, budgetMissing: (c) => `${c} budget nahi.`,
  goalCreated: (n, t) => `🏦 Goal: ${n} (${t})`,
  goalNone: "Goal nahi. goal laptop 100000", goalHeader: "🏦 Goals", goalRemoved: (n) => `Goal hata: ${n}`,
  goalMissing: (n) => `Goal ${n} nahi mila.`, goalTip: "goal laptop 100000",
  ruleLearned: (k, c) => `👍 "${k}" ab ${c}`, langSet: "Zaban Roman Urdu ✅",
  reportOn: "Roz summary on ✅", reportOff: "Roz summary off. Aaj / week / month phir bhi.",
  exportEmpty: "File nahi bani.", exportCaption: `${BRAND} CSV`,
  deleteAsk: "⚠️ SAARA data delete. 10 min mein *confirm*.",
  deleteDone: "Saaf. Dobara: hi", deleteCancelled: "Cancel.",
  nudge: `Aaj kuch log kiya? chai 50 — ${BRAND}`,
  lastHeader: "🧾 Haal ki", topCats: "Zyada kharcha", byAccount: "Account se",
  voiceFail: "Voice samajh nahi aayi 🎙️", voiceOff: "Voice band — type kar dein.",
};

const ur: Strings = {
  welcome: (name) => {
    const n = firstName(name);
    const hi = salute(n, "السلام علیکم، {name}! 👋", "السلام علیکم! 👋");
    return (
      `${hi}\n\n` +
      `*${BRAND}* میں خوش آمدید — روزانہ حساب، براہِ راست واٹس ایپ پر۔\n\n` +
      `لکھیں:\n` +
      `چائے 50 · پیٹرول 2000 · تنخواہ 150000\n\n` +
      `ادائیگی کہاں سے؟ آخر میں: petrol 2000 meezan\n\n` +
      `*بینک و والیٹ:* ${PAY}\n\n` +
      `🎙️ وائس نوٹ بھی۔ رپورٹ کے لیے نیچے والا مینو یا *help*۔`
    );
  },
  help: (name) => {
    const n = firstName(name);
    const head = n ? `${BRAND} — ${n}` : BRAND;
    return (
      `📖 *${head}*\n\n` +
      `*اندراج:* چائے 110 | پیٹرول 2k\n` +
      `*رپورٹ:* مینو یا today / week / month\n` +
      `*بیلنس:* balance · *واپس:* undo\n` +
      `*بجٹ:* budget food 20000\n` +
      `*اکاؤنٹ:* ${PAY}\n` +
      `*زبان:* urdu · roman · english`
    );
  },
  reportListBody: "رپورٹ منتخب کریں۔",
  reportListBtn: "رپورٹ",
  reportListRows: [
    { id: "cmd:today", title: "آج", description: "آج کا خرچ" },
    { id: "cmd:week", title: "ہفتہ", description: "7 دن" },
    { id: "cmd:month", title: "مہینہ", description: "اس مہینے" },
    { id: "cmd:balance", title: "بیلنس", description: "باقی رقم" },
    { id: "cmd:help", title: "مدد", description: "تمام کمانڈز" },
  ],
  periods: { today: "آج", yesterday: "کل", week: "پچھلے 7 دن", month: "اس مہینے", lastmonth: "پچھلا مہینہ" },
  income: "آمدن", expenses: "خرچ", saved: "بچت", left: "باقی",
  noData: "اس مدت کی کوئی انٹری نہیں۔",
  totalsLine: (t, m) => `آج: ${t} | مہینہ: ${m}`,
  leftMonth: "اس مہینے باقی",
  undone: (l) => `↩️ ہٹا دیا: ${l}`, nothingToUndo: "کوئی انٹری نہیں۔", edited: (l) => `✏️ درست: ${l}`,
  unknown: `سمجھ نہیں آیا 🤔 ${BRAND}`,
  unsupported: "صرف ٹیکسٹ یا وائس 🙏",
  error: "تھوڑی دیر بعد دوبارہ کوشش کریں۔",
  tooMany: (n) => `ایک میسج میں ${n} انٹریاں۔`,
  budgetSet: (c, a) => `🎯 بجٹ: ${c} ${a}`, budgetRemoved: (c) => `بجٹ ہٹا`,
  budgetNone: "budget food 20000", budgetHeader: "🎯 بجٹ",
  budgetWarn: (c, p) => `⚠️ ${c} ${p}%`, budgetOver: (c) => `🚨 ${c}`, budgetMissing: (c) => `${c}`,
  goalCreated: (n, t) => `🏦 ${n} (${t})`,
  goalNone: "goal laptop 100000", goalHeader: "🏦 اہداف", goalRemoved: (n) => n,
  goalMissing: (n) => n, goalTip: "goal laptop 100000",
  ruleLearned: (k, c) => `👍 "${k}" → ${c}`, langSet: "اردو ✅",
  reportOn: "روزانہ خلاصہ آن", reportOff: "روزانہ بند",
  exportEmpty: "فائل نہیں بنی", exportCaption: BRAND,
  deleteAsk: "⚠️ *confirm* 10 منٹ میں",
  deleteDone: "hi لکھیں", deleteCancelled: "منسوخ",
  nudge: `آج کچھ درج کریں — ${BRAND}`,
  lastHeader: "🧾 حالیہ", topCats: "زمرے", byAccount: "اکاؤنٹ",
  voiceFail: "وائس سمجھ نہیں آئی", voiceOff: "وائس بند",
};

export const L: Record<Lang, Strings> = { en, ro, ur };