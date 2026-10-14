import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import {
  PRICES,
  processDemoPayment,
  validateDemoCard,
  type Billing,
  type Plan,
} from "@/services/paymentService";
export const Route = createFileRoute("/pricing")({
  component: Pricing,
  head: () => ({ meta: [{ title: "Demo pricing — PDFBuddy" }] }),
});
function Pricing() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [billing, setBilling] = useState<Billing>("monthly");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <p role="status" className="rounded-xl border border-primary bg-primary/10 p-4">
          Demo mode: no real payments are processed.
        </p>
        <h1 className="mt-8 font-display text-4xl font-semibold">Plans and demo checkout</h1>
        <p className="mt-4 text-muted-foreground">
          All existing PDF tools are free. Paid plans below illustrate a future checkout; they do
          not unlock any features.
        </p>
        {order ? (
          <div className="glass mt-8 rounded-2xl p-6" role="status">
            <h2 className="text-2xl font-semibold">Demo payment successful</h2>
            <p className="mt-4 break-all">Fake order ID: {order}</p>
            <p className="mt-2">No charge was made. No subscription was created.</p>
            <Button
              className="mt-4"
              onClick={() => {
                setOrder("");
                setPlan(null);
              }}
            >
              Back to plans
            </Button>
          </div>
        ) : plan ? (
          <div className="glass mx-auto mt-8 max-w-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold">{plan} demo checkout</h2>
            <p className="mt-2">
              ${PRICES[plan][billing]} / {billing === "monthly" ? "month" : "year"} · USD
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Use test number 4242 4242 4242 4242, a future MM/YY date and any three-digit CVC. Do
              not enter a real card.
            </p>
            <form
              className="mt-6 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                const validation = validateDemoCard({
                  number: String(data.get("number")),
                  expiry: String(data.get("expiry")),
                  cvc: String(data.get("cvc")),
                  name: String(data.get("name")),
                });
                setError(validation ?? "");
                if (validation) return;
                form.reset();
                setBusy(true);
                const abort = new AbortController();
                controller.current = abort;
                try {
                  const result = await processDemoPayment(plan, billing, abort.signal);
                  setOrder(result.orderId);
                } catch {
                  if (!abort.signal.aborted) setError("Demo checkout failed. Try again.");
                } finally {
                  if (!abort.signal.aborted) setBusy(false);
                }
              }}
            >
              <fieldset disabled={busy} className="space-y-4">
                {[
                  { name: "number", label: "Card number", max: 23 },
                  { name: "expiry", label: "Expiry (MM/YY)", max: 7 },
                  { name: "cvc", label: "CVC", max: 4 },
                  { name: "name", label: "Name on card", max: 100 },
                ].map((field) => (
                  <label key={field.name} className="block">
                    {field.label}
                    <input
                      required
                      name={field.name}
                      type={field.name === "cvc" ? "password" : "text"}
                      inputMode={
                        field.name === "number" || field.name === "cvc" ? "numeric" : "text"
                      }
                      autoComplete="off"
                      maxLength={field.max}
                      className="mt-1 block w-full rounded-md border border-border bg-background p-3"
                    />
                  </label>
                ))}
              </fieldset>
              {error && <p role="alert">{error}</p>}
              <Button type="submit" disabled={busy}>
                {busy ? "Processing demo…" : "Pay (demo)"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setPlan(null);
                  setError("");
                }}
              >
                Back
              </Button>
            </form>
          </div>
        ) : (
          <>
            <fieldset className="mt-8 flex gap-6">
              <legend className="mb-2 text-sm">Billing period</legend>
              {(["monthly", "yearly"] as const).map((value) => (
                <label key={value} className="capitalize">
                  <input
                    type="radio"
                    name="billing"
                    value={value}
                    checked={billing === value}
                    onChange={() => setBilling(value)}
                    className="mr-2"
                  />
                  {value}
                </label>
              ))}
            </fieldset>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {(["Free", "Pro", "Team"] as const).map((name) => (
                <article key={name} className="glass rounded-2xl p-6">
                  <h2 className="text-2xl font-semibold">{name}</h2>
                  <p className="mt-4 text-4xl font-semibold">
                    ${name === "Free" ? 0 : PRICES[name][billing]}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {name === "Free" ? "Free forever" : `${billing} demo price · USD`}
                  </p>
                  <ul className="my-6 list-disc space-y-2 pl-5">
                    {(name === "Free"
                      ? [
                          "All current browser PDF tools",
                          "Local file processing",
                          "No account required",
                        ]
                      : name === "Pro"
                        ? [
                            "Free tools remain available",
                            "Demo personal plan summary",
                            "Mock checkout only",
                          ]
                        : [
                            "Free tools remain available",
                            "Demo team plan summary",
                            "Mock checkout only",
                          ]
                    ).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  {name === "Free" ? (
                    <Button asChild>
                      <Link to="/tools/$slug" params={{ slug: "merge" }}>
                        Start free
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      disabled={!ready}
                      onClick={() => {
                        setPlan(name);
                        setError("");
                      }}
                    >
                      Try {name} demo
                    </Button>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </Shell>
  );
}
