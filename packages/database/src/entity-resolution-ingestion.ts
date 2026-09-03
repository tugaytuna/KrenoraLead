import type { SupabaseClient } from "@supabase/supabase-js";
import type { RawLead, WorkspaceContext } from "@krenora/shared";
import { ingestRawLead } from "./entity-resolution-service";
import { SupabaseEntityResolutionRepository, type SupabaseRpcClient } from "./supabase-entity-resolution-repository";

export interface ResolutionIngestionMetrics { found: number; created: number; updated: number; duplicates: number }

export async function ingestDiscoveredLeadsWithResolution(
  client: SupabaseClient,
  context: WorkspaceContext,
  leads: RawLead[],
): Promise<ResolutionIngestionMetrics> {
  const repository = new SupabaseEntityResolutionRepository(client as unknown as SupabaseRpcClient);
  let created = 0;
  let updated = 0;
  let duplicates = 0;
  for (const lead of leads) {
    const result = await ingestRawLead(context, lead, repository);
    if (result.decision === "create") created += 1;
    if (result.decision === "match") { updated += 1; duplicates += 1; }
    const vertical = lead.rawData?.vertical as { key?: string; version?: string; decision?: "qualified" | "review" | "excluded"; reasonCodes?: string[]; confidence?: number } | undefined;
    if (result.organizationId && vertical?.key && vertical.version && vertical.decision && typeof vertical.confidence === "number") {
      const { error } = await client.from("organization_verticals").upsert({
        workspace_id: context.workspaceId, organization_id: result.organizationId,
        vertical_key: vertical.key, vertical_version: vertical.version,
        decision: vertical.decision, reason_codes: vertical.reasonCodes ?? [], confidence: vertical.confidence,
      }, { onConflict: "workspace_id,organization_id,vertical_key" });
      if (error) throw new Error(`Sektör sınıflandırması yazılamadı: ${error.message}`);
    }
  }
  return { found: leads.length, created, updated, duplicates };
}
