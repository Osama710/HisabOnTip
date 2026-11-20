import {
  Tx, User, addRule, claimMessage, deleteGoal, deleteUser, ensureUserInbound, fetchTx, goalSavedMap, insertTx, lastTx,
  listBudgets, listGoals, listRules, removeBudget, setBudget, softDelete, updateTxAmount, updateUser, upsertGoal,
} from "./db";
import { exportUrl } from "./export-link";
import { LANG_BUTTONS, L, langPickerIntro, money } from "./i18n";
import { llmParse } from "./llm";
import { Command, Lang, ParsedEntry, detectLang, normalize, parseMessage } from "./parser";
import { aggregate, buildSummary, budgetLines } from "./reports";
import { dateLabel, occurredAt, periodRange, ymdOf } from "./time";
import { transcribeAudio, voiceEnabled } from "./transcribe";
import { downloadMedia, markRead, sendButtonMessage, sendDocument, sendImage, sendReportList, sendText } from "./whatsapp";

const MAX_ENTRIES = 15;
const allowed = () =>
  (process.env.ALLOWED_PHONES || "").split(",").map((s) => s.replace(/\D/g, "")).filter(Boolean);

export async function handleIncoming(body: any) {
  const changes = (body?.entry ?? []).flatMap((e: any) => e?.changes ?? []);
  for (const ch of changes) {
    const v = ch?.value;
    if (!v?.messages) continue;
    const names: Record<string, string> = {};
    for (const c of v.contacts ?? []) if (c?.wa_id) names[c.wa_id] = c?.profile?.name;
    for (const m of v.messages) {
      try {
        await handleMessage(m, names[m.from]);
      } catch (e) {
        console.error("handler error", e instanceof Error ? e.message : "unknown");
      }
    }
  }
}

async function handleMessage(m: any, profileName?: string) {
  const phone: string = m.from;
  const list = allowed();
  if (list.length && !list.includes(phone)) return;
  if (!(await claimMessage(m.id))) return;
  void markRead(m.id);

  const now = new Date();
  const { user, isNew } = await ensureUserInbound(phone, profileName?.trim(), now);
  const lang: Lang = user.lang ?? "ro";
  const T = L[lang];

  try {
    if (m.type === "audio" && m.audio?.id) {
      await handleVoice(user, String(m.audio.id), isNew, now);
      return;
    }
    if (m.type === "interactive") {
      const id = m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id;
      if (id?.startsWith("lang:")) {
        const picked = id.slice(5) as Lang;
        if (picked === "en" || picked === "ro" || picked === "ur") {
          await updateUser(user.id, { lang: picked });
          user.lang = picked;
          await sendWelcome(user, picked);
        }
        return;
      }
      if (id?.startsWith("cmd:")) {
        await processText(user, user.lang ?? "ro", id.slice(4), false, now);
        return;
      }
    }
    if (m.type !== "text" || !m.text?.body) {
      await sendText(phone, (user.lang ? T : L.ro).unsupported);
      return;
    }
    await processText(user, user.lang ?? lang, String(m.text.body).slice(0, 600), isNew, now);
  } catch (e) {
    console.error("process error", e instanceof Error ? e.message : "unknown");
    await sendText(phone, T.error);
  }
}

const isConfirm = (s: string) => /^(confirm|confirm delete|yes delete|yes|haan|han|ha|delete|ہاں|جی ہاں)$/.test(s);
const isCancel = (s: string) => /^(cancel|no|nahi|nahin|نہیں)$/.test(s);

function needsLanguage(user: User) {
  return user.lang == null;
}

async function sendLanguagePicker(user: User) {
  await sendButtonMessage(user.phone, langPickerIntro(user.name), [...LANG_BUTTONS]);
}

async function sendWelcome(user: User, lang: Lang) {
  const T = L[lang];
  await sendText(user.phone, T.welcome(user.name));
  // Report menu on demand (*report* / *help*) — saves a second WhatsApp API call on hi.
}

async function sendReportMenu(user: User, lang: Lang) {
  const T = L[lang];
  await sendReportList(user.phone, T.reportListBody, T.reportListBtn, T.reportListRows);
}

