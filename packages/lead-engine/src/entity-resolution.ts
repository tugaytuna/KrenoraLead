import type { RawLead } from "@krenora/shared";
import { normalizeBusinessName, normalizeDomain, normalizePhone } from "./index";

export interface EntityIdentity {
  source?: string | null;
  externalId?: string | null;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface NormalizedEntityIdentity {
  source: string | null;
  externalId: string | null;
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  domain: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type MatchDecision = "match" | "review" | "no_match";
export type MatchEvidence = "source_external_id" | "source_external_id_conflict" | "domain" | "phone" | "email" | "name_address" | "name_geo" | "name_only";
export interface EntityMatchResult { decision: MatchDecision; confidence: number; evidence: MatchEvidence[] }

function comparableText(value: string): string {
  const map: Record<string, string> = { "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g", "ş": "s", "Ş": "s", "ç": "c", "Ç": "c", "ö": "o", "Ö": "o", "ü": "u", "Ü": "u" };
  return [...value].map((character) => map[character] ?? character).join("")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " ve ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function normalizeAddress(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  return comparableText(value)
    .replace(/\b(mahallesi|mah)\b/g, "mh")
    .replace(/\b(caddesi|cad)\b/g, "cd")
    .replace(/\b(sokagi|sokak|sok)\b/g, "sk")
    .replace(/\b(numara|no)\b/g, " ")
    .replace(/\s+/g, " ").trim() || undefined;
}

export function normalizeEmail(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : undefined;
}

export function normalizeWebsite(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return undefined;
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";
    if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
    if (url.pathname === "/") url.pathname = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export function normalizeEntityIdentity(identity: EntityIdentity): NormalizedEntityIdentity {
  return {
    source: identity.source?.trim().toLowerCase() || null,
    externalId: identity.externalId?.trim() || null,
    name: identity.name?.trim() ? normalizeBusinessName(identity.name) || null : null,
    address: normalizeAddress(identity.address) ?? null,
    phone: normalizePhone(identity.phone ?? undefined) ?? null,
    email: normalizeEmail(identity.email) ?? null,
    website: normalizeWebsite(identity.website) ?? null,
    domain: normalizeDomain(identity.website ?? undefined) ?? null,
    latitude: identity.latitude ?? null,
    longitude: identity.longitude ?? null,
  };
}

function same(left: string | null, right: string | null) { return left !== null && right !== null && left === right; }

function distanceInMeters(left: NormalizedEntityIdentity, right: NormalizedEntityIdentity): number | null {
  if (left.latitude === null || left.longitude === null || right.latitude === null || right.longitude === null) return null;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(left.latitude)) * Math.cos(radians(right.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function evaluateEntityMatch(incoming: EntityIdentity, candidate: EntityIdentity): EntityMatchResult {
  const left = normalizeEntityIdentity(incoming);
  const right = normalizeEntityIdentity(candidate);
  const evidence: MatchEvidence[] = [];
  const sameSource = same(left.source, right.source);
  if (sameSource && same(left.externalId, right.externalId)) return { decision: "match", confidence: 1, evidence: ["source_external_id"] };
  const externalIdConflict = sameSource && left.externalId !== null && right.externalId !== null && left.externalId !== right.externalId;
  if (externalIdConflict) evidence.push("source_external_id_conflict");
  if (same(left.domain, right.domain)) evidence.push("domain");
  if (same(left.phone, right.phone)) evidence.push("phone");
  if (same(left.email, right.email)) evidence.push("email");
  const sameName = same(left.name, right.name);
  if (sameName && same(left.address, right.address)) evidence.push("name_address");
  const distance = distanceInMeters(left, right);
  if (sameName && distance !== null && distance <= 100) evidence.push("name_geo");
  if (sameName && !evidence.includes("name_address") && !evidence.includes("name_geo")) evidence.push("name_only");
  if (externalIdConflict) {
    const strong = evidence.includes("domain") || evidence.includes("phone");
    return { decision: strong ? "review" : "no_match", confidence: strong ? 0.7 : 0, evidence };
  }
  if (evidence.includes("domain")) return { decision: "match", confidence: 0.98, evidence };
  if (evidence.includes("phone")) return { decision: "match", confidence: 0.96, evidence };
  const mediumCount = (["email", "name_address", "name_geo"] as MatchEvidence[]).filter((item) => evidence.includes(item)).length;
  if (mediumCount >= 2) return { decision: "match", confidence: 0.9, evidence };
  if (mediumCount === 1) return { decision: "review", confidence: 0.72, evidence };
  return { decision: "no_match", confidence: evidence.includes("name_only") ? 0.25 : 0, evidence };
}

export function identityFromRawLead(lead: RawLead): EntityIdentity {
  return { source: lead.source, externalId: lead.externalId, name: lead.name, address: lead.address, phone: lead.phone, email: lead.email, website: lead.website, latitude: lead.latitude, longitude: lead.longitude };
}
