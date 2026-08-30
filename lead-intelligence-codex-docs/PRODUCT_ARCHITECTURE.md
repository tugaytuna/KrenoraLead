# Lead Intelligence Platform
## Product & Technical Architecture

# Product Objective

The platform helps sales and marketing teams identify businesses with high commercial potential but weak digital infrastructure.

The platform combines:

Business discovery

Data enrichment

Website intelligence

SEO analysis

Tracking detection

Conversion analysis

Lead scoring

AI interpretation

into a single searchable interface.

---

# Modular SaaS and Vertical Architecture

Krenora is a workspace-based SaaS modular monolith. Generic platform capabilities must remain independent from industry-specific discovery and qualification behavior.

Selecting a category resolves a versioned vertical module. For example, selecting `Anaokulu` resolves `kindergarten@1.0.0`, which supplies search intents, qualification rules, enrichment priorities and a scoring profile. The module must not directly call Supabase or Google Places; provider adapters and repositories remain behind shared ports.

The approved detailed design, tenancy migration, SOLID boundaries and phased implementation plan live in [MODULAR_SAAS_ARCHITECTURE.md](./MODULAR_SAAS_ARCHITECTURE.md).

---

# Main Use Case

Example user request:

> Find kindergartens in Kadıköy with a Google rating above 4.2, at least 30 reviews, and weak digital infrastructure.

The platform should:

1. discover businesses,
2. normalize them,
3. remove duplicates,
4. find websites,
5. scan websites,
6. extract technical signals,
7. calculate scores,
8. rank opportunities,
9. explain why each company is a potential lead.

---

# System Architecture

```text
                         USER
                           │
                           ▼
                    NEXT.JS WEB APP
                           │
               ┌───────────┴───────────┐
               │                       │
               ▼                       ▼
          SEARCH API               LEAD API
               │
               ▼
          SEARCH JOB
               │
               ▼
        SOURCE ADAPTERS
               │
       ┌───────┼─────────┐
       ▼       ▼         ▼
 Google Places CSV    Directory
       │
       └───────┬─────────┘
               ▼
          RAW RECORDS
               │
               ▼
       NORMALIZATION
               │
               ▼
      ENTITY RESOLUTION
               │
               ▼
         ORGANIZATIONS
               │
               ▼
          JOB QUEUE
               │
      ┌────────┼────────────┐
      ▼        ▼            ▼
   Crawler  PageSpeed      Enrichment
      │        │            │
      └────────┼────────────┘
               ▼
        DIGITAL SIGNALS
               │
               ▼
        SCORING ENGINE
               │
               ▼
          AI ANALYSIS
               │
               ▼
          LEAD EXPLORER
```

---

# Application Layers

## apps/web

Responsibilities:

authentication  
dashboard  
lead explorer  
lead detail  
search configuration  
filters  
job monitoring  
CRM status  
notes

Web should not perform heavy crawling.

---

## apps/worker

Responsibilities:

discovery jobs  
website crawling  
PageSpeed calls  
batch processing  
AI analysis  
scheduled rescans  
retry handling

---

# Shared Packages

## packages/database

Contains:

database client  
database types  
repositories  
queries

Do not scatter raw database logic across applications.

---

## packages/sources

Contains lead source adapters.

Example:

sources/
  google-places/
  csv/
  manual/

Each source returns normalized RawLead objects.

---

## packages/crawler

Contains:

URL normalization  
HTTP fetch  
HTML extraction  
Playwright fallback  
technology detection  
analytics detection  
conversion detection  
SEO extraction

---

## packages/scoring

Contains:

scoring configuration  
scoring rules  
score calculation  
score versioning

Must not depend on UI.

---

## packages/ai

Contains:

OpenAI client  
prompt templates  
response schemas  
opportunity analyzer

AI output must be validated.

---

## packages/lead-engine

Coordinates:

raw records  
normalization  
deduplication  
enrichment  
analysis pipeline

---

# Discovery Pipeline

Example query:

```json
{
  "country": "Turkey",
  "city": "Istanbul",
  "district": "Kadıköy",
  "category": "kindergarten"
}
```

Flow:

Create SearchJob

→ send to configured Source

→ receive RawLead[]

→ save source records

→ normalize phones / URLs / names / addresses

→ entity resolution

→ create or update canonical organizations

→ enqueue enrichment jobs.

---

# Raw Lead Model

A source result should initially be preserved.

Suggested:

```ts
type RawLead = {
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

  rawData?: Record<string, unknown>;
};
```

Raw source data should not directly become canonical organization data without normalization.

---

# Entity Resolution

Deduplication hierarchy:

Strong signals:

domain exact match  
phone exact match  
Google Place ID

Medium signals:

email match  
business name + same district  
business name + address similarity

Weak signals:

name similarity only

Weak signals must not automatically merge organizations.

When confidence is uncertain, preserve separate entities.

Future feature:

manual merge.

---

# Website Analysis Pipeline

Website URL  
↓  
Normalize URL  
↓  
HTTP request  
↓  
If HTML usable:  
Cheerio  
↓  
If page requires JS:  
Playwright  
↓  
Extract signals  
↓  
PageSpeed API  
↓  
Save WebsiteScan  
↓  
Calculate Digital Score

---

# Website Crawl Limits

V1 should normally analyze:

Homepage

Optionally:

Contact page  
About page  
Services page  
Blog index

Do not crawl hundreds of pages.

Primary objective is lead qualification, not building a search engine.

Suggested maximum:

5 pages per website in V1.

