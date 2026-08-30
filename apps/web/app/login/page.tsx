import { BarChart3, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Giriş" };

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="hidden overflow-hidden bg-[#131b2e] p-12 text-white lg:flex lg:flex-col">
        <Logo inverse />
        <div className="my-auto max-w-xl">
          <p className="data-label text-blue-300">Lead Intelligence Platform</p>
          <h1 className="mt-5 text-5xl font-bold leading-tight tracking-[-0.03em]">Güçlü işletmeleri, gerçek dijital fırsatlarla buluşturun.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">Ham işletme verisini teknik sinyallere, açıklanabilir fırsat skorlarına ve satış içgörülerine dönüştürün.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Feature icon={Search} label="Keşif" />
            <Feature icon={BarChart3} label="Skorlama" />
            <Feature icon={ShieldCheck} label="Güvenli veri" />
          </div>
        </div>
        <p className="text-xs text-slate-500">Krenora Lead · Pilot sürüm</p>
      </section>
      <main className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <p className="data-label text-blue-700">Hoş geldiniz</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Krenora hesabınıza erişin</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Lead havuzunuzu güvenli bir oturumla yönetin.</p>
          {!configured && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">Demo modu etkin</p>
              <p className="mt-1 text-xs leading-5 text-amber-800">Supabase anahtarları tanımlanana kadar authentication devre dışıdır.</p>
              <Link href="/" className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline">Demo olarak devam et →</Link>
            </div>
          )}
          <div className="mt-7 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <AuthForm configured={configured} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Search; label: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/5 p-4"><Icon className="size-5 text-blue-300" /><p className="mt-3 text-sm font-semibold">{label}</p></div>;
}
