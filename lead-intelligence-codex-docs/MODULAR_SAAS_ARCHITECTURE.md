# Krenora Modular SaaS Architecture

Status: Approved on 2026-08-30 — Slices 1–6 implemented.

## 1. Decision

Krenora will remain a modular monolith. The platform core will own tenancy, jobs, source orchestration, canonical organizations, usage metering and shared UI. Industry-specific behavior will be supplied by versioned vertical modules.

Selecting `Anaokulu` will resolve the `kindergarten` vertical module. The module will create kindergarten-specific search intents, qualification rules, enrichment priorities, scoring configuration and UI metadata without adding kindergarten conditions to the generic worker, Google Places adapter or database repository.

This design must support later modules such as `dental-clinic`, `beauty-business` and `real-estate` without editing the core discovery flow.

Kindergarten is only the first vertical. Every future sector must be implemented as an independently versioned module that uses the same contracts, registry, orchestration pipeline and quality gates. Sectors must not be accumulated as conditional branches inside a shared "industry service". A workspace may enable one or many modules, and each module may evolve, be disabled or be upgraded without changing another module.

Examples of future modules include:

- `dental-clinic`;
- `medical-clinic`;
- `beauty-business`;
- `real-estate`;
- `construction-company`;
- `professional-services`.

Adding one of these modules must require only its implementation, tests, manifest and one composition-root registration. It must not require changes to the generic discovery orchestrator, source adapters or existing vertical modules.

## 2. Boundaries

### Platform core

The core owns:

- workspaces, members, roles and row-level access;
- plan entitlements, quotas and usage events;
- job lifecycle, retries, idempotency and observability;
- lead-source ports and adapter selection;
- normalization, provenance and entity resolution;
- canonical organizations and organization-to-vertical assignments;
- generic website scanning and deterministic signals;
- module registry and version resolution.

The core must not contain `if category === "Anaokulu"` branches.

### Vertical module

A vertical module owns:

- stable key, semantic version and localized label;
- source-specific category aliases and search-intent generation;
- supported discovery filters and default values;
- deterministic inclusion, exclusion and confidence rules;
- enrichment priorities relevant to the vertical;
- a versioned scoring profile built from shared scoring primitives;
- module-specific lead explanation labels and form metadata;
- fixtures, contract tests and acceptance tests.

A vertical module must not:

- call Supabase directly;
- own authentication, billing or job state;
- expose API secrets;
- instantiate a concrete source adapter;
- mutate another workspace's data;
- duplicate generic normalization or crawling logic.

### Source adapter

Source adapters such as Google Places own only provider communication and mapping provider responses to `RawLead`. They receive a generic search intent and must not know what a kindergarten is.

## 3. Core Contracts

The implementation should converge on small, substitutable interfaces. Exact TypeScript names may change during implementation, but responsibility boundaries are fixed.

```ts
type VerticalKey = "kindergarten" | (string & {});

interface VerticalModule {
  readonly manifest: VerticalManifest;
  buildSearchIntents(input: VerticalDiscoveryInput): SearchIntent[];
  qualify(lead: CanonicalLeadInput, context: QualificationContext): QualificationResult;
  enrichmentPolicy(context: EnrichmentContext): EnrichmentPolicy;
  scoringProfile(): ScoringProfile;
}

interface LeadSource {
  readonly name: string;
  search(intent: SearchIntent): Promise<RawLead[]>;
}

interface VerticalRegistry {
  get(key: VerticalKey, version?: string): VerticalModule;
}

interface SourceRegistry {
  get(key: string): LeadSource;
}

interface DiscoveryOrchestrator {
  execute(job: DiscoveryJob): Promise<DiscoveryResult>;
}
```

`DiscoveryOrchestrator` depends on registries and repository ports. The worker is only the composition root and polling host. This applies Dependency Inversion and prevents orchestration from depending directly on Google Places or Supabase implementations.

## 4. Planned Package Structure

