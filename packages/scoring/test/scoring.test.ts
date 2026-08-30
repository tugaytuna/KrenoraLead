import assert from "node:assert/strict";
import test from "node:test";
import { calculateOpportunityScore, DEFAULT_SCORING_PROFILE } from "../src/index";

const lead = {
  rating: 4.8,
  reviewCount: 180,
  phone: "+902165551234",
  website: "https://example.com",
  websiteSignals: {
    reachable: true, httpsEnabled: true, performanceScore: 38, seoScore: 40, mobileFriendly: false,
    ga4Detected: true, gtmDetected: false, metaPixelDetected: false, whatsappDetected: false,
    formDetected: false, cms: null, scannedAt: null,
  },
};

test("generic engine executes a supplied vertical profile without category branches", () => {
  const profile = structuredClone(DEFAULT_SCORING_PROFILE);
  profile.key = "kindergarten";
  profile.rules.missingFormPoints = 6;
  const generic = calculateOpportunityScore(lead);
  const kindergarten = calculateOpportunityScore(lead, profile);

  assert.ok(kindergarten.digitalOpportunity > generic.digitalOpportunity);
  assert.equal(kindergarten.version, "kindergarten@1.0.0");
});