async function beginOnboarding(user: User) {
  if (needsLanguage(user)) await sendLanguagePicker(user);
  else await sendWelcome(user, user.lang!);
}

async function handleVoice(user: User, mediaId: string, isNew: boolean, now: Date) {
  const T = L[user.lang ?? "en"];
  if (!voiceEnabled()) {
    await sendText(user.phone, T.voiceOff);
    return;
  }
  const media = await downloadMedia(mediaId);
  const transcript = media ? await transcribeAudio(media.data, media.mime) : null;
  if (!transcript) {
    await sendText(user.phone, T.voiceFail);
    return;
  }
  if (!user.lang) {
    user.lang = detectLang(transcript);
    await updateUser(user.id, { lang: user.lang });
  }
  await sendText(user.phone, `🎙️ ${transcript}`); // show what was heard so mistakes are visible
  await processText(user, user.lang, transcript, isNew, now, true);
}

async function processText(user: User, lang: Lang, text: string, isNew: boolean, now: Date, viaVoice = false) {
  let activeLang = lang;
  if (user.lang) activeLang = user.lang;
  else if (!viaVoice) {
    const guessed = detectLang(text);
    if (guessed) {
      // Only auto-set when they're logging something, not on hi/help
      const probe = parseMessage(text, { now, tz: user.timezone, rules: [] });
      if (probe.kind === "entries") {
        await updateUser(user.id, { lang: guessed });
        user.lang = guessed;
        activeLang = guessed;
      }
    }
  }
  const T = L[activeLang];
  const phone = user.phone;
  const n = normalize(text);

  if (user.pending_action === "delete") {
    const fresh = user.pending_at && now.getTime() - new Date(user.pending_at).getTime() < 10 * 60 * 1000;
    if (fresh && isConfirm(n) && !viaVoice) { // deleting everything must be typed, never spoken
      await deleteUser(user.id);
      await sendText(phone, T.deleteDone);
      return;
    }
    await updateUser(user.id, { pending_action: null, pending_at: null });
    if (isCancel(n)) {
      await sendText(phone, T.deleteCancelled);
      return;
    }
  }

  const rules = await listRules(user.id);
  let parsed = parseMessage(text, { now, tz: user.timezone, rules });

  if (needsLanguage(user) && (parsed.kind === "greeting" || (parsed.kind === "unknown" && isNew))) {
    await beginOnboarding(user);
    return;
  }
  if (needsLanguage(user) && parsed.kind === "command" && parsed.command.cmd === "help") {
    await sendLanguagePicker(user);
    return;
  }

  if (parsed.kind === "unknown" && (/\d/.test(text) || /(hazar|hazaar|sau|lakh|ہزار|سو|لاکھ)/i.test(text))) {
    const viaLlm = await llmParse(text);
    if (viaLlm) parsed = { kind: "entries", entries: viaLlm };
  }

  switch (parsed.kind) {
    case "greeting":
      await beginOnboarding(user);
      return;
    case "thanks":
      await sendText(phone, "👍");
      return;
    case "unknown":
      if (isNew && needsLanguage(user)) await sendLanguagePicker(user);
      else await sendText(phone, T.unknown);
      return;
    case "entries":
      if (needsLanguage(user) && user.lang) {
        /* lang set above from entry */
      } else if (needsLanguage(user)) {
        await sendLanguagePicker(user);
        return;
      }
      await saveEntries(user, activeLang, parsed.entries, now);
      return;
    case "command":
      if (needsLanguage(user) && parsed.command.cmd !== "language") {
        await sendLanguagePicker(user);
        return;
      }
      await runCommand(user, activeLang, parsed.command, now);
      return;
  }
}

function line(e: { type: string; amount: number; category: string | null; note: string | null; account?: string | null }): string {
  const note = e.note || e.category || "";
  const acc = e.account ? ` · ${e.account}` : "";
  if (e.type === "income") return `💰 ${note} — +${money(e.amount)} (${e.category})${acc}`;
  if (e.type === "saving") return `🏦 ${note} — ${money(e.amount)} (${e.category})${acc}`;
  return `✅ ${note} — ${money(e.amount)} (${e.category})${acc}`;
}

