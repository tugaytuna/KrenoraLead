import type { RawLead, SearchIntent } from "@krenora/shared";
import type { LeadSource } from "./index";

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.primaryType",
  "nextPageToken",
].join(",");

interface GooglePlace {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
}

interface TextSearchResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
  error?: { code?: number; message?: string; status?: string };
}

export class GooglePlacesApiError extends Error {
  constructor(message: string, readonly statusCode: number, readonly retryable: boolean) {
    super(message);
    this.name = "GooglePlacesApiError";
  }
}

export class GooglePlacesSource implements LeadSource {
  readonly name = "google_places";

  constructor(
    private readonly apiKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is required");
  }

  async search(intent: SearchIntent): Promise<RawLead[]> {
    const maxPages = Math.min(Math.max(intent.maxPages ?? 3, 1), 3);
    const baseBody = {
      textQuery: [intent.query, intent.district, intent.city, intent.country].filter(Boolean).join(" in "),
      pageSize: 20,
      languageCode: intent.languageCode ?? "tr",
      ...(intent.minimumRating ? { minRating: intent.minimumRating } : {}),
    };
    const results: RawLead[] = [];
    let pageToken: string | undefined;

    for (let page = 0; page < maxPages; page += 1) {
      const response = await this.fetcher(SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify({ ...baseBody, ...(pageToken ? { pageToken } : {}) }),
        signal: AbortSignal.timeout(15_000),
      });

      const payload = await response.json() as TextSearchResponse;
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        throw new GooglePlacesApiError(payload.error?.message ?? `Places API request failed (${response.status})`, response.status, retryable);
      }

      const fetchedAt = new Date().toISOString();
      const pageLeads = (payload.places ?? [])
        .filter((place) => place.id && place.displayName?.text)
        .filter((place) => !intent.minimumReviews || (place.userRatingCount ?? 0) >= intent.minimumReviews)
        .map((place): RawLead => ({
          source: this.name,
          externalId: place.id,
          name: place.displayName!.text!,
          category: place.primaryType ?? intent.category,
          address: place.formattedAddress,
          country: intent.country,
          city: intent.city,
          district: intent.district,
          latitude: place.location?.latitude,
          longitude: place.location?.longitude,
          phone: place.nationalPhoneNumber,
          website: place.websiteUri,
          rating: place.rating,
          reviewCount: place.userRatingCount,
          fetchedAt,
          rawData: {
            placeId: place.id,
            displayNameLanguage: place.displayName?.languageCode,
            primaryType: place.primaryType,
          },
        }));

      results.push(...pageLeads);
      pageToken = payload.nextPageToken;
      if (!pageToken) break;
    }

    return results;
  }
}
