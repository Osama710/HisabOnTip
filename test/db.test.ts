import { describe, it, expect, vi } from "vitest";

// Real Postgres (WASM) running the real schema file, so the SQL in db.ts is actually exercised.
vi.mock("@/lib/pg", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const { readFileSync } = await import("fs");
  const pg = new PGlite();
  await pg.exec(readFileSync("db/schema.sql", "utf8"));
  return { q: async (text: string, params: unknown[] = []) => (await pg.query(text, params as any[])).rows };
});

import * as db from "@/lib/db";

describe("database layer on real Postgres", () => {
  it("dedupes webhook message ids", async () => {
    expect(await db.claimMessage("wamid.1")).toBe(true);
    expect(await db.claimMessage("wamid.1")).toBe(false);
  });

  it("creates a user once and updates fields", async () => {
    const a = await db.getOrCreateUser("923001112222", "Osama");
    expect(a.isNew).toBe(true);
    const b = await db.getOrCreateUser("923001112222");
    expect(b.isNew).toBe(false);
    expect(b.user.id).toBe(a.user.id);
    expect(b.user.timezone).toBe("Asia/Karachi");

    const stamp = new Date("2026-11-20T10:00:00Z").toISOString();
    await db.updateUser(a.user.id, { lang: "ro", last_inbound_at: stamp, pending_action: "delete", pending_at: stamp });
    const c = (await db.getOrCreateUser("923001112222")).user;
    expect(c.lang).toBe("ro");
    expect(c.last_inbound_at).toBe(stamp);
    expect(c.pending_action).toBe("delete");
    await db.updateUser(a.user.id, { pending_action: null, pending_at: null });
    expect((await db.getOrCreateUser("923001112222")).user.pending_action).toBeNull();
    expect(await db.getUserBasic(a.user.id)).toMatchObject({ timezone: "Asia/Karachi" });
  });

  it("stores, queries by date range, undoes and edits transactions", async () => {
    const { user } = await db.getOrCreateUser("923003334444");
    const goal = (await (async () => { await db.upsertGoal(user.id, "laptop", 100000); return db.listGoals(user.id); })())[0];
    const rows = await db.insertTx([
      { user_id: user.id, type: "expense", amount: 110, category: "Food", note: "Chai paratha", goal_id: null, account: "Cash", occurred_at: "2026-11-20T08:00:00.000Z" },
      { user_id: user.id, type: "expense", amount: 2000, category: "Transport", note: "Petrol", goal_id: null, account: "Meezan", occurred_at: "2026-11-19T08:00:00.000Z" },
      { user_id: user.id, type: "income", amount: 150000, category: "Salary", note: "Salary", goal_id: null, account: null, occurred_at: "2026-10-31T08:00:00.000Z" },
      { user_id: user.id, type: "saving", amount: 5000, category: "Savings", note: "Laptop", goal_id: goal.id, account: null, occurred_at: "2026-11-20T09:00:00.000Z" },
    ]);
    expect(rows).toHaveLength(4);
    expect(typeof rows[0].amount).toBe("number");
    expect(rows[0].account).toBe("Cash");

    const nov = await db.fetchTx(user.id, new Date("2026-11-01T00:00:00Z"), new Date("2026-12-01T00:00:00Z"));
    expect(nov.map((t) => t.amount)).toEqual([2000, 110, 5000]); // ordered by occurred_at, October salary excluded
    expect(nov[0].occurred_at).toBe("2026-11-19T08:00:00.000Z");

    expect(await db.goalSavedMap(user.id)).toEqual({ [goal.id]: 5000 });

    const [last] = await db.lastTx(user.id, 1);
    expect(last.note).toBe("Laptop");
    await db.updateTxAmount(last.id, 7000);
    expect((await db.goalSavedMap(user.id))[goal.id]).toBe(7000);
    await db.softDelete(last.id);
    expect((await db.lastTx(user.id, 1))[0].note).toBe("Salary"); // newest remaining, by insertion order
    expect(await db.goalSavedMap(user.id)).toEqual({});
    expect(await db.lastTx(user.id, 10)).toHaveLength(3);
  });

  it("handles budgets, goals and category rules with upsert", async () => {
    const { user } = await db.getOrCreateUser("923005556666");
    await db.setBudget(user.id, "Food", 20000);
    await db.setBudget(user.id, "Food", 25000);
    expect(await db.listBudgets(user.id)).toEqual([{ category: "Food", monthly_limit: 25000 }]);
    expect(await db.removeBudget(user.id, "Food")).toBe(true);
    expect(await db.removeBudget(user.id, "Food")).toBe(false);

    await db.upsertGoal(user.id, "bike", 50000);
    await db.upsertGoal(user.id, "bike", 60000);
    const goals = await db.listGoals(user.id);
    expect(goals).toHaveLength(1);
    expect(goals[0].target).toBe(60000);
    expect(await db.deleteGoal(user.id, "bike")).toBe(true);

    await db.addRule(user.id, "chai", "Food");
    await db.addRule(user.id, "chai", "Groceries");
    expect(await db.listRules(user.id)).toEqual([{ keyword: "chai", category: "Groceries" }]);
  });

  it("selects only recently active users with reports on, and cascades on delete", async () => {
    const { user: a } = await db.getOrCreateUser("923007770001");
    const { user: b } = await db.getOrCreateUser("923007770002");
    const { user: c } = await db.getOrCreateUser("923007770003");
    const now = Date.now();
    await db.updateUser(a.id, { last_inbound_at: new Date(now - 3600e3).toISOString() });
    await db.updateUser(b.id, { last_inbound_at: new Date(now - 48 * 3600e3).toISOString() });
    await db.updateUser(c.id, { last_inbound_at: new Date(now - 3600e3).toISOString(), daily_report: false });
    const ids = (await db.usersForCron(new Date(now - 23 * 3600e3))).map((u) => u.phone);
    expect(ids).toContain("923007770001");
    expect(ids).not.toContain("923007770002");
    expect(ids).not.toContain("923007770003");

    await db.insertTx([{ user_id: a.id, type: "expense", amount: 5, category: "Food", note: "x", goal_id: null, account: null, occurred_at: new Date().toISOString() }]);
    await db.deleteUser(a.id);
    expect(await db.lastTx(a.id, 5)).toEqual([]);
    expect(await db.getUserBasic(a.id)).toBeNull();
    await db.pingDb();
  });

  it("rejects bad data at the database level", async () => {
    const { user } = await db.getOrCreateUser("923008880000");
    await expect(
      db.insertTx([{ user_id: user.id, type: "expense", amount: -5, category: "x", note: "x", goal_id: null, account: null, occurred_at: new Date().toISOString() }])
    ).rejects.toThrow();
  });
});
