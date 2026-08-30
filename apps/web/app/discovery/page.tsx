import {
  getWorkspaceUsageSummary,
  listEnabledVerticals,
  listRecentSearchJobs,
} from "@krenora/database";
import { createDefaultVerticalRegistry } from "@krenora/verticals";
import { DiscoveryForm, type DiscoveryModuleOption } from "@/components/discovery-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { discoveryJobs as demoJobs } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";
import { getAuthenticatedWorkspace } from "@/lib/workspace";

export const metadata = { title: "Keşif" };

interface DiscoveryJobView {
  id: string;
  title: string;
  location: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  recordsFound: number;
  qualified?: number;
  review?: number;
  excluded?: number;
  intentsSucceeded?: number;
  intentsAttempted?: number;
  createdAt: string;
}

async function getPageData(): Promise<{
  modules: DiscoveryModuleOption[];
  jobs: DiscoveryJobView[];
  quota?: { used: number; limit: number };
}> {
  const registry = createDefaultVerticalRegistry();
  if (!isSupabaseConfigured()) {
    return {
      modules: registry.list().map((manifest) => ({ key: manifest.key, label: manifest.label, defaults: manifest.defaults })),
      jobs: demoJobs,
    };
  }

  const supabase = await createClient();
  const workspace = await getAuthenticatedWorkspace(supabase);
  const [enabled, jobs, usage] = await Promise.all([
    listEnabledVerticals(supabase, workspace.context.workspaceId),
    listRecentSearchJobs(supabase, workspace.context.workspaceId),
    getWorkspaceUsageSummary(supabase, workspace.context.workspaceId),
  ]);
  const modules = enabled.flatMap((item) => {
    try {
      const manifest = registry.get(item.vertical_key, item.vertical_version).manifest;
      return [{ key: manifest.key, label: manifest.label, defaults: manifest.defaults }];
    } catch {
      return [];
    }
  });
  return {
    modules,
    jobs: jobs.map((job) => ({
      id: job.id,
      title: `${job.category} keşfi`,
      location: [job.district, job.city].filter(Boolean).join(", "),
      status: job.status,
      progress: job.progress,
      recordsFound: job.records_found,
      qualified: job.qualified_count,
      review: job.review_count,
      excluded: job.excluded_count,
      intentsSucceeded: job.intents_succeeded,
      intentsAttempted: job.intents_attempted,
      createdAt: job.created_at,
    })),
    quota: usage.discoveryJobs,
  };
}

const statusLabels = { pending: "Bekliyor", running: "Çalışıyor", completed: "Tamamlandı", failed: "Başarısız" };

export default async function DiscoveryPage() {
  const { modules, jobs, quota } = await getPageData();
  return (
    <div className="animate-enter space-y-6">
      <PageHeader title="Lead keşfi" description="Hedef bölgeyi ve sektörü seçin; her sektörün bağımsız modülüyle yeni ticari fırsatlar bulun." />
      <DiscoveryForm modules={modules} quota={quota} />
      <section>
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-semibold">Son keşif işleri</h2>
          <span className="text-xs font-semibold text-slate-500">Workspace kapsamında</span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {jobs.map((job) => {
            const active = job.status === "running" || job.status === "pending";
            return (
              <Card key={job.id} className="relative overflow-hidden p-5">
                <i className={`absolute inset-y-0 left-0 w-1 ${job.status === "failed" ? "bg-red-500" : active ? "bg-amber-500" : "bg-emerald-400"}`} />
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-semibold">{job.title}</h3><p className="mt-1 text-xs text-slate-500">{job.location}</p></div>
                  <span className={`data-label rounded px-2 py-1 ${job.status === "failed" ? "bg-red-100 text-red-700" : active ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{statusLabels[job.status]}</span>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div><p className="mono-data text-xl font-bold text-blue-700">{job.recordsFound}</p><p className="data-label mt-1 text-slate-500">Lead bulundu</p></div>
                  <p className="text-xs text-slate-500">{formatRelativeDate(job.createdAt)}</p>
                </div>
                {job.qualified !== undefined && <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><span className="rounded bg-emerald-50 p-2 text-emerald-700">{job.qualified} uygun</span><span className="rounded bg-amber-50 p-2 text-amber-700">{job.review} incele</span><span className="rounded bg-slate-100 p-2 text-slate-600">{job.excluded} elendi</span></div>}
                {active && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${job.progress}%` }} /></div>}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
