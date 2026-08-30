import type { DiscoverySearchParams, RawLead, SearchIntent, WorkspaceContext } from "@krenora/shared";
import type { LeadSource } from "@krenora/sources";
import type { VerticalRegistry } from "@krenora/verticals";
import type { EnrichmentPolicy } from "@krenora/verticals";
import type { ScoringProfile } from "@krenora/scoring";

export interface NormalizedDiscoveryLead extends RawLead {
  normalizedName: string;
  normalizedDomain?: string;
  normalizedPhone?: string;
}

export interface DiscoveryIngestionMetrics {
  found: number;
  created: number;
  updated: number;
  duplicates: number;
}

export interface DiscoveryRepository {
  ingest(context: WorkspaceContext, leads: NormalizedDiscoveryLead[]): Promise<DiscoveryIngestionMetrics>;
  enrichAndScore?(context: WorkspaceContext, leads: NormalizedDiscoveryLead[], policy: EnrichmentPolicy, profile: ScoringProfile): Promise<{ scanned: number; scored: number; warnings: string[] }>;
}

export interface DiscoveryExecutionJob {
  id: string;
  attempt?: number;
  workspace: WorkspaceContext;
  verticalKey: string;
  verticalVersion?: string;
  input: DiscoverySearchParams;
}

export interface DiscoveryExecutionResult extends DiscoveryIngestionMetrics {
  verticalKey: string;
  verticalVersion: string;
  intentsAttempted: number;
  intentsSucceeded: number;
  intentsFailed: number;
  qualified: number;
  review: number;
  excluded: number;
  warnings: string[];
}

export interface SourceRegistryPort {
  get(key: string): LeadSource;
}

export interface DiscoveryUsagePort {
  beforeProviderRequest(job: DiscoveryExecutionJob, intent: SearchIntent, intentIndex: number): Promise<void>;
  afterProviderRequest(job: DiscoveryExecutionJob, intent: SearchIntent, intentIndex: number, outcome: "succeeded" | "failed"): Promise<void>;
}

export interface DiscoveryOrchestratorDependencies {
  verticals: VerticalRegistry;
  sources: SourceRegistryPort;
  repository: DiscoveryRepository;
  usage?: DiscoveryUsagePort;
  normalize(lead: RawLead): NormalizedDiscoveryLead;
}
