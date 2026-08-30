# Lead Intelligence Platform
## Development Roadmap

The product must be developed incrementally.

Do not attempt to implement the entire product in one giant change.

Each phase should result in a working application.

---

# PHASE 0 — Project Foundation

Goal:

Create a clean production-ready base.

Implement:

Monorepo

Next.js web app

Node.js worker

shared TypeScript configuration

Supabase integration

environment configuration

authentication

database migrations

basic dashboard shell

basic logging

Deliverable:

User can log into the application and access the dashboard.

---

# PHASE 1 — Organization Database

Goal:

Create the core business data layer.

Implement:

organizations table

source_records table

organization_sources

search_jobs

basic repository layer

organization CRUD

Lead Explorer empty state

Deliverable:

Organizations can be stored and viewed.

---

# PHASE 2 — Google Places Discovery

Goal:

Allow users to discover local businesses.

Implement GooglePlacesSource adapter.

Search fields:

country  
city  
district  
category

Optional filters:

minimum rating  
minimum reviews

Store:

Place ID

business name

category

address

coordinates

phone if available

website if available

rating

review count

Implement:

pagination handling

API error handling

cost-conscious field selection

search job status

Deliverable:

User searches:

Istanbul  
Kadıköy  
Kindergarten

and sees discovered businesses.

---

# PHASE 2A — Modular SaaS Discovery Foundation

Status:

Slices 1–6 implemented. Homepage enrichment and deterministic score persistence are connected to the worker pipeline.

Goal:

Convert discovery from category text coupled to a concrete provider into a workspace-scoped, versioned vertical-module architecture before adding more industries.

Implement in approval-gated slices:

1. vertical contracts, registry and `kindergarten@1.0.0`;
2. provider-independent discovery orchestrator;
3. workspace, membership and RLS migration;
4. module-driven discovery UI;
5. usage metering and provider-neutral entitlements;
6. kindergarten enrichment and scoring profile.

Rules:

- Do not add category-specific branches to the worker or source adapters.
- Do not deploy separate microservices per industry.
- Store module version and immutable job configuration for reproducibility.
- Attribute external API usage to a workspace.
- Require tenant-isolation, adapter-contract and idempotency tests.

Deliverable:

Selecting `Anaokulu` invokes a dedicated, testable kindergarten lead-discovery module while the same core pipeline remains open to future verticals.

Detailed plan: [MODULAR_SAAS_ARCHITECTURE.md](./MODULAR_SAAS_ARCHITECTURE.md).

---

# PHASE 3 — Normalization & Duplicate Resolution

Goal:

Prevent duplicate organizations.

Implement normalization for:

business names  
domains  
phones  
URLs  
addresses

Deduplication priority:

Google Place ID

domain

phone

email

name + address

Store source provenance.

Deliverable:

Multiple source records can map to one organization.

---

# PHASE 4 — Website Scanner V1

Goal:

Extract deterministic website data.

Implement crawler package.

Analyze homepage.

Extract:

HTTP status

HTTPS

title

meta description

H1

H2

canonical

robots

sitemap

schema

phone links

email links

WhatsApp

forms

CTA indicators

GA4

GTM

Meta Pixel

CMS signals

Deliverable:

Lead page displays website analysis.

---

# PHASE 5 — Worker & Background Jobs

Goal:

Move heavy tasks away from web requests.

Implement:

crawl_jobs

worker process

job claim mechanism

job progress

retry strategy

failed jobs

batch scanning

Deliverable:

User can start analysis on 100 businesses without blocking the frontend.

---

# PHASE 6 — PageSpeed Integration

Goal:

Add performance intelligence.

Use PageSpeed Insights API.

Collect:

performance

SEO

accessibility

best practices

Store results with timestamps.

Implement caching.

Do not repeatedly call PageSpeed for unchanged recent scans.

Deliverable:

Lead detail contains technical performance scores.

---

# PHASE 7 — Lead Scoring V1

Goal:

Rank businesses by sales opportunity.

Implement scoring engine.

Score components:

Business Strength /30

Digital Opportunity /30

Commercial Potential /25

Contactability /15

Total /100

Scoring configuration should be centralized.

Store:

score

breakdown

version

created_at

Deliverable:

Lead Explorer sortable by Opportunity Score.

---

# PHASE 8 — AI Opportunity Analysis

Goal:

Explain the lead to a salesperson.

Implement structured OpenAI analysis.

Input:

organization

reputation

website scan

performance

score breakdown

Output:

summary

strengths

weaknesses

recommended services

sales angle

confidence

Use schema validation.

Deliverable:

Each analyzed lead has a clear human-readable opportunity explanation.

---

