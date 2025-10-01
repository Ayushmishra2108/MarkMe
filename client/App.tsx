import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import EventDetails from "./pages/EventDetails";
import MemberDetails from "./pages/MemberDetails";
import Index from "./pages/Index";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import QRScan from "./pages/QRScan";
import Admin from "./pages/Admin";
import Team from "./pages/Team";
import Login from "./pages/Login";
import SeedAdmin from "./pages/SeedAdmin";
import Profile from "./pages/Profile";
import { AuthProvider } from "@/context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="dashboard" element={<Index />} />
              <Route path="qr-scan" element={<QRScan />} />
              <Route path="admin" element={<Admin />} />
              <Route path="team" element={<Team />} />
              <Route path="login" element={<Login />} />
              <Route path="profile" element={<Profile />} />
              <Route path="seed-admin" element={<SeedAdmin />} />
              <Route path="event/:eventId" element={<EventDetails />} />
              <Route path="member/:memberId" element={<MemberDetails />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
