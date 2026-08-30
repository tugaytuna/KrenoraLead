# Lead Intelligence Platform — Codex Instructions

## 1. Project Mission

This project is a B2B Lead Intelligence Platform.

Its purpose is to discover local businesses from multiple data sources, enrich those businesses with public digital data, analyze their online presence, calculate an opportunity score, and help identify companies that are strong businesses but weak in digital marketing.

The product must NOT simply find "bad businesses".

The ideal lead is:

- a legitimate and active business,
- has real customer demand,
- has positive reputation signals,
- but has weaknesses in website, SEO, advertising, analytics, conversion infrastructure, or digital visibility.

Example:

A business with:

- Google rating: 4.8
- 180 reviews
- active Instagram account
- outdated website
- poor mobile performance
- weak SEO
- no Meta Pixel
- weak conversion tracking

should receive a high opportunity score.

The main product question is:

> "Which businesses are commercially healthy but digitally underserved?"

---

# 2. Core Product Flow

The main flow is:

User selects:

- Country
- City
- District
- Business category
- Optional filters

Example:

Turkey → Istanbul → Kadıköy → Kindergarten

Then:

Search Sources  
↓  
Raw Businesses  
↓  
Normalization  
↓  
Duplicate Resolution  
↓  
Business Database  
↓  
Website Discovery  
↓  
Website Crawl  
↓  
Technical Analysis  
↓  
Digital Presence Analysis  
↓  
Lead Scoring  
↓  
AI Opportunity Analysis  
↓  
Lead Explorer UI

---

# 3. Technology Stack

Use the following default stack unless there is a strong technical reason to change it.

## Frontend

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- React Query / TanStack Query where useful

## Backend

Initially use Next.js server-side APIs for synchronous operations.

Long-running operations MUST NOT run inside normal frontend request handlers.

Long-running operations include:

- crawling websites,
- analyzing multiple businesses,
- PageSpeed tests,
- batch AI analysis,
- large lead imports.

These tasks belong in the worker application.

## Database

Use:

- PostgreSQL
- Supabase

Supabase will initially provide:

- PostgreSQL
- authentication
- database API
- storage if needed

## Background Jobs

Worker application:

- Node.js
- TypeScript

For V1 a database-backed job architecture is acceptable.

When concurrency requirements increase use:

- Redis
- BullMQ

Do not introduce Redis before it is actually needed.

## Crawling

Use:

- HTTP fetch when possible
- Cheerio for HTML parsing
- Playwright only when JavaScript rendering is required

Avoid launching Playwright unnecessarily.

## Performance Analysis

Use:

- Google PageSpeed Insights API

Metrics may include:

- Performance Score
- Accessibility
- Best Practices
- SEO
- Core Web Vitals where available

## AI

Use OpenAI API.

AI should analyze structured extracted data.

Do NOT send entire raw websites to the AI unless absolutely necessary.

Correct flow:

Website  
→ deterministic extraction  
→ structured JSON  
→ scoring engine  
→ AI interpretation

---

# 4. Architecture Principles

Follow these principles.

## Modular Monolith First

Do not start with microservices.

Use a monorepo.

Suggested structure:

apps/
  web/
  worker/

packages/
  database/
  crawler/
  lead-engine/
  scoring/
  sources/
  ai/
  shared/

---

# 5. Data Sources

Every lead source must implement a common adapter interface.

Example:

```ts
interface LeadSource {
  search(params: SearchParams): Promise<RawLead[]>;
}
```

Potential sources:

- Google Places
- approved business directories
- CSV upload
- manual lead entry
- future external APIs

Example adapters:

GooglePlacesSource  
CsvLeadSource  
ManualLeadSource  
DirectorySource

Do not tightly couple lead discovery logic to Google Places.

The system must allow additional sources later.

---

# 6. Google Places Rules

Use official Google Places APIs.

Do NOT implement Google Maps browser scraping.

Do NOT build Playwright automation that:

- opens Google Maps,
- scrolls results,
- extracts businesses,
- scrapes reviews.

Google Places should be treated as one lead source adapter.