```text
apps/
  web/                         SaaS UI and server actions
  worker/                      process host and dependency composition

packages/
  shared/                      cross-boundary primitives and validated schemas
  database/                    repository implementations
  sources/                     provider adapters
  lead-engine/                 normalization and entity resolution
  discovery/                   provider-independent orchestration use cases
  verticals/
    src/core/                  contracts, registry and shared rule primitives
    src/kindergarten/          kindergarten module
  scoring/                     generic deterministic scoring engine
  crawler/                     generic public website analysis
  ai/                          structured AI interpretation
```

Vertical modules are internal product modules, not independently deployed microservices. A new module should be registered through one composition point and tested through the same contract suite.

Each module has an independent lifecycle:

- semantic version;
- enabled/disabled state per workspace;
- module-specific configuration with a validated schema;
- isolated fixtures and rule tests;
- explicit data migration notes when its persisted configuration changes;
- backward-compatible execution of jobs pinned to an older supported version.

## 5. Kindergarten Module V1

### Manifest

- Key: `kindergarten`
- Label: `Anaokulu`
- Initial version: `1.0.0`
- Locale: `tr-TR`
- Supported source: `google_places`
- Default minimum rating: `4.2`
- Default minimum reviews: `30`

### Search intent expansion

One user selection may create multiple provider-neutral intents. Initial Turkish aliases:

- `anaokulu`
- `özel anaokulu`
- `kreş`
- `gündüz bakımevi`
- `okul öncesi eğitim kurumu`

Intent expansion must be bounded and cost-aware. Results are deduplicated by strong provider and canonical identity signals. The job stores intent count, provider calls and result metrics.

### Qualification

The module classifies each result as:

- `qualified`: strong category evidence and required business signals;
- `review`: incomplete or conflicting evidence;
- `excluded`: deterministic exclusion reason;

Qualification stores reason codes and module version. Weak business-name similarity alone never merges or qualifies an organization.

Approved product rule: prioritize private/commercial kindergartens and keep public institutions out of the primary lead list. Uncertain ownership remains in `review`; it is not silently discarded.

### Enrichment priorities

The generic scanner will collect signals. The kindergarten module decides which signals matter most:

- enrollment/application CTA;
- appointment or school-tour request;
- phone and WhatsApp contactability;
- mobile performance;
- LocalBusiness or EducationalOrganization schema;
- location and service-area clarity;
- analytics and advertising tag detection;
- trust-oriented content signals, without collecting private child or parent data.

### Scoring

The existing four score groups remain stable. Kindergarten-specific weights are supplied through a versioned `ScoringProfile`; the module does not fork the scoring engine.

AI may explain results but cannot alter deterministic qualification or the numeric score.

## 6. SaaS Tenancy Model

The current `user_id` ownership model will evolve to workspace tenancy before production customer onboarding.

Planned entities:

- `workspaces` — SaaS tenant;
- `workspace_members` — user membership and role;
- `workspace_verticals` — enabled module, version and workspace configuration;
- `workspace_subscriptions` — provider-neutral plan and entitlement state;
- `usage_events` — append-only billable usage ledger;
- `organization_verticals` — organization classification per module/version;
- existing jobs and business records gain `workspace_id` and `requested_by`.

Roles for V1:

- `owner`
- `admin`
- `member`
- `viewer`

RLS must authorize through active workspace membership. Service-role worker access remains server-only. Repository methods must require a `WorkspaceContext`; callers may not pass an arbitrary tenant ID as an unchecked string.

Stripe or another payment provider will not be introduced in the first refactor. Subscription and entitlement ports will remain provider-neutral so billing can be added without changing discovery modules.

## 7. Entitlements, Quotas and Cost Control

Every provider call must be attributable to a workspace, job, vertical module and source.

Initial meter types:

- discovery jobs created;
- provider search requests;
- raw records returned;
- organizations created or updated;
- website scans;
- PageSpeed requests;
- AI analyses.

Quota is reserved before expensive work and settled after execution. Failed or retried calls record an outcome. Idempotency fingerprints prevent accidental duplicate jobs for the same workspace, module version, geography, filters and time window.

## 8. Job and Data Changes

`search_jobs` will gain:

- `workspace_id`;
- `requested_by`;
- `vertical_key`;
- `vertical_version`;
- validated `input` JSON;
- immutable `module_snapshot` JSON;
- `idempotency_key`;
- provider-call and intent metrics.

