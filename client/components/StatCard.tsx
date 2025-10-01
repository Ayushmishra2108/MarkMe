
import { motion } from "framer-motion";
import { ReactNode } from "react";
import "./eventcard-animated-border.css";
export default function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <motion.div
      className="card-glass p-5 hover-rise eventcard-animated-border"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-app-gradient flex items-center justify-center text-white drop-shadow-glow">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/60">{label}</p>
          <p className="text-2xl font-extrabold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
