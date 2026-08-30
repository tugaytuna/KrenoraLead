"use client";

import { BarChart3, Bolt, LayoutDashboard, LogOut, Menu, Search, Settings, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Lead Explorer", icon: UsersRound },
  { href: "/discovery", label: "Keşif", icon: Search },
  { href: "/scans", label: "Taramalar", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) {
    return <main className="min-h-screen">{children}</main>;
  }

  const nav = (
    <>
      <div className="flex h-16 items-center px-6"><Logo /></div>
      <nav className="flex flex-1 flex-col gap-1 px-4 pt-6">
        {navigation.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-950", active && "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white")}>
              <item.icon className="size-5" />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-slate-200 p-4">
        <button className="flex h-12 w-full items-center gap-3 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-950"><Settings className="size-5" />Ayarlar</button>
        <form action={signOut}><button className="flex h-12 w-full items-center gap-3 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-950"><LogOut className="size-5" />Çıkış yap</button></form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-slate-100/90 lg:flex">{nav}</aside>
      {open && <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><aside className="flex h-full w-72 flex-col bg-slate-100" onClick={(event) => event.stopPropagation()}><button className="absolute left-[232px] top-4 rounded-md p-2 text-slate-500" onClick={() => setOpen(false)} aria-label="Menüyü kapat"><X className="size-5" /></button>{nav}</aside></div>}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)} aria-label="Menüyü aç"><Menu className="size-5" /></button>
            <span className="text-base font-semibold text-slate-700 md:text-lg">Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold tracking-[0.08em] text-blue-700 sm:flex"><Bolt className="size-4" />PILOT</div>
            <div className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white ring-2 ring-white">TT</div>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1440px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
