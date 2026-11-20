import { describe, it, expect } from "vitest";
import { parseMessage } from "@/lib/parser";

const now = new Date("2026-11-20T10:00:00Z"); // Fri 20 Nov, 15:00 in Karachi
const ctx = { now, tz: "Asia/Karachi", rules: [] };

function entries(text: string) {
  const p = parseMessage(text, ctx);
  if (p.kind !== "entries") throw new Error(`expected entries for "${text}", got ${p.kind}`);
  return p.entries;
}
const one = (text: string) => {
  const e = entries(text);
  expect(e).toHaveLength(1);
  return e[0];
};

describe("English / basic", () => {
  it("chai paratha 110", () => {
    const e = one("chai paratha 110");
    expect(e).toMatchObject({ type: "expense", amount: 110, category: "Food", note: "Chai paratha" });
  });
  it("car petrol 2000", () => expect(one("car petrol 2000")).toMatchObject({ amount: 2000, category: "Transport" }));
  it("salary 150000", () => expect(one("salary 150000")).toMatchObject({ type: "income", amount: 150000, category: "Salary" }));
  it("amount first", () => expect(one("50 chai")).toMatchObject({ amount: 50, category: "Food" }));
  it("bare amount", () => expect(one("110")).toMatchObject({ amount: 110, category: "Other" }));
  it("5k / 1.5k", () => {
    expect(one("petrol 5k").amount).toBe(5000);
    expect(one("1.5k chai").amount).toBe(1500);
    expect(one("rent 35K").amount).toBe(35000);
  });
  it("commas and currency noise", () => {
    expect(one("1,500 grocery").amount).toBe(1500);
    expect(one("rs 500 petrol").amount).toBe(500);
    expect(one("petrol rs.500/-").amount).toBe(500);
    expect(one("petrol 500rs").amount).toBe(500);
    expect(one("petrol 500 rupees").amount).toBe(500);
  });
  it("lakh", () => {
    expect(one("bonus 2 lakh").amount).toBe(200000);
    expect(one("bonus 2.5 lakh").amount).toBe(250000);
  });
  it("english words", () => expect(one("lunch five hundred").amount).toBe(500));
});

describe("Roman Urdu", () => {
  it("number words", () => {
    expect(one("dhai hazar petrol").amount).toBe(2500);
    expect(one("paanch sau dinner").amount).toBe(500);
    expect(one("dedh sau chai").amount).toBe(150);
    expect(one("sawa sau chai").amount).toBe(125);
    expect(one("do hazar paanch sau grocery").amount).toBe(2500);
    expect(one("ek lakh pachas hazar salary").amount).toBe(150000);
    expect(one("paanchsau dinner").amount).toBe(500);
    expect(one("5hazar petrol").amount).toBe(5000);
  });
  it("income by verb", () => {
    expect(one("ali se 5000 mile")).toMatchObject({ type: "income", amount: 5000 });
    expect(one("ali ne diye 5000")).toMatchObject({ type: "income", amount: 5000 });
    expect(one("got 5k from ali")).toMatchObject({ type: "income", amount: 5000 });
    expect(one("+5000")).toMatchObject({ type: "income", amount: 5000 });
  });
  it("expense when given to someone", () => {
    expect(one("ali ko diye 5000")).toMatchObject({ type: "expense", amount: 5000 });
    expect(one("maid salary 15000")).toMatchObject({ type: "expense", amount: 15000 });
    expect(one("salary diya 20000 masi ko")).toMatchObject({ type: "expense" });
  });
  it("categories", () => {
    expect(one("bijli ka bill 8500").category).toBe("Bills");
    expect(one("pertol 2000").category).toBe("Transport");
    expect(one("ptrol 1500").category).toBe("Transport");
    expect(one("sabzi 400").category).toBe("Groceries");
    expect(one("dawai 650").category).toBe("Health");
    expect(one("ghar ka kiraya 35000").category).toBe("Rent");
    expect(one("rickshaw kiraya 200").category).toBe("Transport");
    expect(one("grocry 3000").category).toBe("Groceries");
    expect(one("anda paratha 150").category).toBe("Food");
    expect(one("mobile load 500").category).toBe("Bills");
    expect(one("gym fee 5000").category).toBe("Fitness");
    expect(one("diapers 1800").category).toBe("Kids");
  });
});

