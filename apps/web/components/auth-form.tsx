"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = undefined;

export function AuthForm({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);
  const state = mode === "signin" ? signInState : signUpState;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <div>
      <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
        <button onClick={() => setMode("signin")} className={`h-10 rounded-md text-sm font-semibold transition ${mode === "signin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>Giriş yap</button>
        <button onClick={() => setMode("signup")} className={`h-10 rounded-md text-sm font-semibold transition ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>Hesap oluştur</button>
      </div>
      <form action={mode === "signin" ? signInAction : signUpAction} className="mt-6 space-y-4">
        <label className="block"><span className="data-label text-slate-600">E-posta</span><input name="email" type="email" autoComplete="email" required className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" placeholder="isim@sirket.com"/>{state?.errors?.email?.map((error) => <small key={error} className="mt-1 block text-xs text-red-600">{error}</small>)}</label>
        <label className="block"><span className="data-label text-slate-600">Şifre</span><input name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8} className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" placeholder="En az 8 karakter"/>{state?.errors?.password?.map((error) => <small key={error} className="mt-1 block text-xs text-red-600">{error}</small>)}</label>
        {state?.message && <div className={`rounded-lg p-3 text-xs leading-5 ${state.success ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{state.message}</div>}
        <button disabled={pending || !configured} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? <LoaderCircle className="size-4 animate-spin"/> : <ArrowRight className="size-4"/>}{mode === "signin" ? "Giriş yap" : "Hesap oluştur"}</button>
      </form>
    </div>
  );
}

