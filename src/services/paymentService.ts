// MOCK ONLY. Replace with a real provider's hosted/tokenized checkout (Stripe,
// Razorpay, etc.) before enabling billing. Never send raw card details to this module.
export type Plan = "Pro" | "Team";
export type Billing = "monthly" | "yearly";
export const PRICES = { Pro: { monthly: 9, yearly: 90 }, Team: { monthly: 29, yearly: 290 } };
export interface DemoCard {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}
export function validateDemoCard(card: DemoCard, now = new Date()): string | null {
  const digits = card.number.replace(/[ -]/g, "");
  if (!/^\d{13,19}$/.test(digits)) return "Enter a valid card number.";
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  if (sum % 10 !== 0 || /^0+$/.test(digits)) return "Card number failed validation.";
  const match = /^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/.exec(card.expiry);
  if (!match || new Date(2000 + Number(match[2]), Number(match[1]), 1) <= now)
    return "Enter a future expiry date as MM/YY.";
  if (!/^\d{3,4}$/.test(card.cvc)) return "CVC must contain 3 or 4 digits.";
  if (!card.name.trim()) return "Name on card is required.";
  return null;
}
export function processDemoPayment(
  plan: Plan,
  billing: Billing,
  signal: AbortSignal,
): Promise<{ orderId: string }> {
  if (!PRICES[plan]?.[billing]) return Promise.reject(new Error("Unknown demo plan."));
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new Error("Demo payment cancelled."));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve({ orderId: `DEMO-${crypto.randomUUID()}` });
    }, 2000);
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}
