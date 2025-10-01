import React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import markmeLogo from './markme-logo.svg';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScanLine, LayoutDashboard, Shield, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_600px_at_-10%_-10%,hsl(var(--brand-start)/0.25),transparent),radial-gradient(800px_500px_at_110%_10%,hsl(var(--brand-end)/0.25),transparent)]">
      <header className="sticky top-0 z-40">
        <div className="bg-white/70 dark:bg-black/30 backdrop-blur-xl border-b border-white/30 dark:border-white/10">
          <nav className="container flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-4 pl-0 ml-[-8px]">
              <span className="flex items-center gap-3">
                <img src={markmeLogo} alt="MarkMe Logo" className="h-8 w-8" />
                <span className="text-lg font-extrabold tracking-tight">MarkMe</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {!user && location.pathname === "/" ? (
                <>
                  <NavItem to="/qr-scan" icon={<ScanLine className="size-4"/>} label="Scan" />
                </>
              ) : user ? (
                <>
                  <NavItem to="/dashboard" icon={<LayoutDashboard className="size-4"/>} label="Dashboard" />
                  <NavItem to="/qr-scan" icon={<ScanLine className="size-4"/>} label="Scan" />
                  <NavItem to="/team" icon={<Users className="size-4"/>} label="Team" />
                  {user.role === "admin" && (
                    <NavItem to="/admin" icon={<Shield className="size-4"/>} label="Admin" />
                  )}
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {!user && location.pathname === "/" ? (
                <Button asChild className="rounded-full px-5 py-2 font-semibold bg-gradient-to-r from-brand-start to-brand-end text-white shadow-md hover:scale-105 transition-transform duration-200 border border-brand-end/30">
                  <Link to="/login">Login</Link>
                </Button>
              ) : user ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm bg-gradient-to-r from-white via-brand-start to-brand-end text-zinc-900 shadow-md hover:scale-105 transition-transform duration-200 border border-brand-end/30"
                    style={{ minWidth: 0 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>My Profile</span>
                  </Link>
                  <Button
                    className="rounded-full px-5 py-2 font-semibold bg-gradient-to-r from-brand-end to-brand-start text-white shadow-md hover:scale-105 transition-transform duration-200 border border-brand-end/30"
                    onClick={async () => {
                      await signOut();
                      navigate("/");
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : null}
              <div className="md:hidden">
                {(!user && location.pathname === "/") ? (
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link to="/qr-scan"><ScanLine className="mr-2"/>Scan</Link>
                  </Button>
                ) : user ? (
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link to="/qr-scan"><ScanLine className="mr-2"/>Scan</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </nav>
        </div>
      </header>
      {location.pathname === "/dashboard" && (
        <div className="bg-app-gradient py-12">
          <div className="container text-white">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">Event Attendance & Team Management</h1>
            <p className="mt-3 text-white/90 max-w-2xl">Sleek, fast and secure check-ins with real-time team insights. Built for modern operations.</p>
            <div className="mt-6">
              <Button asChild size="lg" className="btn-gradient text-white rounded-full px-6 shadow-lg">
                <Link to="/qr-scan"><ScanLine className="mr-2"/> Scan QR to Check-In</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      {location.pathname === "/" && (
        <div className="bg-app-gradient py-12">
          <div className="container flex flex-col items-center justify-center min-h-[180px]">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center">Welcome to MarkMe</h1>
            <p className="mt-3 text-white/90 max-w-2xl text-center">
              Effortless event check-ins, real-time team management, and a seamless experience for organizers and members.
            </p>
          </div>
        </div>
      )}
      <main className="container py-8 pb-16">
        <Outlet />
      </main>
      <footer className="w-full mt-10 bg-gradient-to-r from-blue-500 via-cyan-500 to-fuchsia-500 text-white shadow-inner border-t-0">
        <div className="container flex flex-col md:flex-row items-center justify-between py-4 gap-3">
          <div className="flex items-center gap-3">
            <img src={markmeLogo} alt="MarkMe Logo" className="h-7 w-7 drop-shadow" />
            <span className="font-extrabold text-lg tracking-tight">MarkMe</span>
            <span className="text-xs font-medium opacity-80">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/ayushmishra-cs/markme" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="GitHub">
              <svg width="22" height="22" fill="currentColor" className="text-white/80 hover:text-white" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z"/></svg>
            </a>
            <a href="mailto:aayu21082005@gmail.com" className="hover:scale-110 transition-transform" title="Email Ayush Mishra">
              <svg width="22" height="22" fill="currentColor" className="text-white/80 hover:text-white" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 20v-9.99l7.99 7.99c.39.39 1.02.39 1.41 0L20 10.01V20H4z"/></svg>
            </a>
            <a href="https://www.instagram.com/ayushmishra_2005?igsh=cmJlYTQ5cnkzbXly" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Instagram">
              <svg width="22" height="22" fill="currentColor" className="text-white/80 hover:text-white" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5Zm4.25 2.25a6.25 6.25 0 1 1-6.25 6.25A6.25 6.25 0 0 1 12 5.75Zm0 1.5a4.75 4.75 0 1 0 4.75 4.75A4.75 4.75 0 0 0 12 7.25Zm6.5 1.25a1 1 0 1 1-1 1a1 1 0 0 1 1-1Z"/></svg>
            </a>
            <a href="https://www.linkedin.com/in/ayush-mishra-0654422b7?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="LinkedIn">
              <svg width="22" height="22" fill="currentColor" className="text-white/80 hover:text-white" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg>
            </a>
          </div>
          <span className="text-xs font-medium opacity-80 text-right w-full md:w-auto mt-2 md:mt-0">Modern attendance with style<br/>Created by - <span className="font-semibold">Ayush Mishra</span></span>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-200 border border-transparent",
          isActive
            ? "bg-gradient-to-r from-brand-start to-brand-end text-black dark:text-white shadow-md scale-105 border-brand-end/40"
            : "bg-white/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-white hover:bg-gradient-to-r hover:from-brand-start hover:to-brand-end hover:text-black dark:hover:text-white hover:shadow-md hover:scale-105 border-zinc-200 dark:border-zinc-700",
        )
      }
      style={{ minWidth: 0 }}
    >
      {icon}
      <span className="transition-colors duration-200">{label}</span>
    </NavLink>
  );
}
