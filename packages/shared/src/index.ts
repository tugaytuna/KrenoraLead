import { z } from "zod";

export type LeadStatus =
  | "new"
  | "qualified"
  | "reviewing"
  | "contacted"
  | "interested"
  | "proposal"
  | "won"
  | "lost"
  | "not_relevant";

export type JobStatus = "pending" | "running" | "completed" | "failed";
export type JobType =
  | "discovery"
  | "website_scan"
  | "pagespeed_analysis"
  | "lead_scoring"
  | "ai_analysis"
  | "rescan";

export interface WorkspaceContext {
  workspaceId: string;
  actorUserId: string;
}

export const verticalKeySchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const verticalVersionSchema = z.string().trim().regex(/^\d+\.\d+\.\d+$/);
export const discoverySearchParamsSchema = z.object({
  verticalKey: verticalKeySchema.optional(),
  verticalVersion: verticalVersionSchema.optional(),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(2).max(120),
  minimumRating: z.number().min(1).max(5).optional(),
  minimumReviews: z.number().int().min(0).max(100_000).optional(),
  languageCode: z.string().trim().min(2).max(10).optional(),
  maxPages: z.number().int().min(1).max(3).optional(),
});

export interface DiscoverySearchParams {
  verticalKey?: string;
  verticalVersion?: string;
  country: string;
  city: string;
  district?: string;
  category: string;
  minimumRating?: number;
  minimumReviews?: number;
  languageCode?: string;
  maxPages?: number;
}

export interface SearchIntent {
  source: string;
  query: string;
  country: string;
  city: string;
  district?: string;
  category: string;
  minimumRating?: number;
  minimumReviews?: number;
  languageCode?: string;
  maxPages?: number;
}

export type QualificationDecision = "qualified" | "review" | "excluded";

export interface QualificationResult {
  decision: QualificationDecision;
  reasonCodes: string[];
  confidence: number;
}

export interface RawLead {
  source: string;
  externalId?: string;
  name: string;
  category?: string;
  address?: string;
  country?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  fetchedAt: string;
  rawData?: Record<string, unknown>;
}

export interface ScoreBreakdown {
  businessStrength: number;
  digitalOpportunity: number;
  commercialPotential: number;
  contactability: number;
  total: number;
  version: string;
}

export interface WebsiteSignals {
  reachable: boolean;
  httpsEnabled: boolean;
  performanceScore: number | null;
  seoScore: number | null;
  mobileFriendly: boolean | null;
  ga4Detected: boolean;
  gtmDetected: boolean;
  metaPixelDetected: boolean;
  whatsappDetected: boolean;
  formDetected: boolean;
  cms: string | null;
  scannedAt: string | null;
}

export interface Lead {
  id: string;
  name: string;
  initials: string;
  category: string;
  country: string;
  city: string;
  district: string;
  website: string | null;
  phone: string | null;
  rating: number;
  reviewCount: number;
  status: LeadStatus;
  score: ScoreBreakdown;
  websiteSignals: WebsiteSignals;
  recommendedServices: string[];
  strengths: string[];
  weaknesses: string[];
  aiSummary: string;
  discoveredAt: string;
}

export interface DiscoveryJob {
  id: string;
  title: string;
  location: string;
  status: JobStatus;
  progress: number;
  recordsFound: number;
  createdAt: string;
}