Store Google Place ID whenever available.

Use Place ID as one deduplication signal.

Request only fields required by the application.

Avoid unnecessary API calls.

---

# 7. Business Entity Resolution

The same organization can appear in multiple sources.

Example:

Google Places:
"Minik Melekler Anaokulu"

Directory:
"Özel Minik Melekler Anaokulu"

CSV:
"Minik Melekler Çocuk Evi"

These may represent one organization.

Entity resolution should use signals such as:

1. exact domain
2. phone number
3. Google Place ID
4. normalized business name
5. email
6. address similarity
7. geographic proximity

Never merge organizations using business name alone.

Store source records separately from canonical organizations.

Recommended model:

source_records  
→ entity resolution  
→ organizations

This allows future reprocessing.

---

# 8. Crawler Rules

The crawler should collect deterministic signals.

Example fields:

## Basic Website

- website reachable
- HTTPS
- HTTP status
- redirects
- canonical
- robots.txt
- sitemap.xml

## SEO

- page title
- title length
- meta description
- meta description length
- H1 count
- H2 count
- canonical URL
- indexability
- OpenGraph
- schema markup
- LocalBusiness schema
- Organization schema

## Analytics

Detect where technically possible:

- GA4
- Google Tag Manager
- Meta Pixel
- TikTok Pixel
- LinkedIn Insight Tag

Detection must be described as:

"detected" / "not detected"

Never claim with certainty that a company does not advertise simply because a tracking script was not detected.

## Conversion Infrastructure

Detect:

- phone CTA
- WhatsApp
- forms
- appointment links
- email links
- sticky CTA
- contact page

## Technology

Detect where possible:

- WordPress
- Elementor
- Shopify
- Wix
- Webflow
- Next.js
- other CMS signals

## Content

Detect:

- blog presence
- recent posts when reasonably discoverable
- services pages
- about page
- contact page

Crawler results must be saved independently from AI analysis.

---

# 9. AI Usage Rules

AI does NOT control the raw opportunity score.

The numeric opportunity score should primarily come from deterministic rules.

AI is responsible for:

- summarizing the opportunity,
- explaining weaknesses,
- recommending services,
- generating sales insights,
- identifying notable patterns,
- creating human-readable summaries.

AI inputs should resemble:

```json
{
  "business": {
    "rating": 4.8,
    "reviewCount": 183,
    "category": "kindergarten"
  },
  "website": {
    "performance": 41,
    "seoScore": 32,
    "metaPixelDetected": false,
    "ga4Detected": true,
    "whatsappDetected": false
  }
}
```

AI output should be structured JSON.

Example:

```json
{
  "summary": "...",
  "strengths": [],
  "weaknesses": [],
  "recommendedServices": [],
  "salesAngle": "...",
  "confidence": 0.86
}
```

Validate AI outputs with a schema.

Do not trust free-form AI output directly in business logic.

---

# 10. Opportunity Score Philosophy

The system should distinguish:

Business Quality

from

Digital Maturity

and

Commercial Opportunity.

A strong lead often looks like:

High Business Quality  
+  
Low/Medium Digital Maturity  
=  
High Opportunity

Do NOT simply calculate:

Bad website = good lead.

A business with:

- no reviews,
- no visible activity,
- no website,
- no reputation,
- no contact information

may actually be a low-quality lead.

---

# 11. Initial Score Categories

Use these conceptual score groups:

Business Strength: 0–30

Digital Weakness Opportunity: 0–30

Commercial Potential: 0–25

Contactability: 0–15

Total:

0–100

Scores must remain configurable.

Never hardcode all score weights throughout application code.

Store scoring configuration centrally.

---

# 12. Initial Database Entities

At minimum implement:

organizations

source_records

organization_sources

website_scans

technology_detections

digital_signals

lead_scores

ai_analyses

contacts

activities

search_jobs

crawl_jobs

analysis_jobs

users

---

# 13. Organization Fields

Suggested organization fields:

id  
name  
normalized_name  
category  
subcategory  
country  
city  
district  
address  
latitude  
longitude  
phone  
email  
website  
google_place_id  
google_rating  
google_review_count  
status  
created_at  
updated_at

