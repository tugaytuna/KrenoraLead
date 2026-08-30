import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/80 p-6 md:p-8">
      <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div><h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 md:text-[32px] md:leading-10">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">{description}</p></div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

