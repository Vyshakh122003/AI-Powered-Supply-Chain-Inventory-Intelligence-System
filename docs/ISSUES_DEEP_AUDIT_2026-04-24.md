# StockSense AI Deep Audit (2026-04-24)

Scope: read-only audit of frontend, backend workflow exports, and database schema/seed.
Goal: identify serious engineering/design issues (no code changes), with concrete fix direction.

## Critical Findings

### 1) Cross-tenant data exposure risk in multiple pages (missing tenant scoping)
Severity: Critical

Evidence:
- Reorder queries without store filter: frontend/src/pages/Reorder.jsx:23, frontend/src/pages/Reorder.jsx:32, frontend/src/pages/Reorder.jsx:33
- Logs query without store filter: frontend/src/pages/Logs.jsx:31
- Quick Update products query/update without store filter: frontend/src/pages/QuickUpdate.jsx:23, frontend/src/pages/QuickUpdate.jsx:91
- Deliveries products/suppliers/transactions queries without store filter: frontend/src/pages/Deliveries.jsx:35, frontend/src/pages/Deliveries.jsx:36, frontend/src/pages/Deliveries.jsx:53, frontend/src/pages/Deliveries.jsx:111

Why it matters:
- If RLS is disabled/misconfigured in Supabase, users can read/modify global data.
- Even if RLS is currently enabled, the app is fragile and relies on backend policy correctness for basic tenant safety.

Recommended solution:
- Enforce tenant filter at application layer for every store-scoped query/mutation: .eq('store_id', storeProfile.id).
- Add a shared data-access helper to make store_id mandatory and prevent future omissions.
- Add a startup health check that fails closed if RLS/policies are missing.

---

### 2) Root-cause candidate for your reported multi-user bug: onboarding/profile guard is fail-open
Severity: Critical

Evidence:
- Protected route redirects to onboarding only if storeProfile exists and is incomplete: frontend/src/components/ProtectedRoute.jsx:24
- If storeProfile is null, protected content is allowed: frontend/src/components/ProtectedRoute.jsx:28

Why it matters:
- New users with missing profile rows (or failed profile fetch) can enter protected pages directly.
- Combined with unscoped queries (Finding 1), this can present the exact symptom: signing in with different credentials still shows existing store data.

Recommended solution:
- Make route guard fail-closed:
  - If authenticated but storeProfile is null => force onboarding/profile bootstrap route.
  - Do not render store pages until profile is loaded and validated.
- Add explicit profile creation transaction on signup/login completion with retry and telemetry.

---

### 3) n8n workflows are not tenant-aware and perform global destructive operations
Severity: Critical

Evidence:
- WF-03 fetches all products globally: backend/WF-03-inventory-processing.json:35
- WF-03 deletes all alerts globally each run: backend/WF-03-inventory-processing.json:84
- WF-05 fetches at-risk products globally and suppliers globally: backend/WF-05-ai-reorder-intelligence.json:35, backend/WF-05-ai-reorder-intelligence.json:62
- WF-05 deletes all reorder suggestions globally: backend/WF-05-ai-reorder-intelligence.json:225
- No store_id conditions found in workflow filters across backend JSONs.

Why it matters:
- One store's pipeline run can wipe/replace another store's alerts/suggestions.
- Multi-tenant correctness is fundamentally broken at workflow layer.

Recommended solution:
- Every workflow invocation must carry store_id (or store profile id) input.
- Every Supabase query/update/delete in n8n must include store_id filters.
- Replace global delete-and-recreate with per-store upsert/update patterns.

---

### 4) Webhook security is weak: unauthenticated trigger paths + no API key usage in frontend calls
Severity: Critical

Evidence:
- Public workflow paths: backend/WF-01-product-sales-ingestion.json:13, backend/WF-07-whatsapp-alert-sender.json:13
- Frontend webhook client does not send API key header: frontend/src/lib/config.js:43
- n8n API key variable exists but is unused in app code: frontend/.env.example:15

Why it matters:
- Anyone with endpoint access can trigger ingestion/pipeline/whatsapp flows.
- Abuse can cause data corruption, spam alerts, and quota/cost spikes.

Recommended solution:
- Require signed server-side auth for all workflow triggers.
- Route all client triggers through serverless API handlers that attach secret auth; never direct-call open webhooks from browser.
- Implement replay protection/rate limits and structured audit logs per caller.

---

### 5) Hardcoded PII and environment-coupled endpoints in workflow exports
Severity: Critical

Evidence:
- Hardcoded localhost webhook URLs inside orchestration: backend/WF-08-daily-orchestrator.json:213, backend/WF-08-daily-orchestrator.json:273
- Hardcoded WhatsApp destination in message-builder node: backend/WF-07-whatsapp-alert-sender.json:72
- Hardcoded Twilio account SID in URL: backend/WF-07-whatsapp-alert-sender.json:91

Why it matters:
- Breaks portability across dev/staging/prod.
- PII and provider identifiers leak into versioned workflow artifacts.
- Causes incorrect recipient behavior across tenants.

