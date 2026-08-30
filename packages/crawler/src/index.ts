import type { WebsiteSignals } from "@krenora/shared";

export interface WebsiteScanResult extends Omit<WebsiteSignals, "scannedAt"> {
  url: string;
  httpStatus: number | null;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  h2Count: number;
  canonicalUrl: string | null;
  robotsFound: boolean;
  sitemapFound: boolean;
  schemaFound: boolean;
  localBusinessSchema: boolean;
  phoneCtaDetected: boolean;
  emailCtaDetected: boolean;
  contentFingerprint: string;
  scannedAt: string;
}

export interface WebsiteFetcher {
  fetch(url: string, signal: AbortSignal): Promise<{ status: number; finalUrl: string; body: string }>;
}

export const fetchWebsite: WebsiteFetcher = {
  async fetch(url, signal) {
    const response = await fetch(url, {
      signal,
      redirect: "follow",
      headers: { "user-agent": "KrenoraBot/1.0 (+https://krenora.com/bot)" },
    });
    return { status: response.status, finalUrl: response.url || url, body: await response.text() };
  },
};

const emptySignals = (scannedAt: string): WebsiteSignals => ({
  reachable: false, httpsEnabled: false, performanceScore: null, seoScore: null,
  mobileFriendly: null, ga4Detected: false, gtmDetected: false, metaPixelDetected: false,
  whatsappDetected: false, formDetected: false, cms: null, scannedAt,
});

function decodeEntities(value: string) {
  return value.replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function firstMatch(html: string, pattern: RegExp) {
  return decodeEntities(html.match(pattern)?.[1]?.trim() ?? "") || null;
}

function has(html: string, pattern: RegExp) { return pattern.test(html); }

function fingerprint(html: string) {
  let hash = 2166136261;
  for (const char of html) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function analyzeHomepage(url: string, html: string, options: { httpStatus?: number; scannedAt?: string; finalUrl?: string } = {}): WebsiteScanResult {
  const scannedAt = options.scannedAt ?? new Date().toISOString();
  const lower = html.toLocaleLowerCase("tr-TR");
  const signals = emptySignals(scannedAt);
  const finalUrl = options.finalUrl ?? url;
  const phoneCtaDetected = has(lower, /tel:/);
  const emailCtaDetected = has(lower, /mailto:/);
  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1] ?? "").join(" ");
  const schemaText = `${jsonLd} ${lower}`;
  return {
    ...signals,
    scannedAt,
    url: finalUrl,
    httpStatus: options.httpStatus ?? 200,
    reachable: (options.httpStatus ?? 200) >= 200 && (options.httpStatus ?? 200) < 400,
    httpsEnabled: finalUrl.startsWith("https://"),
    title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    h1Count: (html.match(/<h1\b/gi) ?? []).length,
    h2Count: (html.match(/<h2\b/gi) ?? []).length,
    canonicalUrl: firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    robotsFound: has(lower, /<link[^>]+rel=["'][^"']*robots/) || has(lower, /robots\.txt/),
    sitemapFound: has(lower, /sitemap\.xml/),
    schemaFound: jsonLd.length > 0,
    localBusinessSchema: has(schemaText, /localbusiness|educationalorganization|preschool|school/),
    ga4Detected: has(lower, /googletagmanager\.com\/gtag|gtag\s*\(|google-analytics\.com/),
    gtmDetected: has(lower, /googletagmanager\.com\/gtm\.js|googletagmanager\.com\/ns\.html/),
    metaPixelDetected: has(lower, /connect\.facebook\.net|fbq\s*\(/),
    whatsappDetected: has(lower, /wa\.me\/|api\.whatsapp\.com|whatsapp/),
    formDetected: has(lower, /<form\b/),
    phoneCtaDetected,
    emailCtaDetected,
    cms: has(lower, /wp-content|wordpress/) ? "WordPress" : has(lower, /cdn\.shopify\.com|shopify/) ? "Shopify" : null,
    contentFingerprint: fingerprint(html),
  };
}

export class HomepageCrawler {
  constructor(private readonly fetcher: WebsiteFetcher, private readonly timeoutMs = 15_000) {}

  async scan(url: string): Promise<WebsiteScanResult> {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher.fetch(normalized, controller.signal);
      return analyzeHomepage(normalized, response.body, { httpStatus: response.status, finalUrl: response.finalUrl });
    } finally {
      clearTimeout(timeout);
    }
  }
}
