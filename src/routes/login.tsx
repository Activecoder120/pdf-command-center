import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — PDFBuddy" }] }),
});

function Login() {
  return (
    <Shell>
      <section className="mx-auto max-w-md px-6 py-20">
        <div className="rounded-3xl glass-strong ring-soft p-8">
          <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your PDFBuddy workspace.</p>

          <div className="mt-6 grid gap-2">
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">Continue with Google</Button>
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">Continue with GitHub</Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" className="mt-1.5 bg-white/[0.03]" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5 bg-white/[0.03]" />
            </div>
            <Button className="w-full bg-gradient-primary border-0 text-white">Sign in</Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account? <Link to="/login" className="text-primary hover:underline">Create one</Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
