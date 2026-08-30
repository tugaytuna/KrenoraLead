import type { Lead, ScoreBreakdown } from "@krenora/shared";

export interface ScoringProfile {
  key: string;
  version: string;
  weights: {
    businessStrength: number;
    digitalOpportunity: number;
    commercialPotential: number;
    contactability: number;
  };
  rules: {
    excellentRating: { threshold: number; points: number };
    goodRating: { threshold: number; points: number };
    highReviews: { threshold: number; points: number };
    mediumReviews: { threshold: number; points: number };
    baselineActivityPoints: number;
    noWebsiteStrongBusinessPoints: number;
    noWebsiteUnknownBusinessPoints: number;
    poorPerformance: { threshold: number; points: number };
    missingMetaPixelPoints: number;
    missingGtmPoints: number;
    missingWhatsappPoints: number;
    missingFormPoints: number;
    phoneContactPoints: number;
    websiteContactPoints: number;
    baselineContactPoints: number;
  };
}

export const DEFAULT_SCORING_PROFILE: ScoringProfile = {
  key: "generic-local-business",
  version: "1.0.0",
  weights: { businessStrength: 30, digitalOpportunity: 30, commercialPotential: 25, contactability: 15 },
  rules: {
    excellentRating: { threshold: 4.7, points: 10 },
    goodRating: { threshold: 4.3, points: 7 },
    highReviews: { threshold: 200, points: 10 },
    mediumReviews: { threshold: 100, points: 8 },
    baselineActivityPoints: 5,
    noWebsiteStrongBusinessPoints: 12,
    noWebsiteUnknownBusinessPoints: 5,
    poorPerformance: { threshold: 50, points: 5 },
    missingMetaPixelPoints: 3,
    missingGtmPoints: 2,
    missingWhatsappPoints: 2,
    missingFormPoints: 3,
    phoneContactPoints: 8,
    websiteContactPoints: 5,
    baselineContactPoints: 2,
  },
};

export function calculateOpportunityScore(
  lead: Pick<Lead, "rating" | "reviewCount" | "phone" | "website" | "websiteSignals">,
  profile: ScoringProfile = DEFAULT_SCORING_PROFILE,
): ScoreBreakdown {
  const rules = profile.rules;
  const ratingPoints = lead.rating >= rules.excellentRating.threshold
    ? rules.excellentRating.points
    : lead.rating >= rules.goodRating.threshold ? rules.goodRating.points : 4;
  const reviewPoints = lead.reviewCount >= rules.highReviews.threshold
    ? rules.highReviews.points
    : lead.reviewCount >= rules.mediumReviews.threshold ? rules.mediumReviews.points : lead.reviewCount >= 30 ? 5 : 2;
  const businessStrength = Math.min(profile.weights.businessStrength, ratingPoints + reviewPoints + rules.baselineActivityPoints);
  const digitalOpportunity = Math.min(
    profile.weights.digitalOpportunity,
    (!lead.website ? (businessStrength >= 20 ? rules.noWebsiteStrongBusinessPoints : rules.noWebsiteUnknownBusinessPoints) : 0) +
      ((lead.websiteSignals.performanceScore ?? 100) < rules.poorPerformance.threshold ? rules.poorPerformance.points : 0) +
      (!lead.websiteSignals.metaPixelDetected ? rules.missingMetaPixelPoints : 0) +
      (!lead.websiteSignals.gtmDetected ? rules.missingGtmPoints : 0) +
      (!lead.websiteSignals.whatsappDetected ? rules.missingWhatsappPoints : 0) +
      (!lead.websiteSignals.formDetected ? rules.missingFormPoints : 0),
  );
  const commercialPotential = Math.min(
    profile.weights.commercialPotential,
    Math.round((businessStrength / profile.weights.businessStrength) * profile.weights.commercialPotential),
  );
  const contactability = Math.min(
    profile.weights.contactability,
    (lead.phone ? rules.phoneContactPoints : 0) + (lead.website ? rules.websiteContactPoints : 0) + rules.baselineContactPoints,
  );
  return {
    businessStrength,
    digitalOpportunity,
    commercialPotential,
    contactability,
    total: Math.min(100, businessStrength + digitalOpportunity + commercialPotential + contactability),
    version: `${profile.key}@${profile.version}`,
  };
}
