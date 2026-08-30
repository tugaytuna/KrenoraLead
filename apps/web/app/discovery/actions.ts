"use server";

import { createHash } from "node:crypto";
import {
  createSearchJob,
  listEnabledVerticals,
  reserveWorkspaceUsage,
  settleWorkspaceUsage,
} from "@krenora/database";
import { verticalKeySchema } from "@krenora/shared";
import { createDefaultVerticalRegistry } from "@krenora/verticals";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedWorkspace } from "@/lib/workspace";

const discoverySchema = z.object({
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  districts: z.string().transform((value, context) => {
    try {
      const result = z.array(z.string().trim().min(1)).min(1).max(40).safeParse(JSON.parse(value));
      if (result.success) return [...new Set(result.data)];
    } catch {
      // The validation issue below is intentionally generic for the UI.
    }
    context.addIssue({ code: "custom", message: "En az bir ilçe seçin." });
    return z.NEVER;
  }),
  verticalKey: verticalKeySchema,
  minimumRating: z.coerce.number().min(1).max(5),
  minimumReviews: z.coerce.number().int().min(0).max(100_000),
});

export type DiscoveryActionState = {
  success?: boolean;
  message?: string;
  jobIds?: string[];
} | undefined;

export async function createDiscoveryJobs(
  _state: DiscoveryActionState,
  formData: FormData,
): Promise<DiscoveryActionState> {
  const parsed = discoverySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Keşif ayarlarını kontrol edin." };
  }

  const verticals = createDefaultVerticalRegistry();
  let vertical;
  try {
    vertical = verticals.get(parsed.data.verticalKey);
  } catch {
    return { success: false, message: "Seçilen sektör modülü kullanılamıyor." };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: "Demo modunda keşif işi simüle edildi. Supabase yapılandırıldığında worker kuyruğuna yazılacak.",
      jobIds: [`demo-${Date.now()}`],
    };
  }

  try {
    const supabase = await createClient();
    const workspace = await getAuthenticatedWorkspace(supabase);
    if (workspace.role === "viewer") return { success: false, message: "Bu çalışma alanında keşif başlatma yetkiniz yok." };
    const enabled = await listEnabledVerticals(supabase, workspace.context.workspaceId);
    const enabledModule = enabled.find((item) => item.vertical_key === vertical.manifest.key && item.vertical_version === vertical.manifest.version);
    if (!enabledModule) return { success: false, message: "Bu sektör modülü çalışma alanınızda etkin değil." };

    const jobs = [];
    for (const district of parsed.data.districts) {
      const params = {
        country: parsed.data.country,
        city: parsed.data.city,
        district,
        category: vertical.manifest.label,
        verticalKey: vertical.manifest.key,
        verticalVersion: vertical.manifest.version,
        minimumRating: parsed.data.minimumRating,
        minimumReviews: parsed.data.minimumReviews,
        languageCode: "tr",
        maxPages: 1,
      };
      const timeBucket = Math.floor(Date.now() / 300_000);
      const idempotencyKey = createHash("sha256")
        .update(JSON.stringify({ workspaceId: workspace.context.workspaceId, params, timeBucket }))
        .digest("hex");
      const usageKey = `discovery:${idempotencyKey}`;
      const reservation = await reserveWorkspaceUsage(supabase, {
        workspaceId: workspace.context.workspaceId,
        actorUserId: workspace.context.actorUserId,
        meter: "discovery_job",
        quantity: 1,
        idempotencyKey: usageKey,
        verticalKey: vertical.manifest.key,
        metadata: { district },
      });
      if (!reservation) throw new Error("Aylık keşif kotanız doldu.");
      try {
        const job = await createSearchJob(
          supabase,
          workspace.context,
          params,
          {
            manifest: vertical.manifest,
            enrichmentPolicy: vertical.enrichmentPolicy(),
            scoringProfile: vertical.scoringProfile(),
            workspaceConfig: enabledModule.config,
          },
          idempotencyKey,
        );
        await settleWorkspaceUsage(supabase, usageKey, "succeeded");
        jobs.push(job);
      } catch (error) {
        await settleWorkspaceUsage(supabase, usageKey, "released");
        throw error;
      }
    }
    return {
      success: true,
      message: `${jobs.length} bölgesel keşif işi worker kuyruğuna alındı.`,
      jobIds: jobs.map((job) => job.id),
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Keşif işi oluşturulamadı." };
  }
}
