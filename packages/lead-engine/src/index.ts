import type { RawLead } from "@krenora/shared";

export interface CanonicalLeadInput extends RawLead {
  normalizedName: string;
  normalizedDomain?: string;
  normalizedPhone?: string;
}

export function normalizeBusinessName(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9çğıöşü\s]/g, " ")
    .replace(/\b(ltd|sti|limited|anonim|as|ticaret)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDomain(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.hostname.replace(/^www\./, "").toLocaleLowerCase("en-US");
  } catch {
    return undefined;
  }
}

export function normalizePhone(value?: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return undefined;
  if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+${digits}`;
}

export function normalizeRawLead(lead: RawLead): CanonicalLeadInput {
  return {
    ...lead,
    normalizedName: normalizeBusinessName(lead.name),
    normalizedDomain: normalizeDomain(lead.website),
    normalizedPhone: normalizePhone(lead.phone),
  };
}
