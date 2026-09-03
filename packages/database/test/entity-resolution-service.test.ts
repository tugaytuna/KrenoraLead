import assert from "node:assert/strict";
import test from "node:test";
import type { RawLead, WorkspaceContext } from "@krenora/shared";
import { ingestRawLead, type AppliedResolution, type ApplyResolutionCommand, type EntityResolutionRepository, type OrganizationCandidate } from "../src/entity-resolution-service";

const context: WorkspaceContext = { workspaceId: "workspace-1", actorUserId: "user-1" };
const lead: RawLead = { source: "google_places", externalId: "place-new", name: "Minik Melekler Anaokulu", address: "Moda Caddesi No 10", phone: "0532 123 45 67", website: "https://minik.example", fetchedAt: "2026-09-01T08:00:00.000Z" };

class FakeRepository implements EntityResolutionRepository {
  applied: ApplyResolutionCommand | null = null;
  constructor(private readonly candidates: OrganizationCandidate[]) {}
  async assertWorkspaceAccess(received: WorkspaceContext) { assert.deepEqual(received, context); }
  async upsertSourceRecord() { return { id: "source-1", workspaceId: context.workspaceId }; }
  async findOrganizationCandidates() { return this.candidates; }
  async applyResolution(_context: WorkspaceContext, command: ApplyResolutionCommand): Promise<AppliedResolution> {
    this.applied = command;
    return { decision: command.decision, organizationId: command.decision === "review" ? null : command.candidateOrganizationId ?? "organization-new", reviewId: command.decision === "review" ? "review-1" : null };
  }
}

test("links exactly one strong candidate", async () => {
  const repository = new FakeRepository([{ organizationId: "organization-1", website: "http://www.minik.example/contact" }]);
  const result = await ingestRawLead(context, lead, repository);
  assert.equal(result.decision, "match");
  assert.equal(result.organizationId, "organization-1");
});

test("creates when only a business name matches", async () => {
  const repository = new FakeRepository([{ organizationId: "organization-1", name: lead.name, address: "Beşiktaş" }]);
  const result = await ingestRawLead(context, { ...lead, phone: undefined, website: undefined }, repository);
  assert.equal(result.decision, "create");
  assert.deepEqual(repository.applied?.evidence, ["no_viable_candidate"]);
});

test("queues review for ambiguous strong matches", async () => {
  const repository = new FakeRepository([
    { organizationId: "organization-1", website: lead.website },
    { organizationId: "organization-2", phone: "+905321234567" },
  ]);
  const result = await ingestRawLead(context, lead, repository);
  assert.equal(result.decision, "review");
  assert.ok(repository.applied?.evidence.includes("ambiguous_candidates"));
});

test("queues review for one medium signal", async () => {
  const repository = new FakeRepository([{ organizationId: "organization-1", name: lead.name, address: "Moda Cad. 10" }]);
  const result = await ingestRawLead(context, { ...lead, phone: undefined, website: undefined }, repository);
  assert.equal(result.decision, "review");
});
