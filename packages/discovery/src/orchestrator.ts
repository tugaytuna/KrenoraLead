import { discoverySearchParamsSchema, type RawLead } from "@krenora/shared";
import type {
  DiscoveryExecutionJob,
  DiscoveryExecutionResult,
  DiscoveryOrchestratorDependencies,
  NormalizedDiscoveryLead,
} from "./contracts";

export class DiscoveryExecutionError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "DiscoveryExecutionError";
  }
}

export class DiscoveryQuotaExceededError extends Error {
  readonly retryable = false;

  constructor(message = "Çalışma alanının harici veri kaynağı kotası doldu.") {
    super(message);
    this.name = "DiscoveryQuotaExceededError";
  }
}

function retryableError(error: unknown) {
  return Boolean(error && typeof error === "object" && "retryable" in error && error.retryable === true);
}

function appendVerticalEvidence(
  lead: NormalizedDiscoveryLead,
  verticalKey: string,
  verticalVersion: string,
  decision: string,
  reasonCodes: string[],
  confidence: number,
) {
  return {
    ...lead,
    rawData: {
      ...(lead.rawData ?? {}),
      vertical: { key: verticalKey, version: verticalVersion, decision, reasonCodes, confidence },
    },
  };
}

function deduplicateByStrongSignals(leads: NormalizedDiscoveryLead[]) {
  const seen = new Set<string>();
  return leads.filter((lead, index) => {
    const keys = [
      lead.externalId ? `${lead.source}:external:${lead.externalId}` : undefined,
      lead.normalizedDomain ? `domain:${lead.normalizedDomain}` : undefined,
      lead.normalizedPhone ? `phone:${lead.normalizedPhone}` : undefined,
    ].filter((key): key is string => Boolean(key));
    if (keys.some((key) => seen.has(key))) return false;
    if (keys.length === 0) keys.push(`unresolved:${index}`);
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

export class DiscoveryOrchestrator {
  constructor(private readonly dependencies: DiscoveryOrchestratorDependencies) {}

  async execute(job: DiscoveryExecutionJob): Promise<DiscoveryExecutionResult> {
    const vertical = this.dependencies.verticals.get(job.verticalKey, job.verticalVersion);
    const parsedInput = discoverySearchParamsSchema.safeParse(job.input);
    if (!parsedInput.success) throw new DiscoveryExecutionError("Keşif işi girdisi geçersiz.", false);
    const intents = vertical.buildSearchIntents(parsedInput.data);
    if (intents.length === 0) throw new DiscoveryExecutionError("Dikey modül arama niyeti üretmedi.", false);

    const rawLeads: RawLead[] = [];
    const errors: unknown[] = [];
    const warnings: string[] = [];
    let intentsSucceeded = 0;

    for (const [intentIndex, intent] of intents.entries()) {
      if (!vertical.manifest.supportedSources.includes(intent.source)) {
        errors.push(new Error(`${vertical.manifest.key} modülü ${intent.source} kaynağını desteklemiyor.`));
        warnings.push(`${intent.query}: desteklenmeyen kaynak`);
        continue;
      }
      try {
        await this.dependencies.usage?.beforeProviderRequest(job, intent, intentIndex);
        const source = this.dependencies.sources.get(intent.source);
        rawLeads.push(...await source.search(intent));
        await this.dependencies.usage?.afterProviderRequest(job, intent, intentIndex, "succeeded");
        intentsSucceeded += 1;
      } catch (error) {
        await this.dependencies.usage?.afterProviderRequest(job, intent, intentIndex, "failed");
        errors.push(error);
        warnings.push(`${intent.query}: ${error instanceof Error ? error.message : "kaynak hatası"}`);
      }
    }

    if (intentsSucceeded === 0) {
      throw new DiscoveryExecutionError(
        `Tüm arama niyetleri başarısız oldu: ${warnings.join(" | ")}`,
        errors.length > 0 && errors.every(retryableError),
      );
    }

    let qualified = 0;
    let review = 0;
    let excluded = 0;
    const accepted = rawLeads.flatMap((rawLead) => {
      const result = vertical.qualify(rawLead);
      if (result.decision === "excluded") {
        excluded += 1;
        return [];
      }
      if (result.decision === "qualified") qualified += 1;
      else review += 1;
      const normalized = this.dependencies.normalize(rawLead);
      return [appendVerticalEvidence(normalized, vertical.manifest.key, vertical.manifest.version, result.decision, result.reasonCodes, result.confidence)];
    });

    const uniqueLeads = deduplicateByStrongSignals(accepted);
    const ingestion = await this.dependencies.repository.ingest(job.workspace, uniqueLeads);
    const enrichment = await this.dependencies.repository.enrichAndScore?.(
      job.workspace,
      uniqueLeads,
      vertical.enrichmentPolicy(),
      vertical.scoringProfile(),
    );
    return {
      ...ingestion,
      verticalKey: vertical.manifest.key,
      verticalVersion: vertical.manifest.version,
      intentsAttempted: intents.length,
      intentsSucceeded,
      intentsFailed: intents.length - intentsSucceeded,
      qualified,
      review,
      excluded,
      warnings: [...warnings, ...(enrichment?.warnings ?? [])],
    };
  }
}
