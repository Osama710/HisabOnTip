/** Canonical payment labels shown in help text and parsed from messages. */
export const PAYMENT_LABELS = [
  "Cash",
  "Meezan",
  "HBL",
  "UBL",
  "MCB",
  "NBP",
  "Bank Al Habib",
  "Habib Metro",
  "Alfalah",
  "Faysal",
  "Askari",
  "Allied",
  "BankIslami",
  "BOP",
  "Soneri",
  "JS Bank",
  "Dubai Islamic",
  "Silk Bank",
  "Summit",
  "Samba",
  "FWBL",
  "Khushhali",
  "Standard Chartered",
  "Easypaisa",
  "JazzCash",
  "SadaPay",
  "NayaPay",
  "Upaisa",
  "Card",
] as const;

export function paymentLabelsLine(): string {
  return PAYMENT_LABELS.join(", ");
}

/** Short welcome hint — full list lives in *help*. */
export function paymentWelcomeHint(): string {
  return (
    "• cash, meezan, hbl, easypaisa, jazzcash\n" +
    "• Full bank/wallet list → type *help*"
  );
}

/** Grouped list for help text (readable on WhatsApp). */
export function paymentHelpBlocks(): string {
  return [
    "*Cash & cards* — cash, card",
    "*Banks* — Meezan, HBL, UBL, MCB, NBP, Alfalah, Faysal, Askari, Allied, Bank Al Habib, Habib Metro, BankIslami, BOP, Soneri, JS, Dubai Islamic, Silk, Summit, Samba, FWBL, Khushhali, SCB",
    "*Wallets* — Easypaisa, JazzCash, SadaPay, NayaPay, Upaisa",
  ].join("\n");
}