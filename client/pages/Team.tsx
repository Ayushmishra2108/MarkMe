import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import UserCreate from "@/components/UserCreate";
import "@/components/eventcard-animated-border.css";

interface TeamDocNormalized { id: string; name: string; members?: string[] }
function getAccess(teamName: string, position: string) {
  if (teamName === "Core team" && ["head", "executive", "Head", "Executive"].includes(position)) {
    return "Admin";
  } else if (["Lead", "lead"].includes(position)) {
    return "Lead";
  } else if (["Co-Lead", "colead", "Co-lead"].includes(position)) {
    return "Co-Lead";
  } else if (["Member", "member"].includes(position)) {
    return "Member";
  }
  return "";
}

interface MemberDoc {
  uid: string;
  displayName: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  className?: string;
  class?: string;
  rollNo?: string;
  roll?: string;
  year?: string;
  position?: string;
  role?: string;
  uniqueId?: string;
}

export default function Team() {
  const { user } = useAuth();
  const isAllowed = user?.role === "leader" || user?.role === "admin";
  const [teams, setTeams] = useState<TeamDocNormalized[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, MemberDoc>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamDocNormalized | null>(null);

  // Close team box when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Only close if a team is open
      if (!selectedTeam) return;
      // If click is inside any team card, do nothing
      const teamCards = document.querySelectorAll('.eventcard-animated-border');
      for (const card of teamCards) {
        if (card.contains(e.target as Node)) return;
      }
      setSelectedTeam(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selectedTeam]);

  const fetchTeamsAndMembers = useCallback(async () => {
    const q = query(collection(db, "teams"));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamDocNormalized));
    setTeams(list);
    const allUids = Array.from(new Set(list.flatMap(t => t.members || [])));
    if (allUids.length > 0) {
      const usersSnap = await getDocs(collection(db, "users"));
      const map: Record<string, MemberDoc> = {};
      usersSnap.forEach(doc => {
        const data = doc.data() as MemberDoc;
        if (allUids.includes(data.uid)) {
          map[data.uid] = data;
        }
      });
      setMembersMap(map);
    } else {
      setMembersMap({});
    }
  }, []);

  useEffect(() => {
    fetchTeamsAndMembers();
    // Expose refresh function globally for QRScan to trigger real-time update
    (window as any).refreshTeams = fetchTeamsAndMembers;
    return () => {
      if ((window as any).refreshTeams === fetchTeamsAndMembers) {
        delete (window as any).refreshTeams;
      }
    };
    // Optionally, you can keep the onSnapshot for real-time updates, but for now, use manual refresh
  }, [fetchTeamsAndMembers]);

  const visibleTeams = user?.role === "admin" ? teams : teams.filter((t) => t.name === user?.teamName);

  return (
    <div className="space-y-6 min-h-screen flex flex-col">
      <header className="mb-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-lg animate-gradient-x">
          Teams
        </h2>
        <p className="mt-2 text-base md:text-lg text-zinc-600 dark:text-zinc-300 font-medium max-w-xl mx-auto bg-white/60 dark:bg-zinc-900/60 rounded-xl px-4 py-2 shadow-sm">
          Manage or view <span className="font-semibold text-blue-600 dark:text-cyan-400">team membership</span> and <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">exports</span>.
        </p>
      </header>

      {!isAllowed && (
        <div className="card-glass p-4 text-sm">
          <p className="text-foreground/80">You don’t have access to team data. Please <Link to="/login" className="underline">sign in</Link> as a leader or admin.</p>
        </div>
      )}
      <section className="card-glass p-10 min-h-[900px] flex flex-col justify-start">
  <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Teams & Members</h3>
          <Button className="rounded-xl" disabled={!isAllowed} onClick={() => {
            if (!isAllowed) return;
            let csv = 'Team,Member Name,Member UID,Email,Phone,Class,Roll No.,Year,Position,Unique ID,Access\n';
            visibleTeams.forEach(team => {
              (team.members || []).forEach(uid => {
                const m = membersMap[uid];
                if (m) {
                  csv += `"${team.name}","${m.displayName || m.name || ''}","${m.uid}","${m.email || ''}","${m.phone || m.phoneNumber || ''}","${m.className || m.class || ''}","${m.rollNo || m.roll || ''}","${m.year || ''}","${m.position || m.role || ''}","${m.uniqueId || ''}","${getAccess(team.name, m.position || m.role || '')}"\n`;
                }
              });
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'teams_members.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}><FileDown className="mr-2"/> Export CSV</Button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          {visibleTeams.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border bg-background/60 p-8 cursor-pointer hover:bg-background/80 flex flex-col justify-start eventcard-animated-border ${selectedTeam?.id === t.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedTeam(t)}
            >
              <h4 className="font-semibold text-lg mb-4">{t.name}</h4>
              {selectedTeam?.id === t.id && (
                <div className="mt-3 space-y-4">
                  {(!t.members || t.members.length === 0) && (
                    <p className="text-base text-muted-foreground">No members assigned to this team.</p>
                  )}
                  {t.members && t.members.length > 0 && Object.keys(membersMap).length === 0 && (
                    <div className="col-span-full text-center text-gray-500">Loading member details...</div>
                  )}
                  {
                    Array.isArray(t.members)
                      ? t.members.map((uid) => {
                          // Defensive: Only allow string UIDs
                          if (typeof uid !== 'string') {
                            return (
                              <span key={String(uid)} className="text-base text-destructive">Malformed member UID</span>
                            );
                          }
                          const m = membersMap[uid];
                          // Defensive: Only render if m is a valid object with string uid
                          if (
                            m &&
                            typeof m === 'object' &&
                            typeof m.uid === 'string'
                          ) {
                            return (
                              <Link
                                key={m.uid}
                                to={`/member/${m.uid}`}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 mb-1 bg-white/70 dark:bg-zinc-900/70 shadow-sm hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-cyan-100/80 dark:hover:from-blue-900/40 dark:hover:to-cyan-900/40 transition-all group"
                                style={{ textDecoration: 'none' }}
                              >
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                                  {((m.name || m.displayName || '').charAt(0) || '?').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-base text-zinc-900 dark:text-white truncate">
                                    {typeof m.name === 'string' && m.name ? m.name : (typeof m.displayName === 'string' && m.displayName ? m.displayName : uid)}
                                  </div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                    {typeof m.position === 'string' ? m.position : typeof m.role === 'string' ? m.role : 'member'}
                                  </div>
                                </div>
                              </Link>
                            );
                          } else {
                            return (
                              <span key={uid} className="text-base text-destructive">Unknown or malformed member ({uid})</span>
                            );
                          }
                        })
                      : <span className="text-base text-destructive">Malformed members list</span>
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
