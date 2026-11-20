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