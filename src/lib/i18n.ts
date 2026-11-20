import type { Lang } from "./parser";

export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return "Rs " + r.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

type Strings = {
  welcome: string; help: string;
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

const en: Strings = {
  welcome:
    "Assalam o Alaikum! 👋 I'm your expense tracker.\n\nJust type like this:\n• chai paratha 110\n• petrol 2000\n• salary 150000\n• chai 40 aur rickshaw 200\n• kal biryani 450\n\nCommands: today, week, month, balance, undo, last 5, budget, goals, help\n🎙️ You can also send a voice note in English or Urdu.\nTo tag how you paid, add it at the end: petrol 2000 meezan, chai 50 cash.\nUrdu or Roman Urdu both work. Type *urdu* or *roman* to change my reply language.",
  help:
    "📖 *How to use*\n\n*Add:* chai paratha 110 | petrol 2k | salary 150000 | kal chai 40\n*Save:* save 5000 laptop | committee 10000\n*Reports:* today, week, month, last month\n*Balance:* balance\n*Fix:* undo | edit 120\n*Recent:* last 5\n*Budget:* budget food 20000 | budget\n*Goals:* goal laptop 100000 | goals\n*Teach me:* category chai food\n*CSV file:* export\n*Language:* english, urdu, roman\n*Reminders:* report off / report on\n*Paid with:* petrol 2000 meezan | chai 50 cash\n*Voice:* send a voice note 🎙️\n*Privacy:* delete my data",
  periods: { today: "Today", yesterday: "Yesterday", week: "Last 7 days", month: "This month", lastmonth: "Last month" },
  income: "Income", expenses: "Expenses", saved: "Saved", left: "Left",
  noData: "No entries for this period yet.",
  totalsLine: (t, m) => `Today: ${t} | Month: ${m}`,
  leftMonth: "Left this month",
  undone: (l) => `↩️ Removed: ${l}`, nothingToUndo: "Nothing to undo.", edited: (l) => `✏️ Updated: ${l}`,
  unknown: "Didn't get that 🤔 Try: chai 50 or petrol 2000. Type *help* for all commands.",
  unsupported: "I can read text and voice notes only 🙏",
  error: "Something went wrong on my side. Please try again in a moment.",
  tooMany: (n) => `I can save ${n} entries per message. Send the rest in another message.`,
  budgetSet: (c, a) => `🎯 Budget set: ${c} ${a}/month`, budgetRemoved: (c) => `Budget removed: ${c}`,
  budgetNone: "No budgets yet. Try: budget food 20000", budgetHeader: "🎯 Budgets (this month)",
  budgetWarn: (c, p) => `⚠️ ${c} budget ${p}% used`, budgetOver: (c) => `🚨 ${c} budget exceeded`, budgetMissing: (c) => `No budget found for ${c}.`,
  goalCreated: (n, t) => `🏦 Goal created: ${n} (${t}). Add money with: save 5000 ${n}`,
  goalNone: "No goals yet. Try: goal laptop 100000", goalHeader: "🏦 Savings goals", goalRemoved: (n) => `Goal removed: ${n}`,
  goalMissing: (n) => `No goal named ${n}.`, goalTip: "Tip: create a goal with: goal laptop 100000",
  ruleLearned: (k, c) => `👍 Got it. "${k}" will now be saved under ${c}.`, langSet: "Language set to English ✅",
  reportOn: "Daily summary turned on ✅", reportOff: "Daily summary turned off. You can still type today / week / month.",
  exportEmpty: "Couldn't create the file. Please try again.", exportCaption: "Your CSV file",
  deleteAsk: "⚠️ This will permanently delete ALL your data. Reply *confirm* within 10 minutes to continue, or anything else to cancel.",
  deleteDone: "Your data has been deleted. You can start fresh anytime by sending hi.", deleteCancelled: "Cancelled. Nothing was deleted.",
  nudge: "You haven't logged anything today. Any expense to add? (e.g. chai 50)",
  lastHeader: "🧾 Recent entries", topCats: "Top categories", byAccount: "By account",
  voiceFail: "Couldn't understand that voice note 🎙️ Please try again, or type it (e.g. chai 50).",
  voiceOff: "Voice notes aren't switched on yet. Please type for now.",
};

const ro: Strings = {
  welcome:
    "Assalam o Alaikum! 👋 Main aapka kharcha tracker hoon.\n\nBas aise likhein:\n• chai paratha 110\n• petrol 2000\n• salary 150000\n• chai 40 aur rickshaw 200\n• kal biryani 450\n\nCommands: aaj, week, month, balance, undo, last 5, budget, goals, help\n🎙️ Voice note bhi bhej sakte hain (Urdu ya English).\nKis se pay kiya, aakhir mein likh dein: petrol 2000 meezan, chai 50 cash.\nUrdu, Roman Urdu ya English, sab chalta hai. Reply ki zaban badalne ke liye *urdu* ya *english* likhein.",
  help:
    "📖 *Kaise use karein*\n\n*Likhein:* chai paratha 110 | petrol 2k | salary 150000 | kal chai 40\n*Bachat:* save 5000 laptop | committee 10000\n*Report:* aaj, week, month, last month\n*Balance:* balance ya kitna bacha\n*Theek karein:* undo | edit 120\n*Recent:* last 5\n*Budget:* budget food 20000 | budget\n*Goals:* goal laptop 100000 | goals\n*Mujhe sikhayein:* category chai food\n*CSV file:* export\n*Zaban:* english, urdu, roman\n*Reminder:* report off / report on\n*Kis se pay kiya:* petrol 2000 meezan | chai 50 cash\n*Voice:* voice note bhejein 🎙️\n*Privacy:* delete my data",
  periods: { today: "Aaj", yesterday: "Kal", week: "Pichle 7 din", month: "Is mahine", lastmonth: "Pichla mahina" },
  income: "Aamdan", expenses: "Kharcha", saved: "Bachat", left: "Bacha",
  noData: "Is muddat ki abhi koi entry nahi.",
  totalsLine: (t, m) => `Aaj: ${t} | Mahina: ${m}`,
  leftMonth: "Is mahine bacha",
  undone: (l) => `↩️ Hata diya: ${l}`, nothingToUndo: "Hatane ke liye koi entry nahi.", edited: (l) => `✏️ Theek kar diya: ${l}`,
  unknown: "Samajh nahi aaya 🤔 Aise likhein: chai 50 ya petrol 2000. *help* likhein.",
  unsupported: "Main sirf text aur voice note samajh sakta hoon 🙏",
  error: "Mujhse kuch gadbad ho gayi. Thori der baad dobara koshish karein.",
  tooMany: (n) => `Ek message mein ${n} entries save ho sakti hain. Baqi doosre message mein bhejein.`,
  budgetSet: (c, a) => `🎯 Budget set: ${c} ${a}/mahina`, budgetRemoved: (c) => `Budget hata diya: ${c}`,
  budgetNone: "Abhi koi budget nahi. Likhein: budget food 20000", budgetHeader: "🎯 Budgets (is mahine)",
  budgetWarn: (c, p) => `⚠️ ${c} ka ${p}% budget use ho gaya`, budgetOver: (c) => `🚨 ${c} ka budget khatam`, budgetMissing: (c) => `${c} ka budget nahi mila.`,
  goalCreated: (n, t) => `🏦 Goal ban gaya: ${n} (${t}). Paise add karein: save 5000 ${n}`,
  goalNone: "Abhi koi goal nahi. Likhein: goal laptop 100000", goalHeader: "🏦 Bachat goals", goalRemoved: (n) => `Goal hata diya: ${n}`,
  goalMissing: (n) => `${n} naam ka goal nahi mila.`, goalTip: "Tip: goal banayein: goal laptop 100000",
  ruleLearned: (k, c) => `👍 Theek hai. Ab "${k}" ${c} mein jayega.`, langSet: "Zaban Roman Urdu set ho gayi ✅",
  reportOn: "Daily summary chalu ✅", reportOff: "Daily summary band. Aap phir bhi aaj / week / month likh sakte hain.",
  exportEmpty: "File nahi ban saki. Dobara koshish karein.", exportCaption: "Aapki CSV file",
  deleteAsk: "⚠️ Aapka SAARA data hamesha ke liye delete ho jayega. Jaari rakhne ke liye 10 minute mein *confirm* likhein, warna kuch aur likhein.",
  deleteDone: "Aapka data delete ho gaya. Dobara shuru karne ke liye hi likhein.", deleteCancelled: "Cancel. Kuch delete nahi hua.",
  nudge: "Aaj abhi tak kuch log nahi kiya. Koi kharcha reh gaya? (jaise chai 50)",
  lastHeader: "🧾 Haal ki entries", topCats: "Sab se ziada kharcha", byAccount: "Account ke hisab se",
  voiceFail: "Voice note samajh nahi aaya 🎙️ Dobara bolein ya type kar dein (jaise chai 50).",
  voiceOff: "Voice notes abhi chalu nahi hain. Abhi type kar dein.",
};

const ur: Strings = {
  welcome:
    "السلام علیکم! 👋 میں آپ کا خرچ ٹریکر ہوں۔\n\nبس ایسے لکھیں:\n• چائے پراٹھا 110\n• پیٹرول 2000\n• تنخواہ 150000\n• چائے 40 اور رکشہ 200\n• کل بریانی 450\n\nکمانڈز: آج، ہفتہ، مہینہ، بیلنس، undo، last 5، budget، goals، مدد\n🎙️ آپ وائس نوٹ بھی بھیج سکتے ہیں (اردو یا انگلش)۔\nکس سے ادائیگی کی، آخر میں لکھ دیں: petrol 2000 meezan، chai 50 cash۔\nاردو، رومن اردو یا انگلش، سب چلتا ہے۔ جواب کی زبان بدلنے کے لیے *english* یا *roman* لکھیں۔",
  help:
    "📖 *استعمال کا طریقہ*\n\n*اندراج:* چائے پراٹھا 110 | پیٹرول 2k | تنخواہ 150000 | کل چائے 40\n*بچت:* save 5000 laptop | committee 10000\n*رپورٹ:* آج، ہفتہ، مہینہ، پچھلا مہینہ\n*بیلنس:* بیلنس\n*درستی:* undo | edit 120\n*حالیہ:* last 5\n*بجٹ:* budget food 20000\n*اہداف:* goal laptop 100000 | goals\n*مجھے سکھائیں:* category chai food\n*CSV فائل:* export\n*زبان:* english, urdu, roman\n*یاد دہانی:* report off / report on\n*ادائیگی کا ذریعہ:* petrol 2000 meezan | chai 50 cash\n*وائس:* وائس نوٹ بھیجیں 🎙️\n*ڈیٹا حذف:* delete my data",
  periods: { today: "آج", yesterday: "کل", week: "پچھلے 7 دن", month: "اس مہینے", lastmonth: "پچھلا مہینہ" },
  income: "آمدن", expenses: "خرچ", saved: "بچت", left: "باقی",
  noData: "اس مدت کی ابھی کوئی انٹری نہیں۔",
  totalsLine: (t, m) => `آج: ${t} | مہینہ: ${m}`,
  leftMonth: "اس مہینے باقی",
  undone: (l) => `↩️ ہٹا دیا: ${l}`, nothingToUndo: "ہٹانے کے لیے کوئی انٹری نہیں۔", edited: (l) => `✏️ درست کر دیا: ${l}`,
  unknown: "سمجھ نہیں آیا 🤔 ایسے لکھیں: چائے 50 یا پیٹرول 2000۔ مدد کے لیے *مدد* لکھیں۔",
  unsupported: "میں صرف ٹیکسٹ اور وائس نوٹ سمجھ سکتا ہوں 🙏",
  error: "مجھ سے کچھ گڑبڑ ہو گئی۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔",
  tooMany: (n) => `ایک میسج میں ${n} انٹریاں محفوظ ہو سکتی ہیں۔ باقی اگلے میسج میں بھیجیں۔`,
  budgetSet: (c, a) => `🎯 بجٹ مقرر: ${c} ${a}/مہینہ`, budgetRemoved: (c) => `بجٹ ہٹا دیا: ${c}`,
  budgetNone: "ابھی کوئی بجٹ نہیں۔ لکھیں: budget food 20000", budgetHeader: "🎯 بجٹ (اس مہینے)",
  budgetWarn: (c, p) => `⚠️ ${c} کا ${p}% بجٹ استعمال ہو گیا`, budgetOver: (c) => `🚨 ${c} کا بجٹ ختم`, budgetMissing: (c) => `${c} کا بجٹ نہیں ملا۔`,
  goalCreated: (n, t) => `🏦 ہدف بن گیا: ${n} (${t})۔ پیسے شامل کریں: save 5000 ${n}`,
  goalNone: "ابھی کوئی ہدف نہیں۔ لکھیں: goal laptop 100000", goalHeader: "🏦 بچت کے اہداف", goalRemoved: (n) => `ہدف ہٹا دیا: ${n}`,
  goalMissing: (n) => `${n} نام کا ہدف نہیں ملا۔`, goalTip: "مشورہ: ہدف بنائیں: goal laptop 100000",
  ruleLearned: (k, c) => `👍 ٹھیک ہے۔ اب "${k}" ${c} میں جائے گا۔`, langSet: "زبان اردو سیٹ ہو گئی ✅",
  reportOn: "روزانہ خلاصہ چالو ✅", reportOff: "روزانہ خلاصہ بند۔ آپ پھر بھی آج / ہفتہ / مہینہ لکھ سکتے ہیں۔",
  exportEmpty: "فائل نہیں بن سکی۔ دوبارہ کوشش کریں۔", exportCaption: "آپ کی CSV فائل",
  deleteAsk: "⚠️ آپ کا سارا ڈیٹا ہمیشہ کے لیے حذف ہو جائے گا۔ جاری رکھنے کے لیے 10 منٹ میں *confirm* لکھیں، ورنہ کچھ اور لکھیں۔",
  deleteDone: "آپ کا ڈیٹا حذف ہو گیا۔ دوبارہ شروع کرنے کے لیے hi لکھیں۔", deleteCancelled: "منسوخ۔ کچھ حذف نہیں ہوا۔",
  nudge: "آج ابھی تک کچھ درج نہیں کیا۔ کوئی خرچ رہ گیا؟ (جیسے چائے 50)",
  lastHeader: "🧾 حالیہ انٹریاں", topCats: "سب سے زیادہ خرچ", byAccount: "اکاؤنٹ کے مطابق",
  voiceFail: "وائس نوٹ سمجھ نہیں آیا 🎙️ دوبارہ بولیں یا ٹائپ کر دیں (جیسے چائے 50)۔",
  voiceOff: "وائس نوٹ ابھی چالو نہیں ہیں۔ ابھی ٹائپ کر دیں۔",
};

export const L: Record<Lang, Strings> = { en, ro, ur };
