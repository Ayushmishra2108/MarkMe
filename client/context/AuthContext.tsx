import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "@/services/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export type UserRole = "guest" | "admin" | "leader" | "member";
export interface AuthUser {
  uid: string;
  email: string | null;
  uniqueId?: string | null;
  teamName?: string | null;
  position?: string | null;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (uniqueId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const idToEmail = (id: string) => `${id}@attendance.local`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      let claimsRole: UserRole | undefined;
      try {
        const token = await getIdTokenResult(firebaseUser, true);
        claimsRole = (token.claims as any)?.role as UserRole | undefined;
      } catch {}

      let profile: any = null;
      try {
        profile = await fetchProfile(firebaseUser.uid);
      } catch {
        profile = null;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        uniqueId: profile?.uniqueId ?? null,
        teamName: profile?.teamName ?? null,
        position: profile?.position ?? null,
        role: (claimsRole || (profile?.role as UserRole) || "member") as UserRole,
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function fetchProfile(uid: string) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as any) : null;
  }

  async function refreshProfile() {
    if (!user) return;
    const profile = await fetchProfile(user.uid);
    if (profile) setUser((u) => (u ? { ...u, uniqueId: profile.uniqueId ?? null, teamName: profile.teamName ?? null, position: profile.position ?? null, role: (profile.role as UserRole) || "member" } : u));
  }

  async function signIn(identifier: string, password: string) {
    const input = identifier.trim();
    const email = input.includes("@") ? input : idToEmail(input);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await fbSignOut(auth);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refreshProfile }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
