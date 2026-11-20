export const voiceEnabled = () => !!process.env.GEMINI_API_KEY;

const PROMPT =
  "This is a short voice note from a Pakistani user who is logging money (an expense, income or savings) or asking for a report. " +
  "The speech may be Urdu, English, or a mix. Transcribe it into ONE line of text using Latin letters: Roman Urdu for Urdu speech, " +
  "normal English for English speech. Write every amount as digits (for example 'do hazar paanch sau' -> 2500, 'dhai hazar' -> 2500, " +
  "'five hundred' -> 500, 'paanch k' -> 5k). Keep item words as spoken (chai, paratha, petrol, bijli ka bill, grocery). " +
  "Do not add commentary, quotes or labels. If nothing intelligible was said, output exactly: EMPTY";

/** Speech to text for WhatsApp voice notes (Urdu / English / mixed) using Gemini. Returns null on failure. */
export async function transcribeAudio(data: Buffer, mime: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: mime, data: data.toString("base64") } }, { text: PROMPT }] }],
        generationConfig: { temperature: 0 },
      }),
    });
    if (!r.ok) {
      console.error("transcribe failed", r.status);
      return null;
    }
    const j: any = await r.json();
    const raw: string = j?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join(" ") ?? "";
    const text = raw.replace(/```/g, "").replace(/\s+/g, " ").trim().replace(/^["'“”]+|["'“”]+$/g, "");
    if (!text || /^empty\.?$/i.test(text)) return null;
    return text.slice(0, 500);
  } catch (e) {
    console.error("transcribe error", e instanceof Error ? e.message : "unknown");
    return null;
  }
}
