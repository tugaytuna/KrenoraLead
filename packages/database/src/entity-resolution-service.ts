import { evaluateEntityMatch, identityFromRawLead, normalizeEntityIdentity, type EntityIdentity, type EntityMatchResult, type NormalizedEntityIdentity } from "@krenora/lead-engine";
import type { RawLead, WorkspaceContext } from "@krenora/shared";

export interface PersistedSourceRecord { id: string; workspaceId: string }
export interface OrganizationCandidate extends EntityIdentity { organizationId: string }
export type PersistenceDecision = "match" | "review" | "create";
export interface ApplyResolutionCommand { sourceRecordId: string; decision: PersistenceDecision; candidateOrganizationId: string | null; confidence: number; evidence: string[] }
export interface AppliedResolution { organizationId: string | null; reviewId: string | null; decision: PersistenceDecision }
export interface EntityResolutionRepository {
  assertWorkspaceAccess(context: WorkspaceContext): Promise<void>;
  upsertSourceRecord(context: WorkspaceContext, lead: RawLead, normalized: NormalizedEntityIdentity): Promise<PersistedSourceRecord>;
  findOrganizationCandidates(context: WorkspaceContext, normalized: NormalizedEntityIdentity): Promise<OrganizationCandidate[]>;
  applyResolution(context: WorkspaceContext, command: ApplyResolutionCommand): Promise<AppliedResolution>;
}
export interface IngestLeadResult extends AppliedResolution { sourceRecordId: string; candidateCount: number }

interface RankedCandidate { organizationId: string; result: EntityMatchResult }
const decisionRank = { match: 2, review: 1, no_match: 0 } as const;

function rankCandidates(incoming: EntityIdentity, candidates: OrganizationCandidate[]): RankedCandidate[] {
  const bestByOrganization = new Map<string, RankedCandidate>();
  for (const candidate of candidates) {
    const ranked = { organizationId: candidate.organizationId, result: evaluateEntityMatch(incoming, candidate) };
    const current = bestByOrganization.get(candidate.organizationId);
    if (!current || decisionRank[ranked.result.decision] > decisionRank[current.result.decision]
      || (ranked.result.decision === current.result.decision && ranked.result.confidence > current.result.confidence)) {
      bestByOrganization.set(candidate.organizationId, ranked);
    }
  }
  return [...bestByOrganization.values()].sort((left, right) =>
    decisionRank[right.result.decision] - decisionRank[left.result.decision]
    || right.result.confidence - left.result.confidence,
  );
}

export async function ingestRawLead(context: WorkspaceContext, lead: RawLead, repository: EntityResolutionRepository): Promise<IngestLeadResult> {
  await repository.assertWorkspaceAccess(context);
  const identity = identityFromRawLead(lead);
  const normalized = normalizeEntityIdentity(identity);
  const sourceRecord = await repository.upsertSourceRecord(context, lead, normalized);
  const candidates = await repository.findOrganizationCandidates(context, normalized);
  const ranked = rankCandidates(identity, candidates);
  const matches = ranked.filter((candidate) => candidate.result.decision === "match");
  let command: ApplyResolutionCommand;
  if (matches.length === 1) {
    const match = matches[0]!;
    command = { sourceRecordId: sourceRecord.id, decision: "match", candidateOrganizationId: match.organizationId, confidence: match.result.confidence, evidence: match.result.evidence };
  } else if (matches.length > 1) {
    const match = matches[0]!;
    command = { sourceRecordId: sourceRecord.id, decision: "review", candidateOrganizationId: match.organizationId, confidence: match.result.confidence, evidence: [...match.result.evidence, "ambiguous_candidates"] };
  } else {
    const review = ranked.find((candidate) => candidate.result.decision === "review");
    command = review
      ? { sourceRecordId: sourceRecord.id, decision: "review", candidateOrganizationId: review.organizationId, confidence: review.result.confidence, evidence: review.result.evidence }
      : { sourceRecordId: sourceRecord.id, decision: "create", candidateOrganizationId: null, confidence: 1, evidence: ["no_viable_candidate"] };
  }
  const applied = await repository.applyResolution(context, command);
  return { ...applied, sourceRecordId: sourceRecord.id, candidateCount: new Set(candidates.map((candidate) => candidate.organizationId)).size };
}
