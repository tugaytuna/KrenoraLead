import type { NormalizedEntityIdentity } from "@krenora/lead-engine";
import type { RawLead, WorkspaceContext } from "@krenora/shared";
import type { AppliedResolution, ApplyResolutionCommand, EntityResolutionRepository, OrganizationCandidate, PersistedSourceRecord } from "./entity-resolution-service";

interface RpcResponse { data: unknown; error: { message: string } | null }
export interface SupabaseRpcClient { rpc(functionName: string, args?: Record<string, unknown>): PromiseLike<RpcResponse> }
function object(value: unknown, label: string): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} returned an invalid response`); return value as Record<string, unknown>; }
function string(value: unknown, label: string): string { if (typeof value !== "string" || !value) throw new Error(`${label} is missing`); return value; }
function optionalString(value: unknown): string | null { return typeof value === "string" && value ? value : null; }
async function rpc(client: SupabaseRpcClient, name: string, args: Record<string, unknown>) { const { data, error } = await client.rpc(name, args); if (error) throw new Error(`${name} failed: ${error.message}`); return data; }

export class SupabaseEntityResolutionRepository implements EntityResolutionRepository {
  constructor(private readonly client: SupabaseRpcClient) {}
  async assertWorkspaceAccess(context: WorkspaceContext) {
    const data = await rpc(this.client, "assert_workspace_access", { p_workspace_id: context.workspaceId, p_actor_user_id: context.actorUserId });
    if (data !== true) throw new Error("Workspace access denied");
  }
  async upsertSourceRecord(context: WorkspaceContext, lead: RawLead, normalized: NormalizedEntityIdentity): Promise<PersistedSourceRecord> {
    const data = object(await rpc(this.client, "upsert_source_record", {
      p_workspace_id: context.workspaceId, p_actor_user_id: context.actorUserId,
      p_source: lead.source, p_external_id: lead.externalId ?? null, p_name: lead.name,
      p_category: lead.category ?? null, p_address: lead.address ?? null,
      p_country: lead.country ?? null, p_city: lead.city ?? null, p_district: lead.district ?? null,
      p_latitude: lead.latitude ?? null, p_longitude: lead.longitude ?? null,
      p_phone: lead.phone ?? null, p_email: lead.email ?? null, p_website: lead.website ?? null,
      p_rating: lead.rating ?? null, p_review_count: lead.reviewCount ?? null,
      p_fetched_at: lead.fetchedAt, p_raw_data: lead.rawData ?? {},
      p_normalized_name: normalized.name, p_normalized_address: normalized.address,
      p_normalized_phone: normalized.phone, p_normalized_email: normalized.email,
      p_normalized_website: normalized.website, p_normalized_domain: normalized.domain,
    }), "upsert_source_record");
    return { id: string(data.id, "source record id"), workspaceId: string(data.workspace_id, "source record workspace id") };
  }
  async findOrganizationCandidates(context: WorkspaceContext, normalized: NormalizedEntityIdentity): Promise<OrganizationCandidate[]> {
    const data = await rpc(this.client, "find_entity_resolution_candidates", {
      p_workspace_id: context.workspaceId, p_actor_user_id: context.actorUserId,
      p_source: normalized.source, p_external_id: normalized.externalId,
      p_normalized_name: normalized.name, p_normalized_address: normalized.address,
      p_normalized_phone: normalized.phone, p_normalized_email: normalized.email,
      p_normalized_domain: normalized.domain, p_latitude: normalized.latitude, p_longitude: normalized.longitude,
    });
    if (!Array.isArray(data)) throw new Error("find_entity_resolution_candidates returned an invalid response");
    return data.map((item) => { const row = object(item, "candidate"); return {
      organizationId: string(row.organization_id, "candidate organization id"), source: optionalString(row.source), externalId: optionalString(row.external_id),
      name: optionalString(row.name), address: optionalString(row.address), phone: optionalString(row.phone), email: optionalString(row.email), website: optionalString(row.website),
      latitude: typeof row.latitude === "number" ? row.latitude : null, longitude: typeof row.longitude === "number" ? row.longitude : null,
    }; });
  }
  async applyResolution(context: WorkspaceContext, command: ApplyResolutionCommand): Promise<AppliedResolution> {
    const data = object(await rpc(this.client, "apply_entity_resolution", {
      p_workspace_id: context.workspaceId, p_actor_user_id: context.actorUserId,
      p_source_record_id: command.sourceRecordId, p_decision: command.decision,
      p_candidate_organization_id: command.candidateOrganizationId,
      p_confidence: command.confidence, p_evidence: command.evidence,
    }), "apply_entity_resolution");
    const decision = string(data.decision, "resolution decision");
    if (decision !== "match" && decision !== "review" && decision !== "create") throw new Error("Unknown resolution decision");
    return { decision, organizationId: optionalString(data.organization_id), reviewId: optionalString(data.review_id) };
  }
}
