import { cn } from "@/lib/utils";

export function ScoreRing({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const color = value >= 80 ? "#10b981" : value >= 70 ? "#0058be" : value >= 50 ? "#f59e0b" : "#76777d";
  const dimensions = size === "lg" ? "size-24 text-2xl" : size === "sm" ? "size-11 text-xs" : "size-14 text-sm";
  return (
    <div className={cn("relative grid place-items-center rounded-full", dimensions)} style={{ background: `conic-gradient(${color} ${value * 3.6}deg, #e2e8f0 0deg)` }} aria-label={`Fırsat skoru ${value}`}>
      <div className="absolute inset-[4px] rounded-full bg-white" />
      <span className="mono-data relative z-10 font-bold text-slate-900">{value}</span>
    </div>
  );
}

