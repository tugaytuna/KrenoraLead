import assert from "node:assert/strict";
import test from "node:test";
import type { RawLead } from "@krenora/shared";
import type { LeadSource } from "@krenora/sources";
import { KindergartenVerticalModule, VerticalRegistry } from "@krenora/verticals";
import { DiscoveryExecutionError, DiscoveryOrchestrator, SourceRegistry } from "../src/index";

const fetchedAt = new Date().toISOString();
const normalize = (lead: RawLead) => ({ ...lead, normalizedName: lead.name.toLocaleLowerCase("tr-TR") });

test("orchestrator coordinates vertical and source ports, deduplicates and preserves review leads", async () => {
  const source: LeadSource = {
    name: "google_places",
    async search(intent) {
      return [
        { source: this.name, externalId: "place-1", name: "Özel Minik Melekler Anaokulu", category: "preschool", fetchedAt },
        { source: this.name, externalId: "place-1", name: "Özel Minik Melekler", category: "preschool", fetchedAt },
        { source: this.name, externalId: `review-${intent.query}`, name: "Mutlu Çocuklar", category: "point_of_interest", fetchedAt },
        { source: this.name, externalId: `public-${intent.query}`, name: "Kadıköy Belediyesi Kreşi", category: "preschool", fetchedAt },
      ];
    },
  };
  let ingested: RawLead[] = [];
  const usageOutcomes: string[] = [];
  const orchestrator = new DiscoveryOrchestrator({
    verticals: new VerticalRegistry([new KindergartenVerticalModule()]),
    sources: new SourceRegistry([source]),
    normalize,
    repository: {
      async ingest(_workspace, leads) {
        ingested = leads;
        return { found: leads.length, created: leads.length, updated: 0, duplicates: 0 };
      },
    },
    usage: {
      async beforeProviderRequest(_job, intent) { usageOutcomes.push(`reserved:${intent.query}`); },
      async afterProviderRequest(_job, intent, _index, outcome) { usageOutcomes.push(`${outcome}:${intent.query}`); },
    },
  });

  const result = await orchestrator.execute({
    id: "job-1",
    workspace: { workspaceId: "workspace-1", actorUserId: "user-1" },
    verticalKey: "kindergarten",
    input: { country: "Türkiye", city: "İstanbul", district: "Kadıköy", category: "Anaokulu" },
  });

  assert.equal(result.intentsAttempted, 5);
  assert.equal(result.intentsSucceeded, 5);
  assert.equal(result.excluded, 5);
  assert.equal(ingested.length, 6);
  assert.equal(usageOutcomes.filter((item) => item.startsWith("reserved:")).length, 5);
  assert.equal(usageOutcomes.filter((item) => item.startsWith("succeeded:")).length, 5);
  assert.equal((ingested[0]?.rawData?.vertical as { key?: string })?.key, "kindergarten");
});

test("orchestrator marks an all-retryable source failure as retryable", async () => {
  const error = Object.assign(new Error("rate limit"), { retryable: true });
  const source: LeadSource = { name: "google_places", async search() { throw error; } };
  const orchestrator = new DiscoveryOrchestrator({
    verticals: new VerticalRegistry([new KindergartenVerticalModule()]),
    sources: new SourceRegistry([source]),
    normalize,
    repository: { async ingest() { return { found: 0, created: 0, updated: 0, duplicates: 0 }; } },
  });

  await assert.rejects(
    () => orchestrator.execute({ id: "job-2", workspace: { workspaceId: "workspace-1", actorUserId: "user-1" }, verticalKey: "kindergarten", input: { country: "Türkiye", city: "İstanbul", category: "Anaokulu" } }),
    (caught: unknown) => caught instanceof DiscoveryExecutionError && caught.retryable,
  );
});
