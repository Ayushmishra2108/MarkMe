import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SeedAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function seed(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name }) });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Failed"); else setMsg("Seeded admin. You can now log in.");
  }

  return (
    <div className="mx-auto max-w-md card-glass p-6">
      <h2 className="text-xl font-semibold">Seed First Admin</h2>
      <p className="text-sm text-muted-foreground">Run once to create the initial admin.</p>
      <form onSubmit={seed} className="mt-4 space-y-3">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input type="password" className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {msg && <p className="text-sm text-foreground/70">{msg}</p>}
        <Button type="submit" className="rounded-xl">Seed Admin</Button>
      </form>
    </div>
  );
}
