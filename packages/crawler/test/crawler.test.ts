import test from "node:test";
import assert from "node:assert/strict";
import { HomepageCrawler, analyzeHomepage } from "../src/index";

test("homepage analysis extracts kindergarten enrichment signals deterministically", () => {
  const result = analyzeHomepage("https://example.test", `
    <html><head><title>Minik Dünya Anaokulu</title>
    <meta name="description" content="Okul tanıtımı &amp; kayıt bilgileri">
    <link rel="canonical" href="https://example.test/">
    <script type="application/ld+json">{"@type":"EducationalOrganization"}</script>
    <script src="https://www.googletagmanager.com/gtag/js"></script></head>
    <body><h1>Anaokulu</h1><h2>İletişim</h2><a href="tel:+90555">Ara</a><a href="https://wa.me/90555">WhatsApp</a><form></form></body></html>
  `, { scannedAt: "2026-08-30T10:00:00.000Z" });
  assert.equal(result.reachable, true);
  assert.equal(result.title, "Minik Dünya Anaokulu");
  assert.equal(result.metaDescription, "Okul tanıtımı & kayıt bilgileri");
  assert.equal(result.h1Count, 1);
  assert.equal(result.localBusinessSchema, true);
  assert.equal(result.ga4Detected, true);
  assert.equal(result.phoneCtaDetected, true);
  assert.equal(result.whatsappDetected, true);
  assert.equal(result.formDetected, true);
});

test("crawler normalizes URLs, forwards abort signal and preserves redirect URL", async () => {
  let seenUrl = "";
  let seenSignal: AbortSignal | undefined;
  const crawler = new HomepageCrawler({
    async fetch(url, signal) { seenUrl = url; seenSignal = signal; return { status: 200, finalUrl: "https://final.test/", body: "<title>Site</title>" }; },
  });
  const result = await crawler.scan("example.test");
  assert.equal(seenUrl, "https://example.test");
  assert.ok(seenSignal);
  assert.equal(result.url, "https://final.test/");
});
