import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSupportRequest, submitSupportRequest } from "../../src/services/supportService.ts";
import { validateDemoCard, processDemoPayment } from "../../src/services/paymentService.ts";
test("support validates fields without delivery", async () => {
  const request = {
    name: "User",
    email: "user@example.com",
    subject: "Help",
    message: "Please help with this document.",
  };
  assert.equal(validateSupportRequest(request), null);
  assert.match(validateSupportRequest({ ...request, email: "bad" })!, /email/);
  await assert.rejects(submitSupportRequest({ ...request, message: "short" }), /20/);
  await submitSupportRequest(request);
});
test("demo card validation rejects invalid and expired details", () => {
  const card = { number: "4242 4242 4242 4242", expiry: "12/99", cvc: "123", name: "Demo" };
  assert.equal(validateDemoCard(card), null);
  assert.match(validateDemoCard({ ...card, number: "4242424242424241" })!, /validation/);
  assert.match(validateDemoCard({ ...card, expiry: "01/20" })!, /future/);
  assert.match(validateDemoCard({ ...card, cvc: "ab3" })!, /CVC/);
});
test("mock payment can be cancelled without completing an order", async () => {
  const abort = new AbortController();
  const payment = processDemoPayment("Pro", "monthly", abort.signal);
  abort.abort();
  await assert.rejects(payment, /cancelled/);
});
