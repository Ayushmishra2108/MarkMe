import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function UserUpdate({ disabled }: { disabled: boolean }) {
  const [uid, setUid] = useState("");
  const [form, setForm] = useState({ name: "", className: "", rollNo: "", teamName: "", position: "member", uniqueId: "", email: "", year: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchUser(uid: string) {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${uid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setForm({
        name: data.name || "",
        className: data.className || "",
        rollNo: data.rollNo || "",
        teamName: data.teamName || "",
        position: data.position || "member",
        uniqueId: data.uniqueId || "",
        email: data.email || "",
        year: data.year || "",
      });
    } catch (err: any) {
      setMsg(err?.message || "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("Member updated successfully");
    } catch (err: any) {
      setMsg(err?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="text-sm font-medium">User UID</label>
        <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={uid} onChange={(e) => setUid(e.target.value)} onBlur={() => fetchUser(uid)} required />
      </div>
      <div className="col-span-2">
        <label className="text-sm font-medium">Full Name</label>
        <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <label className="text-sm font-medium">Class</label>
        <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">Roll No.</label>
        <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div>
        <label className="text-sm font-medium">Year</label>
        <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
      </div>
      <div>
        <label className="text-sm font-medium">Team Name</label>
        <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">Position</label>
        <select className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
          <option value="admin">Admin</option>
          <option value="executive">Executive</option>
          <option value="lead">Lead</option>
          <option value="colead">CO-Lead</option>
          <option value="member">Member</option>
          <option value="techexecutive">Tech-Executive</option>
          <option value="techlead">Tech-Lead</option>
          <option value="techcolead">Tech-colead</option>
          <option value="techmember">Tech-member</option>
          <option value="cmo">Cheif Marketing officer</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="text-sm font-medium">Custom Unique ID (optional)</label>
        <input className="mt-1 w-full rounded-xl border bg-background/80 px-4 py-2.5" placeholder="PA-ABC123" value={form.uniqueId} onChange={(e) => setForm({ ...form, uniqueId: e.target.value })} />
      </div>
      {msg && <p className="col-span-2 text-sm text-destructive">{msg}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={disabled || loading} className="rounded-xl">Update Member</Button>
      </div>
    </form>
  );
}
