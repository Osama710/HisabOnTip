import { z } from "zod";
import type { ParsedEntry } from "./parser";
import { resolveCategory } from "./parser";

const Schema = z.object({
  entries: z.array(
    z.object({
      type: z.enum(["expense", "income", "saving"]),
      amount: z.number().positive().max(1e9),
      category: z.string().max(30).optional(),
      note: z.string().max(80).optional(),
    })
  ).max(10),
});

/** Optional fallback for messages the rules could not understand. Sends only the message text. */
export async function llmParse(text: string): Promise<ParsedEntry[] | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt =
    "Extract money entries from a short message by a Pakistani user. The message may be English, Urdu script, Roman Urdu, " +
    "or broken/abbreviated text. Amounts are in PKR. 'k' = thousand, lakh = 100000, hazar = 1000, sau = 100. " +
    'Return ONLY JSON: {"entries":[{"type":"expense|income|saving","amount":number,"category":string,"note":string}]}. ' +
    "Categories: Food, Groceries, Transport, Vehicle, Bills, Rent, Health, Education, Kids, Shopping, Entertainment, Fitness, " +
    "Personal care, Home, Charity, Gifts & events, Loans, Travel, Other (income: Salary, Freelance, Business, Rental, Gift, Refund, Bonus, Other). " +
    'If there is no money amount return {"entries":[]}. Message: ' + JSON.stringify(text.slice(0, 400));
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      }
    );
    if (!r.ok) return null;
    const j: any = await r.json();
    const raw: string = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = Schema.safeParse(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    if (!parsed.success || !parsed.data.entries.length) return null;
    return parsed.data.entries.map((e) => ({
      type: e.type,
      amount: e.amount,
      category: e.category ? resolveCategory(e.category) : "Other",
      note: (e.note || e.category || "Entry").slice(0, 80),
      date: null,
      account: null,
    }));
  } catch {
    return null;
  }
}
