import type { QualificationResult, RawLead, SearchIntent } from "@krenora/shared";
import { DEFAULT_SCORING_PROFILE, type ScoringProfile } from "@krenora/scoring";
import type {
  EnrichmentPolicy,
  VerticalManifest,
  VerticalModule,
} from "../contracts";

const queries = [
  "anaokulu",
  "özel anaokulu",
  "kreş",
  "gündüz bakımevi",
  "okul öncesi eğitim kurumu",
] as const;

const positiveSignals = ["anaokul", "kreş", "kres", "gündüz bakımevi", "gunduz bakimevi", "okul öncesi", "okul oncesi", "preschool", "nursery"];
const publicSignals = ["devlet anaokulu", "belediye anaokulu", "belediyesi kreş", "belediyesi kres"];
const providerCategories = new Set(["preschool", "child_care_agency", "school", "primary_school"]);

function searchableText(lead: RawLead) {
  return `${lead.name} ${lead.category ?? ""} ${lead.address ?? ""}`.toLocaleLowerCase("tr-TR");
}

export class KindergartenVerticalModule implements VerticalModule {
  readonly manifest: VerticalManifest = {
    key: "kindergarten",
    version: "1.0.0",
    label: "Anaokulu",
    locale: "tr-TR",
    supportedSources: ["google_places"],
    defaults: { minimumRating: 4.2, minimumReviews: 30 },
  };

  buildSearchIntents(input: Parameters<VerticalModule["buildSearchIntents"]>[0]): SearchIntent[] {
    const minimumRating = input.minimumRating ?? this.manifest.defaults.minimumRating;
    const minimumReviews = input.minimumReviews ?? this.manifest.defaults.minimumReviews;
    return queries.map((query) => ({
      source: "google_places",
      query,
      country: input.country,
      city: input.city,
      district: input.district,
      category: this.manifest.label,
      minimumRating,
      minimumReviews,
      languageCode: input.languageCode ?? "tr",
      maxPages: 1,
    }));
  }

  qualify(lead: RawLead): QualificationResult {
    const text = searchableText(lead);
    if (publicSignals.some((signal) => text.includes(signal))) {
      return { decision: "excluded", reasonCodes: ["public_institution"], confidence: 0.95 };
    }

    const hasTextEvidence = positiveSignals.some((signal) => text.includes(signal));
    const hasProviderEvidence = lead.category ? providerCategories.has(lead.category) : false;
    if (hasTextEvidence && hasProviderEvidence) {
      return { decision: "qualified", reasonCodes: ["name_or_address_match", "provider_category_match"], confidence: 0.95 };
    }
    if (hasTextEvidence || hasProviderEvidence) {
      return { decision: "qualified", reasonCodes: [hasTextEvidence ? "name_or_address_match" : "provider_category_match"], confidence: 0.8 };
    }
    return { decision: "review", reasonCodes: ["insufficient_vertical_evidence"], confidence: 0.4 };
  }

  enrichmentPolicy(): EnrichmentPolicy {
    return {
      maximumWebsitePages: 5,
      prioritySignals: [
        "enrollment_cta",
        "school_tour_cta",
        "phone_cta",
        "whatsapp",
        "mobile_performance",
        "educational_organization_schema",
        "analytics_tags",
      ],
    };
  }

  scoringProfile(): ScoringProfile {
    const profile = structuredClone(DEFAULT_SCORING_PROFILE);
    profile.key = this.manifest.key;
    profile.version = this.manifest.version;
    profile.rules.noWebsiteStrongBusinessPoints = 14;
    profile.rules.missingWhatsappPoints = 3;
    profile.rules.missingFormPoints = 6;
    return profile;
  }
}

export const kindergartenVertical = new KindergartenVerticalModule();
