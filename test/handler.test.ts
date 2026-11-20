import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- in-memory fake of the db layer ----
const store = {
  users: [] as any[], tx: [] as any[], goals: [] as any[], budgets: [] as any[], rules: [] as any[], seen: new Set<string>(),
};
let seq = 0;
const id = () => `id${++seq}`;

vi.mock("@/lib/db", () => ({
  claimMessage: async (m: string) => (store.seen.has(m) ? false : (store.seen.add(m), true)),
  getOrCreateUser: async (phone: string, name?: string) => {
    let u = store.users.find((x) => x.phone === phone);
    if (u) return { user: { ...u }, isNew: false };
    u = { id: id(), phone, name: name ?? null, lang: null, timezone: "Asia/Karachi", daily_report: true, last_inbound_at: null, pending_action: null, pending_at: null };
    store.users.push(u);
    return { user: { ...u }, isNew: true };
  },
  ensureUserInbound: async (phone: string, name?: string, at = new Date()) => {
    let u = store.users.find((x) => x.phone === phone);
    if (u) {
      if (name) u.name = name;
      u.last_inbound_at = at.toISOString();
      return { user: { ...u }, isNew: false };
    }
    u = { id: id(), phone, name: name ?? null, lang: null, timezone: "Asia/Karachi", daily_report: true, last_inbound_at: at.toISOString(), pending_action: null, pending_at: null };
    store.users.push(u);
    return { user: { ...u }, isNew: true };
  },
  updateUser: async (uid: string, patch: any) => Object.assign(store.users.find((u) => u.id === uid)!, patch),
  deleteUser: async (uid: string) => {
    store.users = store.users.filter((u) => u.id !== uid);
    store.tx = store.tx.filter((t) => t.user_id !== uid);
  },
  insertTx: async (rows: any[]) => rows.map((r) => { const t = { ...r, id: id(), created_at: new Date(Date.now() + seq).toISOString() }; store.tx.push(t); return t; }),
  fetchTx: async (uid: string, from: Date, to: Date) =>
    store.tx.filter((t) => t.user_id === uid && !t.deleted_at && new Date(t.occurred_at) >= from && new Date(t.occurred_at) < to),
  lastTx: async (uid: string, n = 1) =>
    store.tx.filter((t) => t.user_id === uid && !t.deleted_at).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, n),
  softDelete: async (tid: string) => { store.tx.find((t) => t.id === tid)!.deleted_at = "x"; },
  updateTxAmount: async (tid: string, a: number) => { store.tx.find((t) => t.id === tid)!.amount = a; },
  listGoals: async (uid: string) => store.goals.filter((g) => g.user_id === uid),
  upsertGoal: async (uid: string, name: string, target: number) => {
    const g = store.goals.find((x) => x.user_id === uid && x.name === name);
    if (g) g.target = target; else store.goals.push({ id: id(), user_id: uid, name, target });
  },
  deleteGoal: async () => true,
  goalSavedMap: async (uid: string) => {
    const o: Record<string, number> = {};
    for (const t of store.tx) if (t.user_id === uid && !t.deleted_at && t.goal_id) o[t.goal_id] = (o[t.goal_id] ?? 0) + t.amount;
    return o;
  },
  listBudgets: async (uid: string) => store.budgets.filter((b) => b.user_id === uid),
  setBudget: async (uid: string, category: string, monthly_limit: number) => {
    const b = store.budgets.find((x) => x.user_id === uid && x.category === category);
    if (b) b.monthly_limit = monthly_limit; else store.budgets.push({ user_id: uid, category, monthly_limit });
  },
  removeBudget: async () => true,
  listRules: async (uid: string) => store.rules.filter((r) => r.user_id === uid),
  addRule: async (uid: string, keyword: string, category: string) => { store.rules.push({ user_id: uid, keyword, category }); },
}));

const sent: string[] = [];
vi.mock("@/lib/whatsapp", () => ({
  sendText: async (_to: string, t: string) => { sent.push(t); return true; },
  sendImage: async (_to: string, l: string) => { sent.push("[image]"); return true; },
  sendReportList: async () => { sent.push("[report-list]"); return true; },
  sendButtonMessage: async (_to: string, t: string) => { sent.push(t); return true; },
  sendDocument: async () => true,
  markRead: async () => true,
  verifySignature: () => true,
  downloadMedia: async (id: string) => (id === "bad" ? null : { data: Buffer.from("x"), mime: "audio/ogg" }),
}));

let voiceOn = true;
let transcriptFor: Record<string, string | null> = {};
vi.mock("@/lib/transcribe", () => ({
  voiceEnabled: () => voiceOn,
  transcribeAudio: async (data: Buffer) => transcriptFor[data.toString()] ?? "chai paratha 110",
}));

import { handleIncoming } from "@/lib/handle";

let n = 0;
async function say(text: string, from = "923001234567") {
  sent.length = 0;
  await handleIncoming({
    entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: "Test" } }], messages: [{ id: `m${++n}`, from, type: "text", text: { body: text } }] } }] }],
  });
  return sent.join("\n");
}

async function pickLang(from = "923001234567", lang: "en" | "ro" | "ur" = "en") {
  sent.length = 0;
  await handleIncoming({
    entry: [{ changes: [{ value: { messages: [{ id: `m${++n}`, from, type: "interactive", interactive: { button_reply: { id: `lang:${lang}` } } }] } }] }],
  });
  return sent.join("\n");
}