---

# 14. Website Scan Fields

Suggested fields:

id  
organization_id  
url  
http_status  
https_enabled  
title  
meta_description  
h1_count  
h2_count  
canonical_url  
robots_found  
sitemap_found  
schema_found  
local_business_schema  
ga4_detected  
gtm_detected  
meta_pixel_detected  
tiktok_pixel_detected  
linkedin_tag_detected  
whatsapp_detected  
phone_cta_detected  
form_detected  
email_cta_detected  
cms  
performance_score  
seo_score  
accessibility_score  
best_practices_score  
scan_status  
scanned_at

---

# 15. Lead Score Fields

lead_scores:

id  
organization_id  

business_strength_score  
digital_opportunity_score  
commercial_potential_score  
contactability_score  

total_score  

score_version  

created_at

Scoring must support versioning.

If scoring weights change later, old scores should remain reproducible.

---

# 16. Search Jobs

Discovery searches should be represented as jobs.

Example:

Country:  
Turkey

City:  
Istanbul

District:  
Kadıköy

Category:  
Kindergarten

Source:  
Google Places

Search job should track:

pending  
running  
completed  
failed

and metrics:

records_found  
records_created  
records_updated  
duplicates_found

---

# 17. Worker Responsibilities

Worker handles:

lead discovery  
website crawling  
PageSpeed analysis  
AI analysis  
batch scoring  
periodic rescanning

Frontend must NOT wait synchronously for large jobs.

UI should show job progress.

Example:

Businesses found: 120  
Websites discovered: 94  
Scanned: 61  
Analysis completed: 45

---

# 18. Lead Explorer

Primary application screen is Lead Explorer.

Filters:

country  
city  
district  
category  
source  
rating  
review count  
website availability  
score range  
website performance  
technology  
tracking detections  
status

Sorting:

opportunity score  
review count  
rating  
website score  
date discovered

---

# 19. Lead Detail Page

Lead detail should show:

Business Overview

Google / Reputation Signals

Website Analysis

SEO

Performance

Technology

Tracking

Conversion Infrastructure

Opportunity Score

AI Analysis

Recommended Services

Sales Notes

Activity History

Source History

---

# 20. Lead Lifecycle

Support simple CRM states:

new  
qualified  
reviewing  
contacted  
interested  
proposal  
won  
lost  
not_relevant

Do not build a full CRM in V1.

---

# 21. Security

API keys must remain server-side.

Never expose:

Google API keys with unrestricted access  
OpenAI secrets  
Supabase service role key

Use environment variables.

Validate all user inputs.

Protect crawler endpoints.

Apply rate limiting where needed.

---

# 22. Cost Awareness

External calls have cost.

Before adding any external API call consider:

Can the information be cached?

Has this organization already been analyzed?

Has the website changed?

Is the field actually necessary?

Avoid repeated PageSpeed calls.

Avoid repeated AI analysis if underlying scan data has not changed.

---

# 23. Logging

Important jobs must be observable.

Log:

job id  
organization id  
source  
duration  
status  
error  
retry count

Avoid logging secrets.

---

# 24. Error Handling

A single failed website must never terminate a batch job.

Example:

100 organizations

3 unreachable websites

Result:

97 successful  
3 failed

not:

entire job failed.

Failures should be retryable.

---

# 25. Development Rules

When implementing features:

1. inspect the existing architecture first
2. reuse existing packages when possible
3. avoid duplicated business logic
4. use strict TypeScript
5. validate external input
6. use shared schemas
7. maintain clear separation between discovery, crawling, scoring and AI
8. add migrations for database changes
9. avoid premature abstraction
10. avoid unnecessary dependencies

---

# 26. MVP Goal

The MVP is successful when a user can:

select a location  
+  
select a business category  
+  
discover organizations  
+  
automatically analyze their websites  
+  
calculate an opportunity score  
+  
inspect ranked leads

Everything else is secondary.

The first MVP should prioritize reliable lead discovery and useful scoring over advanced CRM features.