---

# Website Signals

## Presence

website exists  
website reachable  
HTTPS  
redirects

## Search Optimization

title  
description  
H1  
canonical  
robots  
sitemap  
schema  
LocalBusiness schema

## Conversion

phone link  
email link  
WhatsApp link  
form  
appointment link  
primary CTA

## Marketing Infrastructure

GA4  
GTM  
Meta Pixel  
TikTok Pixel  
LinkedIn Insight Tag

## Technology

CMS  
framework  
page builder

## Performance

PageSpeed performance  
accessibility  
SEO  
best practices

---

# Lead Scoring

Lead score is NOT equal to website quality.

The scoring engine must reward business strength while identifying digital weakness.

Example:

Business A

Google rating: 4.9  
Reviews: 220  
Website score: 38  
Tracking: weak

Potential:

Very high.

Business B

Google rating: 3.1  
Reviews: 6  
No website  
No phone

Potential:

Low or medium.

---

# Score Formula

Initial conceptual allocation:

Business Strength:  
30 points

Digital Opportunity:  
30 points

Commercial Potential:  
25 points

Contactability:  
15 points

Total:  
100 points

---

# Example Business Strength Rules

Rating >= 4.7  
+10

Rating >= 4.3  
+7

Review count >= 200  
+10

Review count >= 100  
+8

Review count >= 30  
+5

Business appears active  
+5

---

# Example Digital Opportunity Rules

No website  
+variable score

Poor performance  
+5

Missing meta description  
+2

No H1  
+2

No structured data  
+2

Meta Pixel not detected  
+3

GTM not detected  
+2

No strong conversion CTA  
+3

No WhatsApp where relevant  
+2

These are initial rules only.

Scoring configuration must be editable without changing dozens of source files.

---

# Important Scoring Logic

"No website" should not automatically produce maximum opportunity.

Use business strength.

Example:

Strong business + no website  
→ very high opportunity

Unknown business + no website  
→ uncertain opportunity.

---

# AI Opportunity Analysis

AI receives:

business information  
reputation signals  
website signals  
score breakdown

AI produces:

executive summary  
strengths  
weaknesses  
recommended services  
sales angle  
confidence

Example:

```json
{
  "summary": "The business has strong local reputation but weak conversion infrastructure.",
  "strengths": [
    "High Google rating",
    "Strong review volume"
  ],
  "weaknesses": [
    "Low website performance",
    "No Meta Pixel detected",
    "Weak mobile CTA"
  ],
  "recommendedServices": [
    "Website redesign",
    "Local SEO",
    "Meta Ads",
    "Conversion tracking"
  ],
  "salesAngle": "Their strong offline reputation is not fully supported by their website.",
  "confidence": 0.9
}
```

---

# Main Screens

## Dashboard

Metrics:

Total organizations

New leads

High opportunity leads

Scans completed

Jobs running

Average opportunity score

---

# Lead Explorer

Table columns:

Business

Category

District

Rating

Reviews

Website

Website Performance

Opportunity Score

Status

Recommended Services

Filters should be URL-state driven when practical.

---

# Lead Detail

Sections:

Overview

Reputation

Website

SEO

Performance

Analytics & Advertising Technology

Conversion

AI Analysis

Recommended Services

Source Data

Activity

---

# Search Screen

Inputs:

Country

City

District

Category

Source

Optional:

minimum rating  
minimum reviews  
website required  
maximum existing digital maturity

Button:

Find Businesses

After search:

display progress.

---

# Job Processing

Job types:

DISCOVERY

WEBSITE_SCAN

PAGESPEED_ANALYSIS

LEAD_SCORING

AI_ANALYSIS

RESCAN

Job lifecycle:

pending  
running  
completed  
failed

Store:

started_at  
completed_at  
error  
attempt_count

---

# Retry Policy

Network operations may fail.

Implement bounded retries.

Example:

Attempt 1

short delay

Attempt 2

larger delay

Attempt 3

fail job

Avoid infinite retries.

---

# Data Freshness

Store timestamps for all external observations.

Examples:

Google information fetched_at

website scanned_at

PageSpeed checked_at

AI analysis created_at

Never present old data as if it is real-time.

---

# Rescanning

Future:

Organizations can be rescanned periodically.

Do not automatically rescan every organization frequently.

Prioritize:

qualified leads  
active sales pipeline  
stale scans

---

# CRM Layer

Keep V1 simple.

Lead statuses:

new  
qualified  
contacted  
interested  
proposal  
won  
lost  
not_relevant

Activities:

note  
call  
email  
meeting  
status_change

Avoid building Salesforce in the MVP.

---

# Future Integrations

Architecture should allow future integrations such as:

CRM export

ClickUp

email enrichment

LinkedIn enrichment

automated proposal creation

sales sequences

Google Sheets

webhook integrations

n8n

These are not MVP requirements.

---

# Compliance & Responsible Data Collection

Prefer official APIs.

Respect website access restrictions.

Do not bypass authentication.

Do not bypass CAPTCHAs.

Do not attempt to access private information.

Only analyze publicly accessible business information.

Avoid excessive crawling.

Implement sensible request delays and concurrency.

---

# MVP Definition of Done

A user can:

1. login,
2. select location,
3. select business category,
4. run discovery,
5. see discovered organizations,
6. run website analysis,
7. see technical signals,
8. see a 0–100 opportunity score,
9. sort leads by score,
10. open a lead,
11. read AI opportunity analysis,
12. change lead status.

If these actions work reliably, V1 is successful.
