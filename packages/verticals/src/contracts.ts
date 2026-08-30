import type {
  DiscoverySearchParams,
  QualificationResult,
  RawLead,
  SearchIntent,
} from "@krenora/shared";
import type { ScoringProfile } from "@krenora/scoring";

export interface VerticalManifest {
  key: string;
  version: string;
  label: string;
  locale: string;
  supportedSources: readonly string[];
  defaults: {
    minimumRating?: number;
    minimumReviews?: number;
  };
}

export interface EnrichmentPolicy {
  prioritySignals: readonly string[];
  maximumWebsitePages: number;
}

export interface VerticalModule {
  readonly manifest: VerticalManifest;
  buildSearchIntents(input: DiscoverySearchParams): SearchIntent[];
  qualify(lead: RawLead): QualificationResult;
  enrichmentPolicy(): EnrichmentPolicy;
  scoringProfile(): ScoringProfile;
}
