import Link from "next/link";

export default function NotFound() { return <div className="grid min-h-[70vh] place-items-center text-center"><div><p className="mono-data text-sm font-bold text-blue-700">404</p><h1 className="mt-3 text-2xl font-bold">Lead bulunamadı</h1><p className="mt-2 text-sm text-slate-500">Bu kayıt kaldırılmış veya adresi değişmiş olabilir.</p><Link href="/leads" className="mt-6 inline-flex h-10 items-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white">Lead Explorer’a dön</Link></div></div>; }