describe("Urdu script", () => {
  it("food", () => expect(one("چائے پراٹھا 110")).toMatchObject({ amount: 110, category: "Food" }));
  it("urdu digits", () => expect(one("پیٹرول ۲۰۰۰")).toMatchObject({ amount: 2000, category: "Transport" }));
  it("salary", () => expect(one("تنخواہ ۱۵۰۰۰۰")).toMatchObject({ type: "income", amount: 150000, category: "Salary" }));
  it("number words", () => {
    expect(one("پیٹرول دو ہزار").amount).toBe(2000);
    expect(one("کھانا پانچ سو").amount).toBe(500);
    expect(one("کرایہ ڈھائی ہزار").amount).toBe(2500);
  });
});

describe("multi-entry and quantity", () => {
  it("separators", () => {
    expect(entries("chai 40 aur rickshaw 200").map((e) => e.amount)).toEqual([40, 200]);
    expect(entries("chai 40, rickshaw 200").map((e) => e.amount)).toEqual([40, 200]);
    expect(entries("chai 50\npetrol 2000").map((e) => e.amount)).toEqual([50, 2000]);
    expect(entries("chai 40 and rickshaw 200 & lunch 300").map((e) => e.amount)).toEqual([40, 200, 300]);
  });
  it("no separator", () => {
    const e = entries("chai 40 rickshaw 200");
    expect(e.map((x) => x.amount)).toEqual([40, 200]);
    expect(e.map((x) => x.category)).toEqual(["Food", "Transport"]);
  });
  it("glues words without numbers", () => {
    const e = one("chai, paratha 110");
    expect(e.amount).toBe(110);
  });
  it("quantities are not amounts", () => {
    expect(one("2 chai 100").amount).toBe(100);
    expect(one("2 kg aata 500")).toMatchObject({ amount: 500, category: "Groceries" });
    expect(one("12 samosay 120").amount).toBe(120);
    expect(entries("5 chai 100 3 paratha 150").map((e) => e.amount)).toEqual([100, 150]);
  });
});

describe("dates", () => {
  const day = (t: string) => one(t).date;
  it("kal / yesterday / parso", () => {
    expect(day("kal chai 40")).toEqual({ y: 2026, m: 11, d: 19 });
    expect(day("chai 40 yesterday")).toEqual({ y: 2026, m: 11, d: 19 });
    expect(day("parso petrol 1000")).toEqual({ y: 2026, m: 11, d: 18 });
    expect(day("5 din pehle petrol 1000")).toEqual({ y: 2026, m: 11, d: 15 });
    expect(day("3 days ago petrol 1000")).toEqual({ y: 2026, m: 11, d: 17 });
  });
  it("explicit dates", () => {
    expect(day("12 nov petrol 3000")).toEqual({ y: 2026, m: 11, d: 12 });
    expect(day("petrol 3000 nov 12")).toEqual({ y: 2026, m: 11, d: 12 });
    expect(day("petrol 3000 12/11")).toEqual({ y: 2026, m: 11, d: 12 });
    expect(day("petrol 3000 25-12-2025")).toEqual({ y: 2025, m: 12, d: 25 });
    expect(one("12 nov petrol 3000").amount).toBe(3000);
  });
  it("weekdays", () => expect(day("monday petrol 1000")).toEqual({ y: 2026, m: 11, d: 16 }));
  it("leading date applies to all entries", () => {
    const e = entries("kal chai 40 aur petrol 2000");
    expect(e.every((x) => x.date?.d === 19)).toBe(true);
  });
  it("no date by default", () => expect(day("chai 40")).toBeNull());
});

describe("savings", () => {
  it("save with goal", () => {
    expect(one("save 5000 laptop")).toMatchObject({ type: "saving", amount: 5000, note: "Laptop" });
  });
  it("committee", () => expect(one("committee 10000")).toMatchObject({ type: "saving", category: "Committee" }));
  it("committee payout is income", () => expect(one("committee mili 200000")).toMatchObject({ type: "income" }));
  it("bachat", () => expect(one("bachat 2000")).toMatchObject({ type: "saving" }));
});

