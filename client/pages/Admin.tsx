import React from "react";
import { Button } from "@/components/ui/button";
import UserCreate from "../components/UserCreate.tsx";
import UserUpdate from "../components/UserUpdate";
import { FileDown } from "lucide-react";

export default function Admin() { 
  // TODO: Replace with actual auth logic
  const isAllowed = true;
  const [showEventDialog, setShowEventDialog] = React.useState(false);
  const [eventForm, setEventForm] = React.useState({ title: '', description: '', date: '', startTime: '', endTime: '', venue: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Firestore event creation
      const { title, description, date, startTime, endTime, venue } = eventForm;
      if (!title || !date || !startTime || !endTime) {
        setError('Title, date, start time, and end time are required');
        setLoading(false);
        return;
      }
      const eventData = {
        title,
        description,
        date,
        startTime,
        endTime,
        venue,
        status: 'Active',
        createdAt: Date.now(),
      };
      // @ts-ignore
      const { db } = await import("@/services/firebase");
      // Add to Firestore
      // @ts-ignore
      const { collection, addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "events"), eventData);
      setShowEventDialog(false);
  setEventForm({ title: '', description: '', date: '', startTime: '', endTime: '', venue: '' });
    } catch (err: any) {
      setError(err?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-8">
      <header className="mb-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-lg animate-gradient-x">
          Admin Panel
        </h2>
        <p className="mt-2 text-base md:text-lg text-zinc-600 dark:text-zinc-300 font-medium max-w-xl mx-auto bg-white/60 dark:bg-zinc-900/60 rounded-xl px-4 py-2 shadow-sm">
          Role-based management for <span className="font-semibold text-blue-600 dark:text-cyan-400">users</span> and <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">events</span>.
        </p>
      </header>
      {!isAllowed && (
        <div className="space-y-8">
          <p className="text-foreground/80">You don’t have admin access. Sign in as an admin to manage users.</p>
        </div>
      )}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass p-6">
          <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow animate-gradient-x mb-1">User Manager</h3>
          <p className="text-base text-zinc-600 dark:text-zinc-300 font-medium bg-white/60 dark:bg-zinc-900/60 rounded-lg px-3 py-1 shadow-sm mb-3">
            Add new <span className="font-semibold text-blue-600 dark:text-cyan-400">members</span> and manage <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">roles</span>.
          </p>
          <UserCreate disabled={!isAllowed} />
        </div>
        <div className="card-glass p-6">
          <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow animate-gradient-x mb-1">Event Management</h3>
          <p className="text-base text-zinc-600 dark:text-zinc-300 font-medium bg-white/60 dark:bg-zinc-900/60 rounded-lg px-3 py-1 shadow-sm mb-3">
            Create, edit, and delete <span className="font-semibold text-blue-600 dark:text-cyan-400">events</span>. Set <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">timings</span>, <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">date</span>, <span className="font-semibold text-blue-600 dark:text-cyan-400">venue</span>, and <span className="font-semibold text-blue-600 dark:text-cyan-400">details</span>.
          </p>
          <Button
            className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 text-white font-bold rounded-lg py-2 mt-2 shadow-md hover:scale-105 transition-transform duration-200"
            disabled={!isAllowed}
            onClick={() => setShowEventDialog(true)}
          >
            Create Event
          </Button>
          {showEventDialog && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="eventcard-animated-border card-glass max-w-xl mx-auto p-8 rounded-2xl shadow-xl border-none">
                <h2 className="text-2xl font-extrabold mb-4 text-center bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow animate-gradient-x">Create Event</h2>
                <form onSubmit={handleCreateEvent} className="space-y-3">
                  <input
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all w-full"
                    placeholder="Event Name"
                    required
                    value={eventForm.title}
                    onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                  />
                  <textarea
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-3 min-h-[100px] resize-none focus:ring-2 focus:ring-blue-400 transition-all w-full"
                    placeholder="Description (max 200 words)"
                    required
                    value={eventForm.description}
                    maxLength={1200}
                    onChange={e => {
                      // Limit to 200 words
                      const words = e.target.value.split(/\s+/);
                      if (words.length > 200) return;
                      setEventForm(f => ({ ...f, description: e.target.value }));
                    }}
                  />
                  <input
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all w-full"
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <input
                      className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all w-full"
                      type="time"
                      required
                      value={eventForm.startTime}
                      onChange={e => setEventForm(f => ({ ...f, startTime: e.target.value }))}
                      placeholder="Start Time"
                    />
                    <input
                      className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all w-full"
                      type="time"
                      required
                      value={eventForm.endTime}
                      onChange={e => setEventForm(f => ({ ...f, endTime: e.target.value }))}
                      placeholder="End Time"
                    />
                  </div>
                  <input
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all w-full"
                    placeholder="Venue"
                    required
                    value={eventForm.venue}
                    onChange={e => setEventForm(f => ({ ...f, venue: e.target.value }))}
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 text-white font-bold rounded-lg py-2 mt-2 shadow-md hover:scale-105 transition-transform duration-200"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                  {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
                </form>
                <button
                  className="w-full mt-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold rounded-lg py-2 shadow-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                  onClick={() => setShowEventDialog(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