# PHASE 9 — Lead Explorer UX

Goal:

Turn raw data into a useful sales workspace.

Implement filters:

location

category

rating

review count

website

performance

opportunity score

tracking technology

lead status

Sorting:

opportunity

rating

reviews

performance

newest

Implement pagination.

Deliverable:

Hundreds or thousands of leads can be explored efficiently.

---

# PHASE 10 — Lead Detail UX

Implement sections:

Business Overview

Reputation

Website Health

SEO

Performance

Tracking

Conversion Infrastructure

Technology

Opportunity Score

AI Analysis

Recommended Services

Source History

Activity

Deliverable:

A salesperson can understand a business in under 60 seconds.

---

# PHASE 11 — Lightweight CRM

Goal:

Track sales progress.

Implement lead states:

new

qualified

contacted

interested

proposal

won

lost

not_relevant

Implement:

notes

activities

status history

Deliverable:

Application can be used daily without another basic CRM.

---

# PHASE 12 — CSV Import

Implement CsvLeadSource.

Requirements:

CSV upload

column mapping

preview

normalization

deduplication

import report

Example report:

1,000 rows

880 created

94 matched existing organizations

26 invalid

---

# PHASE 13 — Additional Sources

Add source adapters individually.

Every new source must use the LeadSource interface.

Never modify core lead processing specifically for one source.

Potential sources:

industry directories

public association directories

external lead APIs

manual imports

---

# PHASE 14 — Advanced Website Analysis

Possible improvements:

multi-page crawl

blog freshness

service page detection

appointment detection

social profile discovery

schema quality

mobile UX indicators

content depth

broken links

technology fingerprinting

Do not implement until basic scoring is proven useful.

---

# PHASE 15 — Rescan & Monitoring

Implement controlled rescanning.

Possible triggers:

manual rescan

stale website scan

qualified lead

scheduled review

Store scan history.

Allow comparison:

Previous scan

vs

Current scan.

---

# PHASE 16 — Sales Intelligence Enhancements

Potential features:

service recommendation confidence

estimated sales opportunity

industry-specific scoring

lead tags

saved searches

lead lists

assignment to team members

sales scripts

proposal generation

---

# PHASE 17 — Automation

Potential integrations:

n8n

webhooks

CRM

email

ClickUp

Google Sheets

Examples:

High score lead discovered  
→ webhook

Lead enters proposal stage  
→ ClickUp task

Lead score > 85  
→ notify sales team

---

# FIRST PILOT

Do not initially optimize for every industry.

Choose one local-service vertical.

Good pilot examples:

Kindergartens

Dental clinics

Medical clinics

Beauty businesses

Construction companies

Real estate businesses

Local professional services

Pilot objective:

Determine whether the scoring model actually surfaces sales opportunities.

---

# PILOT SUCCESS METRICS

Measure:

Organizations discovered

Valid websites found

Websites successfully scanned

High opportunity leads identified

Manual salesperson agreement with scores

Leads contacted

Positive responses

Meetings generated

Proposals generated

Customers won

The ultimate metric is not:

"How many websites were scanned?"

The ultimate metric is:

"Does the system find businesses worth contacting?"

---

# DEVELOPMENT ORDER

Recommended implementation order:

Phase 0  
↓  
Phase 1  
↓  
Phase 2  
↓  
Phase 3  
↓  
Phase 4  
↓  
Phase 5  
↓  
Phase 7  
↓  
Phase 6  
↓  
Phase 8  
↓  
Phase 9  
↓  
Phase 10  
↓  
Phase 11

Do not delay MVP because of advanced integrations.

---

# CODING TASK SIZE

Codex should prefer small coherent tasks.

Good:

"Implement GooglePlacesSource and unit tests."

Good:

"Create organization and source_records migrations."

Good:

"Implement website metadata extraction."

Bad:

"Build the entire Lead Intelligence Platform."

Large features should be decomposed before implementation.

---

# BEFORE EACH MAJOR IMPLEMENTATION

Codex should:

1. inspect AGENTS.md
2. inspect relevant docs
3. inspect existing code
4. identify affected packages
5. state implementation approach
6. implement smallest useful change
7. run tests
8. run typecheck
9. run lint
10. summarize changed files

---

# MVP TARGET

The first commercially useful version should support this exact scenario:

User searches:

Turkey  
→ Istanbul  
→ Kadıköy  
→ Kindergarten

System discovers businesses.

System ranks them.

User applies:

Rating ≥ 4.2

Reviews ≥ 30

Opportunity Score ≥ 70

System returns businesses with:

strong reputation

weak digital infrastructure

clear recommended services

clear sales reasoning.

This scenario should be treated as the primary MVP acceptance test.
