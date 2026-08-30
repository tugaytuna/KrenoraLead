import { listOrganizationAggregates } from "@krenora/database";
import type { Lead, LeadStatus } from "@krenora/shared";
import { leads as demoLeads } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedWorkspace } from "@/lib/workspace";

const validStatuses = new Set<LeadStatus>([
  "new", "qualified", "reviewing", "contacted", "interested",
  "proposal", "won", "lost", "not_relevant",
]);

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("tr");
}

export async function getLeads(): Promise<Lead[]> {
  if (!isSupabaseConfigured()) return demoLeads;

  const supabase = await createClient();
  const workspace = await getAuthenticatedWorkspace(supabase);
  const aggregates = await listOrganizationAggregates(supabase, { workspaceId: workspace.context.workspaceId });

  return aggregates.map(({ organization, latestScore, latestScan, latestAnalysis }) => {
    const status = validStatuses.has(organization.status as LeadStatus)
      ? organization.status as LeadStatus
      : "new";
    const recommendedServices = stringArray(latestAnalysis?.recommended_services);

    return {
      id: organization.id,
      name: organization.name,
      initials: initials(organization.name),
      category: organization.category ?? "Kategorisiz",
      country: organization.country ?? "—",
      city: organization.city ?? "—",
      district: organization.district ?? "—",
      website: organization.website,
      phone: organization.phone,
      rating: organization.google_rating ?? 0,
      reviewCount: organization.google_review_count ?? 0,
      status,
      score: {
        businessStrength: latestScore?.business_strength_score ?? 0,
        digitalOpportunity: latestScore?.digital_opportunity_score ?? 0,
        commercialPotential: latestScore?.commercial_potential_score ?? 0,
        contactability: latestScore?.contactability_score ?? 0,
        total: latestScore?.total_score ?? 0,
        version: latestScore?.score_version ?? "unscored",
      },
      websiteSignals: {
        reachable: Boolean(latestScan?.http_status && latestScan.http_status < 500),
        httpsEnabled: latestScan?.https_enabled ?? false,
        performanceScore: latestScan?.performance_score ?? null,
        seoScore: latestScan?.seo_score ?? null,
        mobileFriendly: null,
        ga4Detected: latestScan?.ga4_detected ?? false,
        gtmDetected: latestScan?.gtm_detected ?? false,
        metaPixelDetected: latestScan?.meta_pixel_detected ?? false,
        whatsappDetected: latestScan?.whatsapp_detected ?? false,
        formDetected: latestScan?.form_detected ?? false,
        cms: latestScan?.cms ?? null,
        scannedAt: latestScan?.scanned_at ?? null,
      },
      recommendedServices,
      strengths: stringArray(latestAnalysis?.strengths),
      weaknesses: stringArray(latestAnalysis?.weaknesses),
      aiSummary: latestAnalysis?.summary ?? "AI analizi henüz oluşturulmadı.",
      discoveredAt: organization.discovered_at,
    };
  });
}
