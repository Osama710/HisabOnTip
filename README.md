# WhatsApp Expense Tracker

Text a WhatsApp number like `chai paratha 110` and it logs the expense. English, Urdu script and Roman Urdu all work.
Stack: Next.js (App Router) on Vercel + Supabase + Meta WhatsApp Cloud API + QuickChart. All free for personal use.

## What it does

- Log expenses, income and savings from plain text: `petrol 2k`, `salary 150000`, `kal biryani 450`, `چائے 50 اور رکشہ 200`
- Understands `5k`, `1.5k`, `2 lakh`, `dhai hazar`, `paanch sau`, `ek lakh pachas hazar`, Urdu number words, Urdu digits, `rs 500/-`, `500rs`
- Several entries in one message (`chai 40 aur rickshaw 200`, or one per line)
- Dates: `kal`, `parso`, `5 din pehle`, `12 nov`, `12/11`, `monday`
- `ali ne diye 5000` = income, `ali ko diye 5000` = expense
- Typos: `pertol`, `ptrol`, `grocry` still land in the right category
- Commands: `today`, `week`, `month`, `last month`, `balance`, `undo`, `edit 120`, `last 5`, `budget food 20000`, `goal laptop 100000`, `save 5000 laptop`, `category chai food`, `export`, `urdu / roman / english`, `report off`, `delete my data`
- **Voice notes** in English, Urdu or a mix: the bot transcribes, shows `🎙️ what it heard`, then logs it like typed text
- **Optional payment tag** at the end of any message: `petrol 2000 meezan`, `chai 50 cash`, `lunch 450 easypaisa`. Reports then show spending by account. Leave it out and nothing changes
- Charts (pie by category, bar by day), daily/weekly/monthly reports, budget warnings, savings goals, CSV export
- Replies in English, Roman Urdu or Urdu (auto-detected from the first message, change anytime)

## Setup checklist (about 30-45 minutes)

### 1. Supabase
1. Create a project at supabase.com (free).
2. SQL Editor > paste all of `supabase/schema.sql` > Run.
3. Project Settings > API: copy the **Project URL** and the **service_role** key.

### 2. Meta WhatsApp Cloud API
1. developers.facebook.com > Create App > type **Business** > add the **WhatsApp** product.
2. WhatsApp > API Setup: note the **Phone number ID**. Add your own number under "To" and verify it.
3. App settings > Basic: copy the **App secret** (`META_APP_SECRET`).
4. Permanent token: business.facebook.com > Business settings > Users > System users > add one > assign your app > Generate token with `whatsapp_business_messaging` and `whatsapp_business_management`. This is `WHATSAPP_TOKEN`. (The temporary token expires in 24h.)

### 3. GitHub + Vercel
1. Push this folder to a new GitHub repo.
2. vercel.com > Add New Project > import the repo.
3. Add every variable from `.env.example` (Settings > Environment Variables). Pick any random strings for `WHATSAPP_VERIFY_TOKEN`, `CRON_SECRET`, `EXPORT_SECRET`. Set `APP_URL` to your Vercel URL.
4. Deploy.

### 4. Connect the webhook
1. Meta dashboard > WhatsApp > Configuration > Webhook > Edit.
2. Callback URL: `https://YOUR-APP.vercel.app/api/webhook`
3. Verify token: the same `WHATSAPP_VERIFY_TOKEN` you set on Vercel. Click Verify and save.
4. Under Webhook fields, **subscribe to `messages`**.

### 5. Test
Send `hi` to the test number from your phone. You should get the welcome message, then try `chai paratha 110` and `today`.

## Voice notes

1. Get a free API key at aistudio.google.com and set `GEMINI_API_KEY` on Vercel (redeploy after).
2. Record a voice note to the bot: "chai paratha ek sau dus" or "petrol 2000 meezan".
3. The bot replies with what it heard first, so a mishearing is visible. Use `undo` if it got it wrong.

- Voice notes are capped at about 2 MB (roughly a couple of minutes). Keep them short.
- **Privacy:** the audio is sent to Google for transcription. Free-tier API inputs may be used to improve Google's products, so for a public launch use a paid tier (or a provider with no-training terms) and say so in your privacy policy.
- Deleting data (`delete my data`) can only be confirmed by typing, never by voice.

## Payment tags

Accounts understood: cash, Meezan, HBL, UBL, MCB, Allied, Alfalah, Faysal, Askari, Standard Chartered, BOP, BankIslami, SadaPay, NayaPay, Easypaisa, JazzCash, card / debit card / credit card, bank. If one account is named in a message it applies to every entry in that message. `credit card bill 20000` is treated as a loan payment, not as "paid with credit card".

Already ran an older `schema.sql`? Run this once in the Supabase SQL editor:
```sql
alter table transactions add column if not exists account text;
```

## Troubleshooting

| Problem | Check |
|---|---|
| Webhook won't verify | Verify token must match exactly; redeploy after changing env vars |
| No reply at all | Vercel > Logs for `/api/webhook`; confirm `messages` is subscribed; confirm your number is in the allowed recipients list |
| 401 in logs | `META_APP_SECRET` wrong. It must be the App secret, not the token |
| "whatsapp send failed 401/190" | Token expired. Use the System User permanent token |
| Replies work but nothing saves | `SUPABASE_SERVICE_ROLE_KEY` wrong, or schema.sql not run |
| No charts | QuickChart unreachable or rate limited; text summaries still work |
| Voice note gets "aren't switched on" | `GEMINI_API_KEY` missing on Vercel, or you did not redeploy |
| Voice note "couldn't understand" | Check Vercel logs for `transcribe failed`; wrong model name in `GEMINI_MODEL`, or quota hit |
| Daily report never arrives | Reports only go to users who messaged in the last 23 hours (WhatsApp 24-hour rule) |

## Notes

- **Test number limits:** only a few allowed recipients until you add a real number and complete business setup in Meta.
- **Scheduled reports** use free-form messages, so they only reach people who wrote in the last 23 hours. Outside that window WhatsApp needs a pre-approved template (paid). Not built here.
- **Cron time:** `vercel.json` runs at 17:00 UTC = 22:00 Karachi. Hobby cron timing is accurate only to within the hour.
- **ALLOWED_PHONES:** set it while testing so only your number can use the bot.
- **Vercel Hobby is non-commercial.** Move hosting if you start charging.
- **Gemini key:** also lets a free Gemini model handle typed messages the rules cannot parse. Only message text is sent, never phone numbers. Free tiers can use inputs for training.
- Do not log message contents in production. The code logs errors only.
- Add your contact email to `src/app/privacy/page.tsx` before going public (Meta requires a privacy policy URL).

## Development

```bash
npm install
npm test          # parser + full chat-flow tests (no network needed)
npm run typecheck
npm run dev
```
Use a tunnel (ngrok or Cloudflare Tunnel) to point Meta at `localhost` while developing.

## Project layout

```
src/app/api/webhook/route.ts     Meta verify (GET) + incoming messages (POST, signature checked)
src/app/api/cron/daily/route.ts  daily / Sunday weekly / 1st-of-month reports
src/app/api/export/route.ts      signed CSV download link
src/lib/parser/                  numbers, dates, categories, commands (the brain)
src/lib/handle.ts                message orchestrator
src/lib/reports.ts               aggregation, summary text, QuickChart charts
src/lib/i18n.ts                  English / Roman Urdu / Urdu replies
src/lib/db.ts                    Supabase access
supabase/schema.sql              database schema
tests/                           parser and end-to-end tests
```