async function onboard(from = "923001234567") {
  await say("hi", from);
  return pickLang(from, "en");
}

beforeEach(() => {
  vi.stubGlobal("fetch", async () => ({ ok: false, json: async () => ({}) })); // charts/LLM off
});

describe("full chat flow", () => {
  it("works end to end", async () => {
    expect(await say("hi")).toContain("zaban");
    const hello = await pickLang();
    expect(hello).toContain("Hisab On Tip");
    expect(hello).toContain("Test");

    let r = await say("chai paratha 110");
    expect(r).toContain("Chai paratha");
    expect(r).toContain("Rs 110");
    expect(r).toContain("Today: Rs 110");

    r = await say("salary 150000");
    expect(r).toContain("+Rs 150,000");
    expect(r).toContain("Left this month: Rs 149,890");

    r = await say("petrol 2k aur chai 40");
    expect(r).toContain("Rs 2,000");
    expect(r).toContain("Rs 40");
    expect(r).toContain("Σ Rs 2,040");

    r = await say("today");
    expect(r).toContain("Today");
    expect(r).toContain("Rs 2,150");
    expect(r).toContain("Transport");

    expect(await say("budget food 200")).toMatch(/Budget/i);
    r = await say("chai 100");
    expect(r).toMatch(/exceeded|used|cross/);

    expect(await say("undo")).toContain("Removed");
    expect(await say("balance")).toContain("Left");

    expect(await say("goal laptop 100000")).toContain("Goal");
    r = await say("save 5000 laptop");
    expect(r).toContain("laptop");
    expect(r).toContain("5%");
    expect(await say("goals")).toContain("laptop");

    expect(await say("kal biryani 450")).toContain("Biryani");
    expect(await say("last 3")).toContain("Recent");
  });

  it("dedupes retried webhooks", async () => {
    const body = { entry: [{ changes: [{ value: { messages: [{ id: "same", from: "923009999999", type: "text", text: { body: "chai 50" } }] } }] }] };
    sent.length = 0;
    await handleIncoming(body);
    const first = sent.length;
    await handleIncoming(body);
    expect(sent.length).toBe(first);
  });

  it("replies in Urdu and understands Urdu script", async () => {
    const u = "923111111111";
    expect(await say("چائے پراٹھا 110", u)).toContain("Rs 110");
    expect(await say("آج", u)).toContain("آج");
    expect(await say("kitna bacha", u)).toContain("باقی");
    expect(await say("roman", u)).toContain("Roman Urdu");
  });

  it("delete my data needs confirmation", async () => {
    const u = "923222222222";
    await say("chai 50", u);
    expect(await say("delete my data", u)).toContain("confirm");
    expect(await say("confirm", u)).toMatch(/cleared|Saaf|deleted|hi/i);
    expect(store.users.find((x) => x.phone === u)).toBeUndefined();
  });

  it("non-text messages get a friendly reply", async () => {
    sent.length = 0;
    await handleIncoming({ entry: [{ changes: [{ value: { messages: [{ id: "aud1", from: "923333333333", type: "audio" }] } }] }] });
    expect(sent.join("")).toMatch(/text|voice/i);
  });

  it("garbage gets the help hint", async () => {
    const u = "923444444444";
    await onboard(u);
    expect(await say("asdf qwer", u)).toMatch(/catch|samajh/i);
  });
});

describe("voice notes", () => {
  const voice = async (from: string, mediaId = "ok1") => {
    sent.length = 0;
    await handleIncoming({ entry: [{ changes: [{ value: { messages: [{ id: `v${++n}`, from, type: "audio", audio: { id: mediaId, voice: true } }] } }] }] });
    return sent.join("\n");
  };

  it("transcribes, shows what it heard, and logs the entry", async () => {
    const r = await voice("923555555551");
    expect(r).toContain("🎙️ chai paratha 110");
    expect(r).toContain("Rs 110");
  });
  it("picks the reply language from a first-time voice note", async () => {
    transcriptFor = { x: "kal biryani paanch sau" };
    const r = await voice("923555555552");
    expect(r).toContain("Biryani");
    expect(r).toContain("Rs 500");
    expect(r).toContain("Aaj:"); // Roman Urdu totals line
    transcriptFor = {};
  });
  it("friendly message when the audio can't be fetched", async () => {
    expect(await voice("923555555553", "bad")).toMatch(/Voice|voice/i);
  });
  it("tells the user when voice is switched off", async () => {
    voiceOn = false;
    expect(await voice("923555555554")).toMatch(/Voice|band/i);
    voiceOn = true;
  });
  it("deleting data cannot be confirmed by voice", async () => {
    const u = "923555555555";
    await say("chai 50", u);
    await say("delete my data", u);
    transcriptFor = { x: "confirm" };
    await voice(u);
    transcriptFor = {};
    expect(store.users.find((x) => x.phone === u)).toBeDefined();
  });
});

describe("account tags in chat", () => {
  it("shows the account and a by-account breakdown", async () => {
    const u = "923666666666";
    expect(await say("petrol 2000 meezan", u)).toContain("· Meezan");
    await say("chai 50 cash", u);
    const r = await say("today", u);
    expect(r).toContain("By account");
    expect(r).toContain("Meezan: Rs 2,000");
    expect(r).toContain("Cash: Rs 50");
  });
});
