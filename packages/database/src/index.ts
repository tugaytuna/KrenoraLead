import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiscoverySearchParams, RawLead, WorkspaceContext } from "@krenora/shared";
import { calculateOpportunityScore, type ScoringProfile } from "@krenora/scoring";

export * from "./entity-resolution-ingestion";
export * from "./entity-resolution-service";
export * from "./supabase-entity-resolution-repository";

export interface SearchJobRow {
  id: string;
  user_id: string;
  workspace_id: string;
  requested_by: string | null;
  source: string;
  country: string;
  city: string;
  district: string | null;
  category: string;
  filters: Record<string, unknown>;
  vertical_key: string;
  vertical_version: string;
  input: Record<string, unknown>;
  module_snapshot: Record<string, unknown>;
  idempotency_key: string | null;
  status: "pending" | "running" | "completed" | "failed";
  records_found: number;
  records_created: number;
  records_updated: number;
  duplicates_found: number;
  progress: number;
  intents_attempted: number;
  intents_succeeded: number;
  intents_failed: number;
  qualified_count: number;
  review_count: number;
  excluded_count: number;
  provider_request_count: number;
  attempt_count: number;
  error_message: string | null;
  available_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersistableLeadInput extends RawLead {
  normalizedName: string;
  normalizedDomain?: string;
  normalizedPhone?: string;
}

export interface IngestionMetrics {
  found: number;
  created: number;
  updated: number;
  duplicates: number;
}

export interface WorkspaceAccess {
  context: WorkspaceContext;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
}

export async function resolveWorkspaceContext(
  client: SupabaseClient,
  actorUserId: string,
  requestedWorkspaceId?: string,
): Promise<WorkspaceAccess> {
  let query = client
    .from("workspace_members")
    .select("workspace_id,role,workspaces!inner(name)")
    .eq("user_id", actorUserId)
    .eq("status", "active")
    .limit(1);
  if (requestedWorkspaceId) query = query.eq("workspace_id", requestedWorkspaceId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Çalışma alanı çözümlenemedi: ${error.message}`);
  if (!data) throw new Error("Erişilebilir çalışma alanı bulunamadı.");
  const workspace = data.workspaces as unknown as { name: string };
  return {
    context: { workspaceId: data.workspace_id as string, actorUserId },
    name: workspace.name,
    role: data.role as WorkspaceAccess["role"],
  };
}

export async function listEnabledVerticals(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client
    .from("workspace_verticals")
    .select("vertical_key,vertical_version,config")
    .eq("workspace_id", workspaceId)
    .eq("enabled", true)
    .order("vertical_key");
  if (error) throw new Error(`Sektör modülleri yüklenemedi: ${error.message}`);
  return (data ?? []) as Array<{ vertical_key: string; vertical_version: string; config: Record<string, unknown> }>;
}

export async function reserveWorkspaceUsage(
  client: SupabaseClient,
  input: {
    workspaceId: string;
    actorUserId?: string;
    meter: "discovery_job" | "provider_request";
    quantity: number;
    idempotencyKey: string;
    verticalKey?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const { data, error } = await client.rpc("reserve_workspace_usage", {
    target_workspace_id: input.workspaceId,
    target_requested_by: input.actorUserId ?? null,
    target_meter: input.meter,
    target_quantity: input.quantity,
    target_idempotency_key: input.idempotencyKey,
    target_vertical_key: input.verticalKey ?? null,
    target_source: input.source ?? null,
    target_metadata: input.metadata ?? {},
  });
  if (error) throw new Error(`Kullanım kotası ayrılamadı: ${error.message}`);
  return typeof data === "string" ? data : null;
}

export async function settleWorkspaceUsage(
  client: SupabaseClient,
  idempotencyKey: string,
  outcome: "succeeded" | "failed" | "released",
  quantity?: number,
) {
  const { error } = await client.rpc("settle_workspace_usage", {
    target_idempotency_key: idempotencyKey,
    target_outcome: outcome,
    target_quantity: quantity ?? null,
  });
  if (error) throw new Error(`Kullanım kaydı sonuçlandırılamadı: ${error.message}`);
}

export async function createSearchJob(
  client: SupabaseClient,
  context: WorkspaceContext,
  params: DiscoverySearchParams,
  moduleSnapshot: Record<string, unknown>,
  idempotencyKey: string,
  source = "google_places",
): Promise<SearchJobRow> {
  const insertPayload = {
      user_id: context.actorUserId,
      workspace_id: context.workspaceId,
      requested_by: context.actorUserId,
      source,
      country: params.country,
      city: params.city,
      district: params.district ?? null,
      category: params.category,
      vertical_key: params.verticalKey,
      vertical_version: params.verticalVersion,
      input: params,
      module_snapshot: moduleSnapshot,
      idempotency_key: idempotencyKey,
      filters: {
        verticalKey: params.verticalKey,
        verticalVersion: params.verticalVersion,
        minimumRating: params.minimumRating,
        minimumReviews: params.minimumReviews,
        languageCode: params.languageCode ?? "tr",
        maxPages: params.maxPages ?? 3,
      },
    };
  const { data, error } = await client
    .from("search_jobs")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error?.code === "23505") {
    const { data: existing, error: existingError } = await client
      .from("search_jobs")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .eq("idempotency_key", idempotencyKey)
      .single();
    if (existingError) throw new Error(`Mevcut keşif işi okunamadı: ${existingError.message}`);
    return existing as unknown as SearchJobRow;
  }
  if (error) throw new Error(`Keşif işi oluşturulamadı: ${error.message}`);
  return data as unknown as SearchJobRow;
}

export async function claimNextSearchJob(client: SupabaseClient): Promise<SearchJobRow | null> {
  const { data, error } = await client.rpc("claim_next_search_job");
  if (error) throw new Error(`Keşif işi sahiplenilemedi: ${error.message}`);
  return ((data as unknown as SearchJobRow[] | null)?.[0]) ?? null;
}

export async function listRecentSearchJobs(client: SupabaseClient, workspaceId: string, limit = 6) {
  const { data, error } = await client
    .from("search_jobs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));
  if (error) throw new Error(`Keşif işleri yüklenemedi: ${error.message}`);
  return (data ?? []) as unknown as SearchJobRow[];
}

export async function getWorkspaceUsageSummary(client: SupabaseClient, workspaceId: string) {
  const { data: subscription, error: subscriptionError } = await client
    .from("workspace_subscriptions")
    .select("plan_key,entitlements,current_period_start,current_period_end")
    .eq("workspace_id", workspaceId)
    .single();
  if (subscriptionError) throw new Error(`Abonelik bilgisi yüklenemedi: ${subscriptionError.message}`);
  const { data: usage, error: usageError } = await client
    .from("usage_events")
    .select("meter,quantity,outcome")
    .eq("workspace_id", workspaceId)
    .gte("created_at", subscription.current_period_start)
    .lt("created_at", subscription.current_period_end)
    .in("outcome", ["reserved", "succeeded", "failed"]);
  if (usageError) throw new Error(`Kullanım bilgisi yüklenemedi: ${usageError.message}`);
  const totals = (usage ?? []).reduce<Record<string, number>>((result, event) => {
    result[event.meter] = (result[event.meter] ?? 0) + event.quantity;
    return result;
  }, {});
  const entitlements = subscription.entitlements as Record<string, number>;
  return {
    planKey: subscription.plan_key as string,
    discoveryJobs: { used: totals.discovery_job ?? 0, limit: entitlements.discovery_jobs_monthly ?? 0 },
    providerRequests: { used: totals.provider_request ?? 0, limit: entitlements.provider_requests_monthly ?? 0 },
    periodEnd: subscription.current_period_end as string,
  };
}

export async function completeSearchJob(
  client: SupabaseClient,
  jobId: string,
  metrics: IngestionMetrics & {
    intentsAttempted?: number;
    intentsSucceeded?: number;
    intentsFailed?: number;
    qualified?: number;
    review?: number;
    excluded?: number;
  },
) {
  const { error } = await client.from("search_jobs").update({
    status: "completed",
    progress: 100,
    records_found: metrics.found,
    records_created: metrics.created,
    records_updated: metrics.updated,
    duplicates_found: metrics.duplicates,
    intents_attempted: metrics.intentsAttempted ?? 0,
    intents_succeeded: metrics.intentsSucceeded ?? 0,
    intents_failed: metrics.intentsFailed ?? 0,
    qualified_count: metrics.qualified ?? 0,
    review_count: metrics.review ?? 0,
    excluded_count: metrics.excluded ?? 0,
    provider_request_count: metrics.intentsAttempted ?? 0,
    completed_at: new Date().toISOString(),
    error_message: null,
  }).eq("id", jobId);
  if (error) throw new Error(`Keşif işi tamamlanamadı: ${error.message}`);
}

export async function failSearchJob(
  client: SupabaseClient,
  job: SearchJobRow,
  message: string,
  retryable: boolean,
) {
  const shouldRetry = retryable && job.attempt_count < 3;
  const retryDelaySeconds = Math.min(job.attempt_count * 30, 120);
  const { error } = await client.from("search_jobs").update({
    status: shouldRetry ? "pending" : "failed",
    available_at: shouldRetry
      ? new Date(Date.now() + retryDelaySeconds * 1_000).toISOString()
      : job.available_at,
    error_message: message.slice(0, 1_000),
    completed_at: shouldRetry ? null : new Date().toISOString(),
  }).eq("id", job.id);
  if (error) throw new Error(`Keşif işi hata durumu yazılamadı: ${error.message}`);
}

/** @deprecated Worker flows should use ingestDiscoveredLeadsWithResolution. */
export async function ingestDiscoveredLeads(
  client: SupabaseClient,
  context: WorkspaceContext,
  leads: PersistableLeadInput[],
): Promise<IngestionMetrics> {
  const validLeads = leads.filter((lead): lead is PersistableLeadInput & { externalId: string } => Boolean(lead.externalId));
  if (validLeads.length === 0) return { found: leads.length, created: 0, updated: 0, duplicates: 0 };
  const sourceName = validLeads[0]!.source;
  if (validLeads.some((lead) => lead.source !== sourceName)) {
    throw new Error("Tek bir ingestion işlemi birden fazla veri kaynağı içeremez.");
  }

  const placeIds = [...new Set(validLeads.map((lead) => lead.externalId))];
  const { data: existingRows, error: existingError } = await client
    .from("organizations")
    .select("google_place_id")
    .eq("workspace_id", context.workspaceId)
    .in("google_place_id", placeIds);
  if (existingError) throw new Error(`Mevcut lead kayıtları okunamadı: ${existingError.message}`);
  const existingIds = new Set((existingRows ?? []).map((row) => row.google_place_id as string));

  const { error: sourceInsertError } = await client.from("source_records").upsert(
    validLeads.map((lead) => ({
      user_id: context.actorUserId,
      workspace_id: context.workspaceId,
      source: lead.source,
      external_id: lead.externalId,
      raw_data: lead.rawData ?? {},
      fetched_at: lead.fetchedAt,
    })),
    { onConflict: "workspace_id,source,external_id", ignoreDuplicates: true },
  );
  if (sourceInsertError) throw new Error(`Kaynak kayıtları yazılamadı: ${sourceInsertError.message}`);

  const { data: organizations, error: organizationError } = await client.from("organizations").upsert(
    validLeads.map((lead) => ({
      user_id: context.actorUserId,
      workspace_id: context.workspaceId,
      name: lead.name,
      normalized_name: lead.normalizedName,
      category: lead.category ?? null,
      country: lead.country ?? null,
      city: lead.city ?? null,
      district: lead.district ?? null,
      address: lead.address ?? null,
      latitude: lead.latitude ?? null,
      longitude: lead.longitude ?? null,
      phone: lead.normalizedPhone ?? lead.phone ?? null,
      email: lead.email ?? null,
      website: lead.website ?? null,
      google_place_id: lead.externalId,
      google_rating: lead.rating ?? null,
      google_review_count: lead.reviewCount ?? null,
    })),
    { onConflict: "workspace_id,google_place_id" },
  ).select("id,google_place_id");
  if (organizationError) throw new Error(`Lead kayıtları yazılamadı: ${organizationError.message}`);

  const leadByExternalId = new Map(validLeads.map((lead) => [lead.externalId, lead]));
  const verticalRows = (organizations ?? []).flatMap((organization) => {
    const lead = leadByExternalId.get(organization.google_place_id as string);
    const vertical = lead?.rawData?.vertical as {
      key?: string;
      version?: string;
      decision?: "qualified" | "review" | "excluded";
      reasonCodes?: string[];
      confidence?: number;
    } | undefined;
    if (!vertical?.key || !vertical.version || !vertical.decision || typeof vertical.confidence !== "number") return [];
    return [{
      workspace_id: context.workspaceId,
      organization_id: organization.id,
      vertical_key: vertical.key,
      vertical_version: vertical.version,
      decision: vertical.decision,
      reason_codes: vertical.reasonCodes ?? [],
      confidence: vertical.confidence,
    }];
  });
  if (verticalRows.length > 0) {
    const { error: verticalError } = await client.from("organization_verticals").upsert(verticalRows, {
      onConflict: "workspace_id,organization_id,vertical_key",
    });
    if (verticalError) throw new Error(`Sektör sınıflandırmaları yazılamadı: ${verticalError.message}`);
  }

  const { data: sourceRecords, error: sourceReadError } = await client
    .from("source_records")
    .select("id,external_id")
    .eq("workspace_id", context.workspaceId)
    .eq("source", sourceName)
    .in("external_id", placeIds);
  if (sourceReadError) throw new Error(`Kaynak bağlantıları okunamadı: ${sourceReadError.message}`);

  const sourceByExternalId = new Map((sourceRecords ?? []).map((row) => [row.external_id as string, row.id as string]));
  const links = (organizations ?? []).flatMap((organization) => {
    const sourceRecordId = sourceByExternalId.get(organization.google_place_id as string);
    return sourceRecordId ? [{
      user_id: context.actorUserId,
      workspace_id: context.workspaceId,
      organization_id: organization.id,
      source_record_id: sourceRecordId,
      match_confidence: 1,
      match_reason: "google_place_id",
    }] : [];
  });
  if (links.length > 0) {
    const { error: linkError } = await client.from("organization_sources").upsert(links, {
      onConflict: "organization_id,source_record_id",
      ignoreDuplicates: true,
    });
    if (linkError) throw new Error(`Lead kaynak bağlantıları yazılamadı: ${linkError.message}`);
  }

  const duplicates = placeIds.filter((id) => existingIds.has(id)).length;
  return {
    found: leads.length,
    created: placeIds.length - duplicates,
    updated: duplicates,
    duplicates,
  };
}

export interface WebsiteEnrichmentResult {
  url: string;
  httpStatus: number | null;
  httpsEnabled: boolean;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  h2Count: number;
  canonicalUrl: string | null;
  robotsFound: boolean;
  sitemapFound: boolean;
  schemaFound: boolean;
  localBusinessSchema: boolean;
  ga4Detected: boolean;
  gtmDetected: boolean;
  metaPixelDetected: boolean;
  whatsappDetected: boolean;
  phoneCtaDetected: boolean;
  formDetected: boolean;
  emailCtaDetected: boolean;
  cms: string | null;
  contentFingerprint: string;
  performanceScore: number | null;
  seoScore: number | null;
  scannedAt: string;
}

export async function enrichAndScoreOrganizations(
  client: SupabaseClient,
  context: WorkspaceContext,
  leads: PersistableLeadInput[],
  profile: ScoringProfile,
  scan: (url: string) => Promise<WebsiteEnrichmentResult>,
) {
  const warnings: string[] = [];
  let scanned = 0;
  let scored = 0;
  const websiteLeads = leads.filter((lead) => Boolean(lead.externalId && lead.website));
  if (websiteLeads.length === 0) return { scanned, scored, warnings };
  const ids = [...new Set(websiteLeads.map((lead) => lead.externalId!))];
  const { data: organizations, error: organizationError } = await client
    .from("organizations")
    .select("id,google_place_id,name,google_rating,google_review_count,phone,website")
    .eq("workspace_id", context.workspaceId)
    .in("google_place_id", ids);
  if (organizationError) throw new Error(`Website taraması için lead'ler okunamadı: ${organizationError.message}`);
  const byPlaceId = new Map((organizations ?? []).map((organization) => [organization.google_place_id as string, organization]));
  for (const lead of websiteLeads) {
    const organization = byPlaceId.get(lead.externalId!);
    if (!organization || !lead.website) continue;
    try {
      const result = await scan(lead.website);
      const websiteSignals = {
        reachable: result.httpStatus !== null && result.httpStatus >= 200 && result.httpStatus < 400,
        httpsEnabled: result.httpsEnabled,
        performanceScore: result.performanceScore,
        seoScore: result.seoScore,
        mobileFriendly: null,
        ga4Detected: result.ga4Detected,
        gtmDetected: result.gtmDetected,
        metaPixelDetected: result.metaPixelDetected,
        whatsappDetected: result.whatsappDetected,
        formDetected: result.formDetected,
        cms: result.cms,
        scannedAt: result.scannedAt,
      };
      const { data: scanRow, error: scanError } = await client.from("website_scans").insert({
        user_id: context.actorUserId,
        workspace_id: context.workspaceId,
        organization_id: organization.id,
        url: result.url,
        http_status: result.httpStatus,
        https_enabled: result.httpsEnabled,
        title: result.title,
        meta_description: result.metaDescription,
        h1_count: result.h1Count,
        h2_count: result.h2Count,
        canonical_url: result.canonicalUrl,
        robots_found: result.robotsFound,
        sitemap_found: result.sitemapFound,
        schema_found: result.schemaFound,
        local_business_schema: result.localBusinessSchema,
        ga4_detected: result.ga4Detected,
        gtm_detected: result.gtmDetected,
        meta_pixel_detected: result.metaPixelDetected,
        whatsapp_detected: result.whatsappDetected,
        phone_cta_detected: result.phoneCtaDetected,
        form_detected: result.formDetected,
        email_cta_detected: result.emailCtaDetected,
        cms: result.cms,
        scan_status: "completed",
        content_fingerprint: result.contentFingerprint,
        scanned_at: result.scannedAt,
      }).select("id").single();
      if (scanError) throw new Error(scanError.message);
      const score = calculateOpportunityScore({
        rating: organization.google_rating ?? 0,
        reviewCount: organization.google_review_count ?? 0,
        phone: organization.phone,
        website: organization.website,
        websiteSignals,
      }, profile);
      const { error: scoreError } = await client.from("lead_scores").insert({
        user_id: context.actorUserId,
        workspace_id: context.workspaceId,
        organization_id: organization.id,
        business_strength_score: score.businessStrength,
        digital_opportunity_score: score.digitalOpportunity,
        commercial_potential_score: score.commercialPotential,
        contactability_score: score.contactability,
        total_score: score.total,
        score_version: score.version,
        score_input: { profile, websiteSignals, websiteScanId: scanRow.id },
      });
      if (scoreError) throw new Error(scoreError.message);
      scanned += 1;
      scored += 1;
    } catch (error) {
      warnings.push(`${lead.name}: ${error instanceof Error ? error.message : "website taraması başarısız"}`);
    }
  }
  return { scanned, scored, warnings };
}

export interface OrganizationRow {
  id: string;
  workspace_id: string;
  name: string;
  normalized_name: string;
  category: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  status: string;
  discovered_at: string;
}

export interface LeadScoreRow {
  organization_id: string;
  business_strength_score: number;
  digital_opportunity_score: number;
  commercial_potential_score: number;
  contactability_score: number;
  total_score: number;
  score_version: string;
  created_at: string;
}

export interface WebsiteScanRow {
  organization_id: string;
  url: string;
  http_status: number | null;
  https_enabled: boolean | null;
  ga4_detected: boolean | null;
  gtm_detected: boolean | null;
  meta_pixel_detected: boolean | null;
  whatsapp_detected: boolean | null;
  form_detected: boolean | null;
  cms: string | null;
  performance_score: number | null;
  seo_score: number | null;
  scanned_at: string | null;
  created_at: string;
}

export interface AiAnalysisRow {
  organization_id: string;
  summary: string;
  strengths: unknown;
  weaknesses: unknown;
  recommended_services: unknown;
  created_at: string;
}

export interface OrganizationAggregate {
  organization: OrganizationRow;
  latestScore: LeadScoreRow | null;
  latestScan: WebsiteScanRow | null;
  latestAnalysis: AiAnalysisRow | null;
}

function newestByOrganization<T extends { organization_id: string; created_at: string }>(rows: T[]) {
  return rows.reduce<Map<string, T>>((map, row) => {
    const existing = map.get(row.organization_id);
    if (!existing || row.created_at > existing.created_at) map.set(row.organization_id, row);
    return map;
  }, new Map());
}

export async function listOrganizationAggregates(
  client: SupabaseClient,
  options: { workspaceId: string; limit?: number },
): Promise<OrganizationAggregate[]> {
  const limit = Math.min(options.limit ?? 250, 1000);
  const { data, error } = await client
    .from("organizations")
    .select("id,workspace_id,name,normalized_name,category,country,city,district,phone,website,google_rating,google_review_count,status,discovered_at")
    .eq("workspace_id", options.workspaceId)
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Organizasyonlar yüklenemedi: ${error.message}`);
  const organizations = (data ?? []) as unknown as OrganizationRow[];
  if (organizations.length === 0) return [];

  const ids = organizations.map((organization) => organization.id);
  const [scoresResult, scansResult, analysesResult] = await Promise.all([
    client.from("lead_scores").select("organization_id,business_strength_score,digital_opportunity_score,commercial_potential_score,contactability_score,total_score,score_version,created_at").in("organization_id", ids).order("created_at", { ascending: false }),
    client.from("website_scans").select("organization_id,url,http_status,https_enabled,ga4_detected,gtm_detected,meta_pixel_detected,whatsapp_detected,form_detected,cms,performance_score,seo_score,scanned_at,created_at").in("organization_id", ids).order("created_at", { ascending: false }),
    client.from("ai_analyses").select("organization_id,summary,strengths,weaknesses,recommended_services,created_at").in("organization_id", ids).order("created_at", { ascending: false }),
  ]);

  if (scoresResult.error) throw new Error(`Lead skorları yüklenemedi: ${scoresResult.error.message}`);
  if (scansResult.error) throw new Error(`Website taramaları yüklenemedi: ${scansResult.error.message}`);
  if (analysesResult.error) throw new Error(`AI analizleri yüklenemedi: ${analysesResult.error.message}`);

  const scores = newestByOrganization((scoresResult.data ?? []) as unknown as LeadScoreRow[]);
  const scans = newestByOrganization((scansResult.data ?? []) as unknown as WebsiteScanRow[]);
  const analyses = newestByOrganization((analysesResult.data ?? []) as unknown as AiAnalysisRow[]);

  return organizations.map((organization) => ({
    organization,
    latestScore: scores.get(organization.id) ?? null,
    latestScan: scans.get(organization.id) ?? null,
    latestAnalysis: analyses.get(organization.id) ?? null,
  }));
}