async function saveEntries(user: User, lang: Lang, entries: ParsedEntry[], now: Date) {
  const T = L[lang];
  const tz = user.timezone;
  const capped = entries.slice(0, MAX_ENTRIES);
  const goals = await listGoals(user.id);

  const rows = capped.map((e) => {
    const g = e.type === "saving"
      ? goals.find((x) => e.note.toLowerCase().includes(x.name.toLowerCase()))
      : undefined;
    return {
      user_id: user.id, type: e.type, amount: e.amount, category: e.category, note: e.note,
      goal_id: g?.id ?? null, account: e.account, occurred_at: occurredAt(e.date, now, tz).toISOString(), deleted_at: null,
    };
  });
  await insertTx(rows as any);

  const month = periodRange("month", now, tz);
  const today = periodRange("today", now, tz);
  const monthRows = await fetchTx(user.id, month.from, month.to);
  const agg = aggregate(monthRows, tz);
  const todayExp = monthRows
    .filter((r) => r.type === "expense" && new Date(r.occurred_at) >= today.from && new Date(r.occurred_at) < today.to)
    .reduce((s, r) => s + r.amount, 0);

  const out: string[] = capped.map((e, i) => {
    const l = line({ type: e.type, amount: e.amount, category: e.category, note: e.note, account: e.account });
    const bd = e.date && !(ymdOf(now, tz).d === e.date.d && ymdOf(now, tz).m === e.date.m) ? ` · ${dateLabel(e.date)}` : "";
    return l + bd;
  });
  if (capped.length > 1) out.push(`Σ ${money(capped.reduce((s, e) => s + (e.type === "income" ? 0 : e.amount), 0))}`);
  if (capped.some((e) => e.type === "income")) out.push(`${T.leftMonth}: ${money(agg.income - agg.expense - agg.saving)}`);
  else out.push(T.totalsLine(money(todayExp), money(agg.expense)));

  // goal progress
  const savedGoal = rows.find((r) => r.goal_id);
  if (savedGoal) {
    const g = goals.find((x) => x.id === savedGoal.goal_id)!;
    const saved = (await goalSavedMap(user.id))[g.id] ?? 0;
    out.push(`🏦 ${g.name}: ${money(saved)}${g.target ? " / " + money(g.target) + ` (${Math.round((saved / g.target) * 100)}%)` : ""}`);
  } else if (capped.some((e) => e.type === "saving") && !goals.length) {
    out.push(T.goalTip);
  }

  // budget warnings
  const budgets = await listBudgets(user.id);
  for (const cat of new Set(capped.filter((e) => e.type === "expense").map((e) => e.category))) {
    const b = budgets.find((x) => x.category === cat);
    if (!b) continue;
    const spent = agg.byCategory.find((c) => c.category === cat)?.amount ?? 0;
    const p = Math.round((spent / b.monthly_limit) * 100);
    if (p >= 100) out.push(T.budgetOver(cat));
    else if (p >= 80) out.push(T.budgetWarn(cat, p));
  }
  if (entries.length > MAX_ENTRIES) out.push(T.tooMany(MAX_ENTRIES));
  await sendText(user.phone, out.join("\n"));
}

async function sendSummary(user: User, lang: Lang, period: any, now: Date) {
  const s = await buildSummary(user, lang, period, now);
  await sendText(user.phone, s.text);
  for (const url of s.charts) await sendImage(user.phone, url);
}

