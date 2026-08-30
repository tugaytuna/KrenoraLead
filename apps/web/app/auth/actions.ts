"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin.").trim(),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
});

export type AuthState = {
  message?: string;
  success?: boolean;
  errors?: { email?: string[]; password?: string[] };
} | undefined;

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  if (!isSupabaseConfigured()) {
    return { message: "Supabase henüz yapılandırılmadı. Demo bağlantısını kullanabilirsiniz." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: "E-posta veya şifre hatalı." };
  redirect("/");
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  if (!isSupabaseConfigured()) {
    return { message: "Hesap oluşturmak için önce Supabase ortam değişkenlerini tanımlayın." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });

  if (error) return { message: error.message };
  return { success: true, message: "Doğrulama bağlantısı e-posta adresinize gönderildi." };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

