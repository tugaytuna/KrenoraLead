import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Krenora Lead", template: "%s · Krenora Lead" },
  description: "Ticari açıdan güçlü, dijital olarak gelişime açık işletmeleri keşfedin.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body className="font-sans antialiased"><AppShell>{children}</AppShell></body></html>;
}
