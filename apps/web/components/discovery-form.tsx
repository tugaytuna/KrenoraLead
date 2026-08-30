"use client";

import { Check, Info, Radar, Search, X } from "lucide-react";
import { useActionState, useState } from "react";
import { createDiscoveryJobs } from "@/app/discovery/actions";
import { Card } from "@/components/ui/card";

const allDistricts = ["Kadıköy", "Beşiktaş", "Şişli", "Üsküdar"];

export interface DiscoveryModuleOption {
  key: string;
  label: string;
  defaults: { minimumRating?: number; minimumReviews?: number };
}

export function DiscoveryForm({ modules, quota }: { modules: DiscoveryModuleOption[]; quota?: { used: number; limit: number } }) {
  const firstModule = modules[0];
  const [verticalKey, setVerticalKey] = useState(firstModule?.key ?? "");
  const [districts, setDistricts] = useState(["Kadıköy", "Beşiktaş"]);
  const [rating, setRating] = useState(firstModule?.defaults.minimumRating ?? 4.2);
  const [reviews, setReviews] = useState(firstModule?.defaults.minimumReviews ?? 30);
  const [state, action, pending] = useActionState(createDiscoveryJobs, undefined);
  const toggleDistrict = (district: string) => setDistricts((current) => (
    current.includes(district) ? current.filter((item) => item !== district) : [...current, district]
  ));

  return (
    <form action={action} className="grid items-start gap-6 lg:grid-cols-12">
      <input type="hidden" name="districts" value={JSON.stringify(districts)} />
      <input type="hidden" name="verticalKey" value={verticalKey} />
      <input type="hidden" name="minimumRating" value={rating} />
      <input type="hidden" name="minimumReviews" value={reviews} />

      <div className="space-y-6 lg:col-span-8">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Search className="size-5 text-blue-700" />Hedef coğrafya ve kapsam
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SelectField label="Ülke" name="country" options={["Türkiye"]} />
            <SelectField label="Şehir" name="city" options={["İstanbul"]} />
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="data-label text-slate-600">İlçeler</span>
              <button type="button" onClick={() => setDistricts(allDistricts)} className="text-xs font-semibold text-blue-700">Tümünü seç</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {allDistricts.map((district) => {
                const selected = districts.includes(district);
                return (
                  <button
                    type="button"
                    key={district}
                    onClick={() => toggleDistrict(district)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold ${selected ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"}`}
                  >
                    {district}{selected ? <X className="size-3.5" /> : <span className="text-base leading-none">+</span>}
                  </button>
                );
              })}
              <button type="button" className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600">
                <Search className="size-3.5" />39 ilçeyi görüntüle
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Sektör ve kalite filtreleri</h2>
          <div className="mt-6 grid gap-7 md:grid-cols-2">
            <div>
              <span className="data-label text-slate-600">Kategoriler</span>
              <div className="mt-3 min-h-32 rounded-lg bg-slate-100 p-3">
                <select
                  value={verticalKey}
                  onChange={(event) => {
                    const next = modules.find((module) => module.key === event.target.value);
                    setVerticalKey(event.target.value);
                    if (next?.defaults.minimumRating !== undefined) setRating(next.defaults.minimumRating);
                    if (next?.defaults.minimumReviews !== undefined) setReviews(next.defaults.minimumReviews);
                  }}
                  className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600"
                  aria-label="Sektör modülü"
                >
                  {modules.map((module) => <option key={module.key} value={module.key}>{module.label}</option>)}
                </select>
                <p className="mt-3 text-xs leading-5 text-slate-500">Her sektör kendi arama, eleme ve skorlama modülüyle çalışır.</p>
              </div>
            </div>
            <div className="space-y-6">
              <RangeField label="Minimum puan" value={`${rating.toFixed(1)}+`} min={1} max={5} step={0.1} current={rating} setCurrent={setRating} />
              <RangeField label="Minimum yorum" value={`${reviews}+`} min={0} max={500} step={10} current={reviews} setCurrent={setReviews} />
            </div>
          </div>
        </Card>
      </div>

      <aside className="space-y-4 lg:col-span-4">
        <Card className="bg-slate-100 p-5">
          <h2 className="text-lg font-semibold">Veri kaynakları</h2>
          <div className="mt-5 flex items-center gap-3 text-sm"><span className="grid size-5 place-items-center rounded bg-blue-700 text-white"><Check className="size-3.5" /></span>Google Places API</div>
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500"><span className="size-5 rounded border border-slate-300" />CSV içe aktar <small className="data-label">Yakında</small></div>
          <div className="my-6 border-t border-slate-200" />
          <h2 className="text-lg font-semibold">Gereksinimler</h2>
          <label className="mt-5 flex items-start gap-3 text-sm text-slate-400"><input type="checkbox" disabled className="mt-1 accent-blue-700" /><span>Website zorunlu<small className="mt-1 block text-xs leading-5">Kaynak filtresi sonraki sürümde etkinleşecek.</small></span></label>
          <label className="mt-4 flex items-center gap-3 text-sm text-slate-400"><input type="checkbox" disabled className="accent-blue-700" />Telefon numarası zorunlu</label>
        </Card>
        <button type="submit" disabled={pending || districts.length === 0 || !verticalKey} className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 text-base font-semibold text-white shadow-md hover:bg-blue-800 disabled:opacity-70">
          <Radar className={`size-5 ${pending ? "animate-spin" : ""}`} />{pending ? "Kuyruğa alınıyor..." : "Keşfi başlat"}
        </button>
        <Card className="flex gap-3 p-4"><Info className="size-5 shrink-0 text-emerald-500" /><p className="text-xs leading-5 text-slate-600">Her ilçe ayrı bir arka plan işi olarak çalışır. Sonuçlar Google Places sınırları ve seçilen kalite filtrelerine göre değişir.{quota && <span className="mt-1 block font-semibold text-slate-700">Aylık keşif kullanımı: {quota.used}/{quota.limit}</span>}</p></Card>
        {state?.message && <Card className={`p-4 ${state.success ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`} role="status"><p className={`text-sm font-semibold ${state.success ? "text-blue-950" : "text-red-900"}`}>{state.success ? "İş başarıyla kuyruğa alındı." : "Keşif başlatılamadı."}</p><p className={`mt-1 text-xs leading-5 ${state.success ? "text-blue-800" : "text-red-700"}`}>{state.message}</p></Card>}
      </aside>
    </form>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return <label><span className="data-label text-slate-600">{label}</span><select name={name} className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-slate-100 px-3 text-sm outline-none focus:border-blue-600">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function RangeField({ label, value, min, max, step, current, setCurrent }: { label: string; value: string; min: number; max: number; step: number; current: number; setCurrent: (value: number) => void }) {
  return <label className="block"><span className="data-label flex justify-between text-slate-600">{label}<b className="mono-data text-blue-700">{value}</b></span><input className="mt-4 w-full accent-blue-700" type="range" min={min} max={max} step={step} value={current} onChange={(event) => setCurrent(Number(event.target.value))} /></label>;
}
