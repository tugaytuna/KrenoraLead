import assert from "node:assert/strict";
import test from "node:test";
import { GooglePlacesApiError, GooglePlacesSource } from "../src/google-places";

test("maps Places Text Search results to RawLead and applies review filter", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ places: [
      { id: "place-1", displayName: { text: "Minik Melekler" }, formattedAddress: "Kadıköy", rating: 4.8, userRatingCount: 180, websiteUri: "https://example.com" },
      { id: "place-2", displayName: { text: "Yeni Okul" }, rating: 4.9, userRatingCount: 5 },
    ] }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const source = new GooglePlacesSource("test-key", fetcher as typeof fetch);
  const leads = await source.search({ source: "google_places", query: "anaokulu", country: "Türkiye", city: "İstanbul", district: "Kadıköy", category: "Anaokulu", minimumReviews: 30 });

  assert.equal(leads.length, 1);
  assert.equal(leads[0]?.externalId, "place-1");
  assert.equal(calls.length, 1);
  assert.match(String(calls[0]?.init?.headers && JSON.stringify(calls[0].init.headers)), /places\.id/);
});

test("marks rate limit responses as retryable", async () => {
  const fetcher = async () => new Response(JSON.stringify({ error: { message: "Quota exceeded" } }), { status: 429 });
  const source = new GooglePlacesSource("test-key", fetcher as typeof fetch);

  await assert.rejects(
    () => source.search({ source: "google_places", query: "anaokulu", country: "Türkiye", city: "İstanbul", category: "Anaokulu" }),
    (error: unknown) => error instanceof GooglePlacesApiError && error.retryable,
  );
});