The module snapshot makes completed jobs reproducible after module defaults change.

`organizations.category` remains a source-facing descriptive field. Product classification moves to `organization_verticals`, because one organization may belong to multiple verticals and classifications can change independently of raw provider data.

## 9. UI Behavior

The category picker reads safe manifest metadata from the vertical registry. Selecting `Anaokulu` loads only fields supported by the kindergarten module and shows its default filters.

The browser sends `verticalKey`, location and user overrides. It does not send source query aliases, scoring weights or trusted module configuration. The server resolves the enabled module for the active workspace and validates input again.

The job screen shows:

- module and version;
- workspace;
- generated intent count;
- provider-call usage;
- qualified, review and excluded counts;
- retry and failure status.

## 10. SOLID Enforcement

- Single Responsibility: source adapters fetch, modules describe vertical behavior, orchestrators coordinate, repositories persist, workers host processes.
- Open/Closed: a new vertical is added through a module and registry entry; the generic pipeline remains unchanged.
- Liskov Substitution: every source and vertical module must pass shared contract tests.
- Interface Segregation: discovery, qualification, enrichment and scoring use narrow ports instead of one infrastructure service.
- Dependency Inversion: use cases depend on contracts; concrete Supabase and Google implementations are wired only at application composition roots.

Code review must reject category-specific branches in generic packages unless the architecture document is explicitly amended.

## 11. Delivery Plan

### Slice 1 — Contracts and kindergarten module

Status: Implemented.

- add shared validated identifiers and discovery schemas;
- add vertical registry and contract tests;
- implement the `kindergarten@1.0.0` manifest, intent builder and qualification rules;
- keep external calls mocked in module tests.

Deliverable: selecting the module produces deterministic, testable search intents without calling infrastructure.

### Slice 2 — Provider-independent discovery orchestration

Status: Implemented.

- add `packages/discovery`;
- introduce source and repository ports;
- move direct Google/Supabase coordination out of the worker;
- make the worker resolve handlers from registries;
- add idempotency and partial-failure metrics.

Deliverable: the same orchestration test runs with fake sources and repositories.

### Slice 3 — Workspace tenancy migration

Status: Implemented.

- add workspace, membership and enabled-module tables;
- backfill one personal workspace per existing user;
- add `workspace_id` alongside current ownership columns;
- update RLS and repositories through a compatibility migration;
- verify cross-workspace isolation tests before removing legacy ownership assumptions.

Deliverable: two workspaces cannot read or mutate each other's jobs or leads.

### Slice 4 — Module-driven discovery UI

Status: Implemented.

- replace the hard-coded category token with module manifests;
- resolve active workspace server-side;
- render module-supported filters;
- expose job qualification and usage metrics;
- preserve the current design system.

Deliverable: `Anaokulu` launches the kindergarten module and its settings; disabled modules cannot be executed.

### Slice 5 — Metering and entitlement boundary

Status: Implemented.

- implement append-only usage events;
- add plan limits and reservation checks;
- surface quota state in the UI;
- keep billing provider integration out of this slice.

Deliverable: provider calls are tenant-attributed and cannot exceed configured limits.

### Slice 6 — Kindergarten enrichment and score profile

Status: Implemented.

- connect generic website signals to kindergarten enrichment policy;
- add the versioned scoring profile;
- store score input and module version;
- add end-to-end fixtures for strong-business/weak-digital cases.

Deliverable: kindergarten leads are ranked using reproducible vertical rules.

## 12. Quality Gates

Each slice requires:

- unit tests for pure rules;
- contract tests for registries and adapters;
- tenant-isolation tests for repositories and RLS;
- idempotency and retry tests for jobs;
- migration rollback or forward-fix notes;
- typecheck, lint and production build;
- no real provider calls in the default test suite.

## 13. Approved Decisions

The product owner approved:

1. workspace-based SaaS tenancy;
2. independently versioned modules for every future sector;
3. the vertical-module boundary and delivery order;
4. private/commercial prioritization for Kindergarten V1, with uncertain results retained for review;
5. Slice 1 and Slice 2 as the first coding milestone.

Slice 3 is the next approval-sensitive milestone because it changes ownership columns and RLS policies.
