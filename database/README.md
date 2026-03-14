# StockSense AI — Database Documentation

## Overview

The StockSense AI database runs on **Supabase (PostgreSQL 15)** and consists of 8 tables that support an AI-powered inventory management system for small Indian kirana stores.

The schema is designed around three principles:
1. **Denormalization for speed** — product names are stored alongside foreign keys in alerts/suggestions to avoid JOINs in the frontend
2. **Multi-tenancy readiness** — every table has a `store_id` column for future Row Level Security (RLS) policies
3. **Immutable audit trail** — Stock Transactions provides a complete ledger of all stock changes

## Entity Relationship Diagram

```
┌──────────────────┐
│  Store Profiles   │  ← One per registered user (auth.users)
│  (store_id = id)  │
└────────┬─────────┘
         │ store_id (future FK on all tables)
         │
    ┌────┴────────────────────────────────────────────┐
    │                     │                            │
    ▼                     ▼                            ▼
┌──────────┐      ┌────────────┐              ┌──────────────┐
│ Products │      │ Suppliers  │              │ System Logs  │
│          │      │            │              │              │
└────┬─────┘      └─────┬──────┘              └──────────────┘
     │                  │
     │ product_id       │ supplier_id
     │                  │
     ├──────────────────┤
     │                  │
     ▼                  ▼
┌──────────────┐  ┌────────────────────┐
│ Stock Alerts │  │ Reorder Suggestions│
│ (FK→Products)│  │ (FK→Suppliers)     │
└──────────────┘  └────────────────────┘

     │
     ▼
┌────────────────────┐     ┌─────────────────┐
│ Stock Transactions │     │ Daily Snapshots  │
│ (audit ledger)     │     │ (daily metrics)  │
└────────────────────┘     └─────────────────┘
```

## Tables

### 1. Store Profiles
**Purpose:** Registration and configuration for each kirana store.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Internal identifier |
| `user_id` | UUID UNIQUE | Links to `auth.users.id` |
| `store_name` | TEXT | Display name of the store |
| `owner_name` | TEXT | Store owner's full name |
| `whatsapp_numbers` | TEXT | Comma-separated WhatsApp numbers for alerts |
| `city` | TEXT | City location |
| `store_type` | TEXT | Kirana, Supermarket, Wholesale (default: Kirana) |
| `safety_factor` | NUMERIC | Reorder buffer multiplier 1.0–2.0 (default: 1.2) |
| `alert_time` | TIME | Preferred daily alert time (default: 08:00) |
| `timezone` | TEXT | IANA timezone (default: Asia/Kolkata) |
| `onboarding_complete` | BOOLEAN | Whether onboarding flow is done |

**Design decision:** `store_name` and `owner_name` are required at signup. Other fields are filled during the onboarding flow, allowing a fast initial registration.

### 2. Products
**Purpose:** Master product catalog with stock levels, sales velocity, and risk classification.

| Column | Type | Description |
|--------|------|-------------|
| `product_id` | TEXT UNIQUE | Business key (e.g., MILK_001) |
| `product_name` | TEXT | Human-readable name |
| `category` | TEXT | Product category for grouping |
| `current_stock` | INTEGER | Units currently in stock |
| `avg_daily_sales` | NUMERIC | Rolling average daily sales |
| `reorder_threshold` | INTEGER | Stock level triggering alerts |
| `unit_price` | NUMERIC | Price per unit in INR |
| `days_to_stockout` | INTEGER | Calculated by WF-02 |
| `estimated_stockout_date` | DATE | Calculated by WF-02 |
| `risk_level` | TEXT | HIGH/MEDIUM/LOW/UNKNOWN (set by WF-04) |
| `preferred_supplier_id` | TEXT | Default supplier for reorders |
| `safety_factor` | NUMERIC | Product-level reorder buffer |
| `expiry_days` | INTEGER | Shelf life (NULL = non-perishable) |
| `is_seasonal` | BOOLEAN | Seasonal demand flag |

**Design decision:** `days_to_stockout` and `risk_level` are calculated fields updated by n8n workflows, not computed columns, because the calculation logic lives in the workflow layer and may involve AI/ML models.

**Indexes:** `product_id`, `risk_level`, `category`, `store_id`

### 3. Suppliers
**Purpose:** Supplier directory with automated scoring.

| Column | Type | Description |
|--------|------|-------------|
| `supplier_id` | TEXT UNIQUE | Business key (e.g., SUP_001) |
| `supplier_name` | TEXT | Company name |
| `reliability_score` | NUMERIC | 0.0–1.0 scale (displayed as /10) |
| `price_score` | NUMERIC | 0.0–1.0 scale (displayed as /10) |
| `composite_score` | NUMERIC | 0–100 weighted score |
| `supplier_grade` | TEXT | A/B/C/D letter grade |
| `score_breakdown` | TEXT | Human-readable score explanation |
| `supplies_categories` | TEXT | JSON array of supplied categories |

