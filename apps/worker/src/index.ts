import {
  claimNextSearchJob,
  completeSearchJob,
  failSearchJob,
  ingestDiscoveredLeadsWithResolution,
  reserveWorkspaceUsage,
  settleWorkspaceUsage,
  enrichAndScoreOrganizations,
  type SearchJobRow,
} from "@krenora/database";
import { HomepageCrawler, fetchWebsite } from "@krenora/crawler";
import { DiscoveryExecutionError, DiscoveryOrchestrator, DiscoveryQuotaExceededError, SourceRegistry } from "@krenora/discovery";
import { normalizeRawLead } from "@krenora/lead-engine";
import { GooglePlacesSource } from "@krenora/sources";
import type { DiscoverySearchParams } from "@krenora/shared";
import { createDefaultVerticalRegistry } from "@krenora/verticals";
import { createWorkerDependencies } from "./config";

const dependencies = createWorkerDependencies();
const websiteCrawler = new HomepageCrawler(fetchWebsite);
const orchestrator = new DiscoveryOrchestrator({
  verticals: createDefaultVerticalRegistry(),
  sources: new SourceRegistry([new GooglePlacesSource(dependencies.googlePlacesApiKey)]),
  normalize: normalizeRawLead,
  repository: {
    ingest: (context, leads) => ingestDiscoveredLeadsWithResolution(dependencies.supabase, context, leads),
    enrichAndScore: (context, leads, _policy, profile) => enrichAndScoreOrganizations(
      dependencies.supabase,
      context,
      leads,
      profile,
      (url) => websiteCrawler.scan(url),
    ),
  },
  usage: {
    async beforeProviderRequest(job, intent, intentIndex) {
      const reservation = await reserveWorkspaceUsage(dependencies.supabase, {
        workspaceId: job.workspace.workspaceId,
        actorUserId: job.workspace.actorUserId,
        meter: "provider_request",
        quantity: 1,
        idempotencyKey: `provider:${job.id}:${job.attempt ?? 1}:${intentIndex}`,
        verticalKey: job.verticalKey,
        source: intent.source,
        metadata: { intentIndex, query: intent.query },
      });
      if (!reservation) throw new DiscoveryQuotaExceededError();
    },
    afterProviderRequest(job, _intent, intentIndex, outcome) {
      return settleWorkspaceUsage(
        dependencies.supabase,
        `provider:${job.id}:${job.attempt ?? 1}:${intentIndex}`,
        outcome,
      );
    },
  },
});
let stopping = false;

function numericFilter(filters: Record<string, unknown>, key: string) {
  return typeof filters[key] === "number" ? filters[key] : undefined;
}

function jobInput(job: SearchJobRow): DiscoverySearchParams {
  return {
    verticalKey: typeof job.filters.verticalKey === "string" ? job.filters.verticalKey : undefined,
    verticalVersion: typeof job.filters.verticalVersion === "string" ? job.filters.verticalVersion : undefined,
    country: job.country,
    city: job.city,
    district: job.district ?? undefined,
    category: job.category,
    minimumRating: numericFilter(job.filters, "minimumRating"),
    minimumReviews: numericFilter(job.filters, "minimumReviews"),
    languageCode: typeof job.filters.languageCode === "string" ? job.filters.languageCode : "tr",
    maxPages: numericFilter(job.filters, "maxPages"),
  };
}

async function processNextJob() {
  const job = await claimNextSearchJob(dependencies.supabase);
  if (!job) return false;

  console.info("Keşif işi başladı", { jobId: job.id, district: job.district, attempt: job.attempt_count });
  try {
    const input = jobInput(job);
    if (!input.verticalKey) {
      throw new DiscoveryExecutionError("Keşif işinde verticalKey bulunmuyor; eski iş yeniden oluşturulmalı.", false);
    }
    const result = await orchestrator.execute({
      id: job.id,
      attempt: job.attempt_count,
      workspace: { workspaceId: job.workspace_id, actorUserId: job.requested_by ?? job.user_id },
      verticalKey: input.verticalKey,
      verticalVersion: input.verticalVersion,
      input,
    });
    await completeSearchJob(dependencies.supabase, job.id, result);
    console.info("Keşif işi tamamlandı", {
      jobId: job.id,
      vertical: `${result.verticalKey}@${result.verticalVersion}`,
      found: result.found,
      created: result.created,
      updated: result.updated,
      excluded: result.excluded,
      intentsFailed: result.intentsFailed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen worker hatası";
    const retryable = error instanceof DiscoveryExecutionError && error.retryable;
    await failSearchJob(dependencies.supabase, job, message, retryable);
    console.error("Keşif işi başarısız", { jobId: job.id, retryable, message });
  }
  return true;
}

async function run() {
  console.info("Krenora discovery worker hazır", { pollIntervalMs: dependencies.pollIntervalMs });
  while (!stopping) {
    try {
      const processed = await processNextJob();
      if (!processed && dependencies.runOnce) break;
      if (!processed) await new Promise((resolve) => setTimeout(resolve, dependencies.pollIntervalMs));
    } catch (error) {
      console.error("Worker döngüsü hatası", error);
      await new Promise((resolve) => setTimeout(resolve, dependencies.pollIntervalMs));
    }
  }
  console.info("Krenora discovery worker döngüsü tamamlandı");
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopping = true;
    console.info("Worker güvenli biçimde durduruluyor", { signal });
  });
}

void run();
