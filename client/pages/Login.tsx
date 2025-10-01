import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const { signIn, loading } = useAuth();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signIn(id, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  }

  return (
    <div className="mx-auto max-w-md card-glass p-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-8 rounded-xl bg-app-gradient" />
        <h1 className="text-xl font-extrabold">Sign in</h1>
      </div>
  <p className="text-sm text-muted-foreground mb-6">Use your Email ID and password to sign in.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
           <input value={id} onChange={(e) => setId(e.target.value)} className="mt-1 w-full rounded-xl border border-black rounded bg-background/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Enter your Email" />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black rounded bg-background/80 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full rounded-xl">
          <Shield className="mr-2" /> Sign In
        </Button>
      </form>
      <div className="mt-6">
        <input
          type="email"
          placeholder="Enter your email to reset password"
          value={resetEmail}
          onChange={e => setResetEmail(e.target.value)}
          className="input input-bordered w-full max-w-xs"
        />
        <button
          type="button"
          className="btn btn-primary mt-2"
          onClick={async () => {
            try {
              await sendPasswordResetEmail(getAuth(), resetEmail);
              setResetMsg('Password reset email sent!');
            } catch (err) {
              setResetMsg('Error sending reset email.');
            }
          }}
        >
          Forgot Password?
        </button>
        {resetMsg && <div className="text-green-600 mt-2">{resetMsg}</div>}
      </div>
      <p className="text-xs text-muted-foreground mt-4">Admins can create accounts in the Admin Panel.</p>
      <div className="mt-6 text-center text-sm">
        <Link to="/" className="underline">Back to Dashboard</Link>
      </div>
    </div>
  );
}