async function runCommand(user: User, lang: Lang, c: Command, now: Date) {
  const T = L[lang];
  const phone = user.phone;
  switch (c.cmd) {
    case "help":
      await sendText(phone, T.help(user.name));
      await sendReportMenu(user, lang);
      return;
    case "report_menu":
      await sendReportMenu(user, lang);
      return;
    case "lang_menu":
      await sendLanguagePicker(user);
      return;
    case "summary": return sendSummary(user, lang, c.period, now);
    case "language":
      await updateUser(user.id, { lang: c.lang });
      await sendText(phone, L[c.lang].langSet);
      await sendWelcome(user, c.lang);
      return;
    case "balance": {
      const r = periodRange("month", now, user.timezone);
      const agg = aggregate(await fetchTx(user.id, r.from, r.to), user.timezone);
      return void (await sendText(phone,
        `🧮 ${T.periods.month}\n💰 ${T.income}: ${money(agg.income)}\n💸 ${T.expenses}: ${money(agg.expense)}\n🏦 ${T.saved}: ${money(agg.saving)}\n*${T.left}: ${money(agg.income - agg.expense - agg.saving)}*`));
    }
    case "undo": {
      const [last] = await lastTx(user.id, 1);
      if (!last) return void (await sendText(phone, T.nothingToUndo));
      await softDelete(last.id);
      return void (await sendText(phone, T.undone(line(last))));
    }
    case "last": {
      const rows = await lastTx(user.id, c.n);
      if (!rows.length) return void (await sendText(phone, T.noData));
      const out = rows.map((r: Tx) => `${line(r)} · ${dateLabel(ymdOf(new Date(r.occurred_at), user.timezone))}`);
      return void (await sendText(phone, `${T.lastHeader}\n${out.join("\n")}`));
    }
    case "edit": {
      const [last] = await lastTx(user.id, 1);
      if (!last) return void (await sendText(phone, T.nothingToUndo));
      await updateTxAmount(last.id, c.amount);
      return void (await sendText(phone, T.edited(line({ ...last, amount: c.amount }))));
    }
    case "budget": {
      if (c.action === "set") {
        await setBudget(user.id, c.category, c.amount);
        return void (await sendText(phone, T.budgetSet(c.category, money(c.amount))));
      }
      if (c.action === "remove") {
        const ok = await removeBudget(user.id, c.category);
        return void (await sendText(phone, ok ? T.budgetRemoved(c.category) : T.budgetMissing(c.category)));
      }
      const budgets = await listBudgets(user.id);
      if (!budgets.length) return void (await sendText(phone, T.budgetNone));
      const r = periodRange("month", now, user.timezone);
      const agg = aggregate(await fetchTx(user.id, r.from, r.to), user.timezone);
      return void (await sendText(phone, `${T.budgetHeader}\n${budgetLines(lang, budgets, agg).join("\n")}`));
    }
    case "goals": {
      if (c.action === "create") {
        await upsertGoal(user.id, c.name.toLowerCase(), c.target);
        return void (await sendText(phone, T.goalCreated(c.name, money(c.target))));
      }
      if (c.action === "remove") {
        const ok = await deleteGoal(user.id, c.name.toLowerCase());
        return void (await sendText(phone, ok ? T.goalRemoved(c.name) : T.goalMissing(c.name)));
      }
      const goals = await listGoals(user.id);
      if (!goals.length) return void (await sendText(phone, T.goalNone));
      const saved = await goalSavedMap(user.id);
      const out = goals.map((g) => {
        const s = saved[g.id] ?? 0;
        return `• ${g.name}: ${money(s)}${g.target ? " / " + money(g.target) + ` (${Math.round((s / g.target) * 100)}%)` : ""}`;
      });
      return void (await sendText(phone, `${T.goalHeader}\n${out.join("\n")}`));
    }
    case "category": {
      await addRule(user.id, c.keyword, c.category);
      return void (await sendText(phone, T.ruleLearned(c.keyword, c.category)));
    }
    case "export": {
      const url = exportUrl(user.id, c.period);
      const name = `expenses-${c.period}.csv`;
      const ok = process.env.APP_URL ? await sendDocument(phone, url, name, T.exportCaption) : false;
      if (!ok) await sendText(phone, T.exportEmpty);
      return;
    }
    case "report_toggle": {
      await updateUser(user.id, { daily_report: c.on });
      return void (await sendText(phone, c.on ? T.reportOn : T.reportOff));
    }
    case "delete_data": {
      await updateUser(user.id, { pending_action: "delete", pending_at: new Date().toISOString() });
      return void (await sendText(phone, T.deleteAsk));
    }
  }
}
