import assert from "node:assert/strict";
import test from "node:test";
import { evaluateEntityMatch, normalizeAddress, normalizeEmail, normalizeWebsite } from "../src/index";

test("normalizes additional identity fields", () => {
  assert.equal(normalizeAddress("Caferağa Mahallesi, Moda Caddesi No: 12"), "caferaga mh moda cd 12");
  assert.equal(normalizeEmail(" INFO@Example.COM "), "info@example.com");
  assert.equal(normalizeEmail("invalid"), undefined);
  assert.equal(normalizeWebsite("Example.com/"), "https://example.com");
});

test("matches provider identity and strong normalized signals", () => {
  assert.equal(evaluateEntityMatch(
    { source: "google_places", externalId: "place-1" },
    { source: "google_places", externalId: "place-1" },
  ).confidence, 1);
  assert.equal(evaluateEntityMatch(
    { website: "https://www.example.com/about" },
    { website: "http://example.com/contact" },
  ).decision, "match");
  assert.equal(evaluateEntityMatch(
    { phone: "0532 123 45 67" },
    { phone: "+90 (532) 123-4567" },
  ).decision, "match");
});

test("never auto-merges on business name alone", () => {
  const result = evaluateEntityMatch(
    { name: "Minik Melekler Anaokulu", address: "Kadıköy" },
    { name: "Minik Melekler Anaokulu", address: "Beşiktaş" },
  );
  assert.equal(result.decision, "no_match");
  assert.deepEqual(result.evidence, ["name_only"]);
});

test("requires review when provider IDs conflict despite a shared domain", () => {
  const result = evaluateEntityMatch(
    { source: "google_places", externalId: "place-1", website: "example.com" },
    { source: "google_places", externalId: "place-2", website: "example.com" },
  );
  assert.equal(result.decision, "review");
  assert.ok(result.evidence.includes("source_external_id_conflict"));
});
