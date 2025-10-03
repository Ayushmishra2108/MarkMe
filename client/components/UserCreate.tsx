import React, { useState } from "react";
import "./eventcard-animated-border.css";
import { Eye, EyeOff } from "lucide-react";
import { doc, setDoc, getDocs, query, collection, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserCreateProps {
  disabled?: boolean;
  onRegistered?: () => void;
}

const UserCreate: React.FC<UserCreateProps> = ({ disabled, onRegistered }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [uniqueIdError, setUniqueIdError] = useState("");

  const teamOptions = [
  "Core team",
  "Event management team",
  "Logistics team",
  "Photography team",
  "Videography team",
  "Design team",
  "Content team",
  "PR and Marketing team",
  "Social media team",
  "Anchors",
  "Tech Team"
  ];

  const allPositions = [
    "head",
    "executive",
    "Cheif marketing officer",
    "admin",
    "member",
    "lead",
    "colead",
    "techexecutive",
    "techlead",
    "techcolead",
    "techmember",
    "executive",
    "Tech-Executive",
    "Tech-Lead",
    "Tech-colead",
    "Tech-member"
  ];

  const corePositions = ["head", "executive", "Cheif marketing officer"];
  const techPositions = ["Tech-Executive", "Tech-Lead", "Tech-colead", "Tech-member"];
  const otherPositions = [
    "member",
    "lead",
    "colead"
  ];

  const [form, setForm] = useState({
  name: "",
  email: "",
  className: "",
  rollNo: "",
  year: "",
  teamName: "",
  position: "",
  uniqueId: "",
  phone: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "uniqueId") {
      // Validate: first letter capital, rest lowercase, then numbers
      const regex = /^[A-Z][a-z]+\d+$/;
      if (!regex.test(value)) {
        setUniqueIdError("Custom Unique ID must start with a capital letter, followed by lowercase letters, then numbers (e.g. Aabc123)");
      } else {
        setUniqueIdError("");
      }
    }
    if (name === "phone") {
      // Only allow numbers
      if (!/^\d*$/.test(value)) return;
    }
    setForm({ ...form, [name]: value });
  };

  // Dynamically filter position options based on team selection
  let positionOptions: string[] = [];
  if (form.teamName === "Core team") {
    positionOptions = corePositions;
  } else if (form.teamName === "Tech Team") {
    positionOptions = techPositions;
  } else {
    positionOptions = otherPositions;
  }

  const isFormValid = Object.values(form).every(v => v.trim() !== "") && !uniqueIdError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
    const id = form.uniqueId;
    // Call backend API to create user in Auth and Firestore
    try {
  const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create member");
      setGeneratedId(data.uniqueId || id);
  setShowDialog(true);
  if (onRegistered) onRegistered();
    } catch (err: any) {
      alert("Failed to create member: " + err.message);
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setGeneratedId("");
  // setGeneratedPassword is removed; password is not shown
    setForm({
      name: "",
      email: "",
      className: "",
      rollNo: "",
      year: "",
      teamName: "",
      position: "admin",
      uniqueId: "",
      phone: ""
    });
  };

  return (
    <div className="p-0 border-none bg-transparent">
      <div className="eventcard-animated-border card-glass max-w-xl mx-auto p-8 rounded-2xl shadow-xl">
        <h4 className="text-2xl font-extrabold mb-4 text-center bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow animate-gradient-x">Register Member</h4>
        {(form.teamName === "Core team" && form.position !== "Cheif marketing officer") && (
          <div className="mb-2 text-green-600 text-sm font-medium text-center">This member will have admin access.</div>
        )}
        {(form.teamName === "Core team" && form.position === "Cheif marketing officer") && (
          <div className="mb-2 text-yellow-600 text-sm font-medium text-center">Cheif marketing officer does not get admin access.</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} disabled={disabled} required />
            <input className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all" name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} disabled={disabled} required />
            <input className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all" name="phone" placeholder="Phone No." value={form.phone} onChange={handleChange} disabled={disabled} required type="tel" pattern="[0-9]{10,}" maxLength={15} inputMode="numeric" />
            <input className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all" name="className" placeholder="Class" value={form.className} onChange={handleChange} disabled={disabled} required />
            <input className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all" name="rollNo" placeholder="Roll No." value={form.rollNo} onChange={handleChange} disabled={disabled} required />
            <input className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all" name="year" placeholder="Year" value={form.year} onChange={handleChange} disabled={disabled} required />
            <select className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all" name="teamName" value={form.teamName} onChange={handleChange} disabled={disabled} required>
              <option value="" disabled>Select team</option>
              {teamOptions.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <select className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all" name="position" value={form.position} onChange={handleChange} disabled={disabled} required>
              <option value="" disabled>Select position</option>
              {positionOptions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          <input className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 focus:ring-2 focus:ring-blue-400 transition-all w-full" name="uniqueId" placeholder="Custom Unique ID" value={form.uniqueId} onChange={handleChange} disabled={disabled} required />
          <div className="text-xs text-muted-foreground mb-1">Format: First letter capital, rest lowercase, then numbers (e.g. Aabc123)</div>
          {uniqueIdError && <div className="text-red-500 text-xs mb-2">{uniqueIdError}</div>}
          <div className="relative">
            <input
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-400 transition-all w-full"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={disabled}
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
            <input
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-400 transition-all w-full"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={disabled}
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(v => !v)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordError && <div className="text-red-500 text-xs mb-2">{passwordError}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 text-white font-bold rounded-lg py-2 mt-2 shadow-md hover:scale-105 transition-transform duration-200" disabled={disabled || !isFormValid}>Register Member</button>
        </form>
      </div>

      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border">
            <h2 className="text-2xl font-bold mb-4">Member Registered!</h2>
            <div className="mb-4">
              <div className="text-lg font-medium">ID:</div>
              <div className="text-xl font-mono bg-zinc-100 dark:bg-zinc-800 rounded px-3 py-2 inline-block mt-1">{generatedId}</div>
            </div>
            <div className="mb-6">
              <div className="text-lg font-medium">Password:</div>
              <div className="text-xl font-mono bg-zinc-100 dark:bg-zinc-800 rounded px-3 py-2 inline-block mt-1">(Set by you)</div>
            </div>
            <Button className="w-full" onClick={handleDialogClose}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCreate;
