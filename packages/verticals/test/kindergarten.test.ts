import assert from "node:assert/strict";
import test from "node:test";
import type { VerticalModule } from "../src/index";
import { KindergartenVerticalModule, VerticalRegistry } from "../src/index";
import { DEFAULT_SCORING_PROFILE } from "@krenora/scoring";

test("kindergarten module expands one selection into bounded provider-neutral intents", () => {
  const module = new KindergartenVerticalModule();
  const intents = module.buildSearchIntents({ country: "Türkiye", city: "İstanbul", district: "Kadıköy", category: "Anaokulu" });

  assert.equal(intents.length, 5);
  assert.deepEqual(intents.map((intent) => intent.query), ["anaokulu", "özel anaokulu", "kreş", "gündüz bakımevi", "okul öncesi eğitim kurumu"]);
  assert.ok(intents.every((intent) => intent.source === "google_places" && intent.maxPages === 1));
});

test("kindergarten qualification keeps uncertain leads for review and excludes public institutions", () => {
  const module = new KindergartenVerticalModule();
  const base = { source: "google_places", fetchedAt: new Date().toISOString() };

  assert.equal(module.qualify({ ...base, name: "Özel Minik Melekler Anaokulu", category: "preschool" }).decision, "qualified");
  assert.equal(module.qualify({ ...base, name: "Kadıköy Belediyesi Kreşi", category: "preschool" }).decision, "excluded");
  assert.equal(module.qualify({ ...base, name: "Mutlu Çocuklar", category: "point_of_interest" }).decision, "review");
});

test("vertical registry resolves modules by stable key and version", () => {
  const module = new KindergartenVerticalModule();
  const registry = new VerticalRegistry([module]);

  assert.equal(registry.get("kindergarten"), module);
  assert.equal(registry.get("kindergarten", "1.0.0"), module);
  assert.throws(() => registry.get("dental-clinic"), /Dikey modül bulunamadı/);
});

test("a future sector can be registered without changing the registry or existing module", () => {
  const dentalModule: VerticalModule = {
    manifest: { key: "dental-clinic", version: "1.0.0", label: "Diş Kliniği", locale: "tr-TR", supportedSources: ["google_places"], defaults: {} },
    buildSearchIntents: (input) => [{ source: "google_places", query: "diş kliniği", category: "Diş Kliniği", country: input.country, city: input.city }],
    qualify: () => ({ decision: "review", reasonCodes: ["fixture"], confidence: 0.5 }),
    enrichmentPolicy: () => ({ prioritySignals: ["appointment_cta"], maximumWebsitePages: 5 }),
    scoringProfile: () => ({ ...structuredClone(DEFAULT_SCORING_PROFILE), key: "dental-clinic", version: "1.0.0" }),
  };
  const registry = new VerticalRegistry([new KindergartenVerticalModule(), dentalModule]);

  assert.equal(registry.get("dental-clinic"), dentalModule);
  assert.equal(registry.get("kindergarten").manifest.version, "1.0.0");
});