**Design decision:** Scores are stored as 0.0–1.0 (normalized) because WF-06 performs weighted calculations. The frontend multiplies by 10 for display. `supplies_categories` is stored as a JSON string rather than a PostgreSQL array because n8n's Supabase node handles JSON strings more reliably.

### 4. Stock Alerts
**Purpose:** Low stock notifications generated by WF-03.

| Column | Type | Description |
|--------|------|-------------|
| `product_id` | TEXT FK | References `Products.product_id` |
| `product_name` | TEXT | Denormalized for display |
| `alert_name` | TEXT | Human-readable title |
| `alert_status` | TEXT | Active or Dismissed |

**Design decision:** `product_name` is denormalized to avoid JOINs — the alerts table is queried frequently by the dashboard and alert pages, and the name rarely changes.

**Foreign key:** `product_id` → `Products.product_id` (CASCADE delete)

### 5. Reorder Suggestions
**Purpose:** AI-generated reorder recommendations from WF-05.

| Column | Type | Description |
|--------|------|-------------|
| `product_id` | TEXT | Which product to reorder |
| `supplier_id` | TEXT FK | Recommended supplier |
| `suggested_quantity` | INTEGER | How many units to order |
| `reason` | TEXT | AI-generated explanation |
| `status` | TEXT | Pending/Approved/Dismissed |
| `ai_generated` | BOOLEAN | Whether AI or manual |

**Foreign key:** `supplier_id` → `Suppliers.supplier_id` (CASCADE delete)

### 6. Stock Transactions
**Purpose:** Immutable audit log of all stock changes.

| Column | Type | Description |
|--------|------|-------------|
| `product_id` | TEXT | Which product changed |
| `transaction_type` | TEXT | sale/restock/adjustment/delivery/manual_update |
| `quantity_change` | INTEGER | Positive = in, negative = out |
| `new_stock_level` | INTEGER | Stock after this transaction |

**Design decision:** This is an append-only ledger. Rows are never updated or deleted. This provides a complete audit trail for any stock discrepancy investigation.

### 7. Daily Snapshots
**Purpose:** Daily health metrics for trend analysis.

| Column | Type | Description |
|--------|------|-------------|
| `snapshot_date` | DATE | Which day |
| `health_score` | NUMERIC | 0–100 inventory health |
| `total_products` | INTEGER | Total SKUs |
| `oos_count` | INTEGER | Out-of-stock count |
| `high_count`/`medium_count`/`low_count` | INTEGER | Risk distribution |

**Design decision:** One row per store per day. The Reports page charts health_score over time to show inventory health trends.

### 8. System Logs
**Purpose:** n8n workflow execution log.

| Column | Type | Description |
|--------|------|-------------|
| `workflow_name` | TEXT | e.g., "WF-08 Daily Orchestrator" |
| `status` | TEXT | success/error/warning |
| `records_processed` | INTEGER | How many records were processed |
| `error_message` | TEXT | Error details if failed |

## Workflow Data Flow

```
WF-01 Ingestion      → Upserts into Products
WF-02 Stockout Calc  → Updates Products.days_to_stockout, estimated_stockout_date
WF-03 Inventory Proc → Reads Products → Inserts Stock Alerts
WF-04 Risk Classify  → Updates Products.risk_level
WF-05 AI Reorder     → Reads Products + Suppliers → Inserts Reorder Suggestions
WF-06 Supplier Score  → Updates Suppliers scores and grades
WF-07 WhatsApp       → Reads Stock Alerts → Sends messages (no DB writes)
WF-08 Orchestrator   → Triggers WF-02→WF-03→WF-04→WF-05→WF-06
                        Also writes Daily Snapshots + Stock Transactions
```

## Restoring from Scratch

To recreate the database on a fresh Supabase project:

```bash
# 1. Run the schema (creates all tables, indexes, and constraints)
#    Copy database/schema.sql → Supabase Dashboard → SQL Editor → Run

# 2. Seed with demo data
#    Copy database/seed.sql → SQL Editor → Run

# 3. Enable Realtime (already in schema.sql, but verify in Dashboard)
#    Dashboard → Database → Replication → Verify tables are listed

# 4. Run the pipeline to generate alerts and suggestions
#    App → Settings → Click "Run Full Pipeline"
```

## Resetting for Demos

Before every presentation, run `database/demo_reset.sql` in the SQL Editor, then trigger "Run Full Pipeline" from the Settings page. This resets all stock levels and clears generated data, giving a clean starting point for the demo.