describe("commands", () => {
  const cmd = (t: string) => {
    const p = parseMessage(t, ctx);
    return p.kind === "command" ? p.command : p.kind;
  };
  it("summaries", () => {
    expect(cmd("today")).toEqual({ cmd: "summary", period: "today" });
    expect(cmd("aaj")).toEqual({ cmd: "summary", period: "today" });
    expect(cmd("آج")).toEqual({ cmd: "summary", period: "today" });
    expect(cmd("aaj ka kharcha")).toEqual({ cmd: "summary", period: "today" });
    expect(cmd("week")).toEqual({ cmd: "summary", period: "week" });
    expect(cmd("is hafte ka hisab")).toMatchObject({ cmd: "summary" });
    expect(cmd("month")).toEqual({ cmd: "summary", period: "month" });
    expect(cmd("پچھلا مہینہ")).toEqual({ cmd: "summary", period: "lastmonth" });
    expect(cmd("last month")).toEqual({ cmd: "summary", period: "lastmonth" });
  });
  it("balance", () => {
    expect(cmd("balance")).toEqual({ cmd: "balance" });
    expect(cmd("kitna bacha")).toEqual({ cmd: "balance" });
    expect(cmd("بیلنس")).toEqual({ cmd: "balance" });
  });
  it("undo/last/edit", () => {
    expect(cmd("undo")).toEqual({ cmd: "undo" });
    expect(cmd("galat")).toEqual({ cmd: "undo" });
    expect(cmd("last delete")).toEqual({ cmd: "undo" });
    expect(cmd("last 5")).toEqual({ cmd: "last", n: 5 });
    expect(cmd("edit 120")).toEqual({ cmd: "edit", amount: 120 });
    expect(cmd("theek 1.5k")).toEqual({ cmd: "edit", amount: 1500 });
  });
  it("budget/goals/category/language", () => {
    expect(cmd("budget food 20000")).toEqual({ cmd: "budget", action: "set", category: "Food", amount: 20000 });
    expect(cmd("budget khana 20k")).toEqual({ cmd: "budget", action: "set", category: "Food", amount: 20000 });
    expect(cmd("budget")).toEqual({ cmd: "budget", action: "list" });
    expect(cmd("goal laptop 100000")).toEqual({ cmd: "goals", action: "create", name: "laptop", target: 100000 });
    expect(cmd("goals")).toEqual({ cmd: "goals", action: "list" });
    expect(cmd("category chai food")).toEqual({ cmd: "category", keyword: "chai", category: "Food" });
    expect(cmd("urdu")).toEqual({ cmd: "language", lang: "ur" });
    expect(cmd("roman urdu")).toEqual({ cmd: "language", lang: "ro" });
    expect(cmd("اردو")).toEqual({ cmd: "language", lang: "ur" });
    expect(cmd("delete my data")).toEqual({ cmd: "delete_data" });
    expect(cmd("report off")).toEqual({ cmd: "report_toggle", on: false });
    expect(cmd("help")).toEqual({ cmd: "help" });
  });
  it("greetings and thanks", () => {
    expect(cmd("hi")).toBe("greeting");
    expect(cmd("assalamualaikum")).toBe("greeting");
    expect(cmd("السلام علیکم")).toBe("greeting");
    expect(cmd("shukriya")).toBe("thanks");
    expect(cmd("👍")).toBe("thanks");
  });
  it("things that look like commands but are entries", () => {
    expect(cmd("today 50")).toBe("entries");
    expect(cmd("bacha 500")).toBe("entries");
    expect(cmd("save 5000 laptop")).toBe("entries");
  });
  it("garbage is unknown", () => expect(cmd("asdf qwer")).toBe("unknown"));
});

describe("payment account tags", () => {
  it("tags cash / banks / wallets and keeps the note clean", () => {
    expect(one("petrol 2000 meezan")).toMatchObject({ amount: 2000, category: "Transport", account: "Meezan", note: "Petrol" });
    expect(one("chai 50 cash")).toMatchObject({ amount: 50, account: "Cash", note: "Chai" });
    expect(one("cash chai 50")).toMatchObject({ account: "Cash" });
    expect(one("lunch 450 easypaisa").account).toBe("Easypaisa");
    expect(one("grocery 5000 debit card").account).toBe("Card");
    expect(one("salary 150000 meezan bank")).toMatchObject({ type: "income", account: "Meezan" });
    expect(one("میزان چائے 50")).toMatchObject({ account: "Meezan" });
  });
  it("no tag means no account", () => expect(one("chai 50").account).toBeNull());
  it("one account applies to the whole line", () => {
    const e = entries("chai 40 aur rickshaw 200 cash");
    expect(e.map((x) => x.account)).toEqual(["Cash", "Cash"]);
  });
  it("credit card bill is a loan payment, not an account", () => {
    expect(one("credit card bill 20000")).toMatchObject({ category: "Loans", account: null });
    expect(one("petrol 2000 credit card")).toMatchObject({ category: "Transport", account: "Credit card" });
  });
});