Recommended solution:
- Externalize all environment-specific values into n8n credentials/variables.
- Resolve recipients from per-store profile (store-scoped) instead of constants.
- Add workflow validation checks that reject export with hardcoded secrets/PII.

## High Findings

### 6) Schema design conflict with multi-tenancy: global UNIQUE keys on business IDs
Severity: High

Evidence:
- Products: product_id is globally unique: database/schema.sql:53
- Suppliers: supplier_id is globally unique: database/schema.sql:92

Why it matters:
- Two different stores cannot use the same business SKU/supplier IDs.
- This is incorrect for SaaS multi-tenant modeling and creates onboarding friction and collisions.

Recommended solution:
- Replace global unique constraints with composite uniqueness:
  - UNIQUE(store_id, product_id)
  - UNIQUE(store_id, supplier_id)
- Update all workflow/frontend lookups to include store_id alongside business IDs.

---

### 7) Store-scoped tables allow NULL store_id
Severity: High

Evidence:
- Store ID is nullable across major tables: database/schema.sql:64, database/schema.sql:105, database/schema.sql:132, database/schema.sql:164, database/schema.sql:190, database/schema.sql:217, database/schema.sql:245
- App writes null store_id in some paths: frontend/src/pages/QuickUpdate.jsx:108, frontend/src/pages/Deliveries.jsx:127

Why it matters:
- Orphaned rows break tenant isolation and analytics correctness.
- Data can become invisible under strict RLS, causing confusing behavior.

Recommended solution:
- Make store_id NOT NULL for all tenant tables.
- Add FK constraints to Store Profiles and backfill migration for existing rows.
- Remove fallback writes that insert null store_id.

---

### 8) Seed data is not tenant-scoped
Severity: High

Evidence:
- Seed inserts products/suppliers without store_id columns: database/seed.sql:22, database/seed.sql:46

Why it matters:
- In environments without strict RLS/policies, all users can see same demo data.
- This strongly aligns with your reported multi-user symptom.

Recommended solution:
- Seed per-store fixtures with explicit store_id.
- Add separate demo bootstrap script that creates a test user + profile + scoped seed set atomically.

---

### 9) Workflow-level full-refresh delete strategy risks data races and user action loss
Severity: High

Evidence:
- WF-03 global delete then recreate alerts: backend/WF-03-inventory-processing.json:84
- WF-05 global delete then recreate suggestions: backend/WF-05-ai-reorder-intelligence.json:225

Why it matters:
- Can erase dismissed/approved states and produce churn.
- Racy behavior under concurrent runs/manual triggers.

Recommended solution:
- Use idempotent upserts scoped by (store_id, business_id).
- Preserve state transitions and update only changed records.
- Introduce workflow run lock or dedupe keys.

## Medium Findings

### 10) Route surface inconsistency and hidden/non-functional pages
Severity: Medium

Evidence:
- Deliveries page imported but route commented out: frontend/src/App.jsx:81
- Public dashboard preview route exists: frontend/src/App.jsx:60

Why it matters:
- Product expectations and docs diverge from actual app behavior.
- Increases confusion during QA and demos.

Recommended solution:
- Align route table with intended product scope.
- Gate preview routes behind explicit demo mode if needed.

---

### 11) Realtime subscriptions are broad and unfiltered
Severity: Medium

Evidence:
- Multiple channels subscribe to full-table events without per-store filters, then refetch: frontend/src/pages/Dashboard.jsx:70, frontend/src/pages/Alerts.jsx:51, frontend/src/pages/Products.jsx:136, frontend/src/pages/Reorder.jsx:65, frontend/src/pages/Logs.jsx:69

Why it matters:
- Excess event traffic and unnecessary refetches.
- Leans heavily on backend RLS behavior for correctness.

Recommended solution:
- Add channel filters by store_id where supported.
- Debounce/throttle refetches and use event payload narrowing.

---

### 12) No migration history despite complex schema evolution
Severity: Medium

Evidence:
- database/migrations contains only README, no executable migrations.

Why it matters:
- Hard to reproduce environments and safely evolve constraints.
- Increases drift between local/demo/prod data behavior.

Recommended solution:
- Introduce numbered SQL migrations for every structural change.
- Add CI drift check against schema baseline.

## Notes Specific to Your Reported Bug

Most probable chain causing "different user sees same store data":
1. Seed/global data exists without store_id scoping (database/seed.sql).
2. One or more pages query without store_id filters (Reorder/Logs/QuickUpdate/Deliveries).
3. Route guard allows access when profile bootstrap fails/null (ProtectedRoute fail-open).
4. Workflows themselves are global (no store_id filters), further mixing tenant data.

This means your observation is consistent with current architecture and is not a one-off edge case.

## Suggested Remediation Order (discussion roadmap)

1. Tenant safety baseline (guard + mandatory store filters + NOT NULL store_id).
2. Workflow tenantization (pass store_id through WF-01..WF-08 and remove global deletes).
3. Schema fixes (composite unique keys by store, FK tightening, migration scripts).
4. Security hardening (authenticated trigger path, server-side signing, rate limiting).
5. Data reset and backfill (clean mixed global rows, re-seed per store).

---

Prepared for iterative fix discussions; no code changes were applied in this audit.