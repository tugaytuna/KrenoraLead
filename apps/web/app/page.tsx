import { Activity, ArrowRight, Building2, CheckCircle2, Diamond, Radar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { discoveryJobs, leads } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

const chartPoints = "0,205 60,194 120,198 180,175 240,132 300,113 360,118 420,85 480,68 540,74 600,58 660,28";

export default function DashboardPage() {
  const highOpportunity = leads.filter((lead) => lead.score.total >= 80).length;
  const averageScore = Math.round(leads.reduce((sum, lead) => sum + lead.score.total, 0) / leads.length);
  const metrics = [
    { label: "Toplam işletme", value: formatNumber(1248), note: "+12% bu hafta", icon: Building2, tone: "blue" },
    { label: "Yüksek fırsat", value: formatNumber(156 + highOpportunity), note: "+4 bugün", icon: Diamond, tone: "amber" },
    { label: "Aktif tarama", value: "12", note: "Şu anda çalışıyor", icon: Radar, tone: "green" },
    { label: "Tamamlanan iş", value: formatNumber(3412), note: "4 bölgede", icon: CheckCircle2, tone: "blue" },
  ];
  return (
    <div className="animate-enter space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="data-label text-blue-700">Genel görünüm</p><h1 className="mt-2 text-2xl font-bold tracking-tight md:text-[32px]">Bugünün fırsat görünümü</h1><p className="mt-2 text-sm text-slate-600">İşletme gücü ile dijital olgunluk açığını birlikte izleyin.</p></div><Link href="/discovery" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">Yeni keşif başlat <ArrowRight className="size-4" /></Link></div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => <Card key={metric.label} className="relative overflow-hidden bg-slate-100 p-5"><div className="flex items-start justify-between"><p className="data-label max-w-24 text-slate-600">{metric.label}</p><metric.icon className={`size-5 ${metric.tone === "amber" ? "text-amber-500" : metric.tone === "green" ? "text-emerald-500" : "text-blue-700"}`} /></div><p className="mono-data mt-5 text-3xl font-bold tracking-tight">{metric.value}</p><p className={`mt-2 flex items-center gap-1 text-xs ${metric.tone === "green" ? "text-emerald-600" : "text-slate-600"}`}><TrendingUp className="size-3.5" />{metric.note}</p></Card>)}
        <Card className="border-slate-950 bg-slate-950 p-5 text-white"><div className="flex items-start justify-between"><p className="data-label max-w-24 text-slate-300">Ort. fırsat skoru</p><Activity className="size-5" /></div><p className="mono-data mt-5 text-3xl font-bold">{averageScore}<span className="ml-1 text-base text-slate-400">/100</span></p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${averageScore}%` }} /></div></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <div className="space-y-6">
          <Card className="bg-slate-100 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Keşif ivmesi</h2><p className="mt-1 text-xs text-slate-500">Son 30 gün · keşfedilen ve analiz edilen işletmeler</p></div><div className="flex gap-4 text-xs text-slate-600"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-blue-700" />Keşfedilen</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-blue-200" />Analiz edilen</span></div></div><div className="mt-8 h-[260px] w-full overflow-hidden"><svg className="h-full w-full" viewBox="0 0 660 230" preserveAspectRatio="none" role="img" aria-label="Keşif ivmesi çizgi grafiği"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0058be" stopOpacity=".22"/><stop offset="1" stopColor="#0058be" stopOpacity="0"/></linearGradient></defs>{[45,100,155,210].map((y) => <line key={y} x1="0" y1={y} x2="660" y2={y} stroke="#d8dee8" strokeDasharray="4 5" />)}<polyline points={`${chartPoints} 660,230 0,230`} fill="url(#area)" stroke="none"/><polyline points={chartPoints} fill="none" stroke="#0058be" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div></Card>
          <Card className="p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Aktif operasyonlar</h2><span className="mono-data rounded bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-800">{discoveryJobs.filter((job) => job.status === "running").length} ÇALIŞIYOR</span></div><div className="mt-5 space-y-5">{discoveryJobs.slice(0,2).map((job) => <div key={job.id}><div className="flex items-center justify-between gap-4 text-sm"><span className="font-medium">{job.title} · {job.location.split("·")[0]}</span><span className={`mono-data font-semibold ${job.status === "running" ? "text-amber-600" : "text-blue-700"}`}>{job.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${job.status === "running" ? "bg-amber-500" : "bg-blue-700"}`} style={{width:`${job.progress}%`}} /></div></div>)}</div></Card>
        </div>
        <Card className="flex min-h-[520px] flex-col bg-slate-100"><div className="border-b border-slate-200 p-6"><h2 className="text-lg font-semibold">En iyi fırsatlar</h2></div><div className="flex-1 divide-y divide-slate-200/70 px-4">{[...leads].sort((a,b) => b.score.total-a.score.total).slice(0,5).map((lead) => <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between gap-4 rounded-lg px-2 py-5 hover:bg-white/70"><div className="min-w-0"><p className="truncate text-sm font-semibold">{lead.name}</p><p className="mt-1 truncate text-xs text-slate-500">{lead.category} · {lead.district}</p></div><span className="mono-data grid size-11 shrink-0 place-items-center rounded-lg bg-blue-100 font-bold text-blue-800">{lead.score.total}</span></Link>)}</div><Link href="/leads" className="m-4 flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:text-blue-700">Tüm lead’leri görüntüle</Link></Card>
      </section>
    </div>
  );
}

